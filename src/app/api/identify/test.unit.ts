import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Mocks
import { VERIFIED_SESSION } from '@test/vitest/data/session.mock';

// Auth
import { VERIFY_REQUIRED_MESSAGE } from '@/lib/auth/constants';
import { UnverifiedEmailError } from '@/lib/auth/errors';

// Routes
import { POST } from './route';

const { identifySpeciesMock, PlantNetError, readIdentifyFormMock, requireVerifiedUserMock } = vi.hoisted(() => {
    return {
        identifySpeciesMock: vi.fn(),
        PlantNetError: class PlantNetError extends Error {
            readonly httpStatus: number;

            constructor(message: string, httpStatus: number) {
                super(message);
                this.name = 'PlantNetError';
                this.httpStatus = httpStatus;
            }
        },
        readIdentifyFormMock: vi.fn(),
        requireVerifiedUserMock: vi.fn()
    };
});

vi.mock('@/lib/auth/session', () => {
    return {
        requireVerifiedUser: requireVerifiedUserMock
    };
});

vi.mock('@/services/server/plantnet', () => {
    return {
        identifySpecies: identifySpeciesMock,
        PlantNetError,
        readIdentifyForm: readIdentifyFormMock
    };
});

describe('/api/identify', () => {
    beforeEach(() => {
        readIdentifyFormMock.mockResolvedValue(new FormData());
    });

    it('answers 403 with the verify message and does not call PlantNet when the session is unverified', async () => {
        requireVerifiedUserMock.mockRejectedValue(new UnverifiedEmailError());

        const response = await POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }));

        expect(response.status).toBe(HttpStatus.Forbidden);
        await expect(response.json()).resolves.toEqual({
            error: VERIFY_REQUIRED_MESSAGE,
            code: 'unverified'
        });
        expect(identifySpeciesMock).not.toHaveBeenCalled();
    });

    it('calls identifySpecies and answers 200 with its result when the session is verified', async () => {
        requireVerifiedUserMock.mockResolvedValue(VERIFIED_SESSION);
        const results = [{
            species: 'Monstera deliciosa',
            commonName: 'Monstera',
            confidence: 0.9,
            defaultCare: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            careSource: 'reference'
        }];
        identifySpeciesMock.mockResolvedValue(results);

        const response = await POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }));

        expect(response.status).toBe(HttpStatus.Ok);
        await expect(response.json()).resolves.toEqual(results);
        expect(identifySpeciesMock).toHaveBeenCalledTimes(1);
    });

    it('rethrows a non-UnverifiedEmailError rejection instead of answering 403', async () => {
        requireVerifiedUserMock.mockRejectedValue(new Error('NEXT_REDIRECT'));

        await expect(POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }))).rejects.toThrow('NEXT_REDIRECT');
        expect(identifySpeciesMock).not.toHaveBeenCalled();
    });

    it('preserves the PlantNetError http status', async () => {
        requireVerifiedUserMock.mockResolvedValue(VERIFIED_SESSION);
        identifySpeciesMock.mockRejectedValue(new PlantNetError('bad image', 400));

        const response = await POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }));

        expect(response.status).toBe(HttpStatus.BadRequest);
        await expect(response.json()).resolves.toEqual({
            error: 'bad image'
        });
    });

    it('answers 413 and never calls identifySpecies when the upload is too large', async () => {
        requireVerifiedUserMock.mockResolvedValue(VERIFIED_SESSION);
        readIdentifyFormMock.mockRejectedValue(new PlantNetError('too large', 413));

        const response = await POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }));

        expect(response.status).toBe(HttpStatus.PayloadTooLarge);
        await expect(response.json()).resolves.toEqual({
            error: 'too large'
        });
        expect(identifySpeciesMock).not.toHaveBeenCalled();
    });
});
