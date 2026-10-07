import { describe, expect, it, vi } from 'vitest';

// Mocks
import { VERIFIED_SESSION } from '@test/vitest/data/session.mock';

// Auth
import { VERIFY_REQUIRED_MESSAGE } from '@/lib/auth/constants';
import { UnverifiedEmailError } from '@/lib/auth/errors';

// Routes
import { POST } from './route';

const { identifySpeciesMock, PlantNetError, requireVerifiedUserMock } = vi.hoisted(() => {
    return {
        identifySpeciesMock: vi.fn(),
        PlantNetError: class PlantNetError extends Error {
            readonly httpStatus: 400 | 502;

            constructor(message: string, httpStatus: 400 | 502) {
                super(message);
                this.name = 'PlantNetError';
                this.httpStatus = httpStatus;
            }
        },
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
        PlantNetError
    };
});

describe('/api/identify', () => {
    it('answers 403 with the verify message and does not call PlantNet when the session is unverified', async () => {
        requireVerifiedUserMock.mockRejectedValue(new UnverifiedEmailError());

        const response = await POST(new Request('http://localhost/api/identify', {
            method: 'POST',
            body: new FormData()
        }));

        expect(response.status).toBe(403);
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

        expect(response.status).toBe(200);
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

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'bad image'
        });
    });
});
