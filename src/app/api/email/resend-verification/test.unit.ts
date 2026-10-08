import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Routes
import { POST } from './route';

const { claimVerificationSendMock, headersMock, requireUserMock, sendVerificationEmailMock } = vi.hoisted(() => {
    return {
        claimVerificationSendMock: vi.fn(),
        headersMock: vi.fn(),
        requireUserMock: vi.fn(),
        sendVerificationEmailMock: vi.fn()
    };
});

vi.mock('next/headers', () => {
    return {
        headers: headersMock
    };
});

vi.mock('@/lib/auth', () => {
    return {
        auth: {
            api: {
                sendVerificationEmail: sendVerificationEmailMock
            }
        }
    };
});

vi.mock('@/lib/auth/session', () => {
    return {
        requireUser: requireUserMock
    };
});

vi.mock('@/services/server/auth/verification', () => {
    return {
        claimVerificationSend: claimVerificationSendMock
    };
});

describe('/api/email/resend-verification', () => {
    beforeEach(() => {
        vi.stubEnv('SMTP_HOST', 'smtp.example.test');
        vi.stubEnv('SMTP_PORT', '587');
        vi.stubEnv('SMTP_USER', 'smtp-user');
        vi.stubEnv('SMTP_PASSWORD', 'smtp-password');
        vi.stubEnv('EMAIL_FROM', 'no-reply@example.test');
        headersMock.mockResolvedValue(new Headers());
        requireUserMock.mockResolvedValue({
            user: {
                id: 'user-1',
                email: 'ada@example.test',
                emailVerified: false
            }
        });
        claimVerificationSendMock.mockResolvedValue(true);
        sendVerificationEmailMock.mockResolvedValue({
            status: true
        });
    });

    it('sends to the session address and answers 200', async () => {
        const requestHeaders = new Headers();

        headersMock.mockResolvedValue(requestHeaders);

        const response = await POST();

        expect(response.status).toBe(HttpStatus.Ok);
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            body: {
                email: 'ada@example.test'
            },
            headers: requestHeaders
        });
    });

    it.each(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'])('answers 503 and sends nothing when %s is blank', async (variable) => {
        vi.stubEnv(variable, '');

        const response = await POST();

        expect(response.status).toBe(HttpStatus.ServiceUnavailable);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('answers 409 and sends nothing when the session address is already verified', async () => {
        requireUserMock.mockResolvedValue({
            user: {
                id: 'user-1',
                email: 'ada@example.test',
                emailVerified: true
            }
        });

        const response = await POST();

        expect(response.status).toBe(HttpStatus.Conflict);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('answers 502 when the send throws', async () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        sendVerificationEmailMock.mockRejectedValue(new Error('smtp unavailable'));

        const response = await POST();

        expect(response.status).toBe(HttpStatus.BadGateway);
        expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('answers the uniform 200 and sends nothing when the address is inside the throttle', async () => {
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());

        claimVerificationSendMock.mockResolvedValue(false);

        const response = await POST();

        expect(response.status).toBe(HttpStatus.Ok);
        await expect(response.json()).resolves.toEqual({
            status: true
        });
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('does not claim a send when the session address is already verified', async () => {
        requireUserMock.mockResolvedValue({
            user: {
                id: 'user-1',
                email: 'ada@example.test',
                emailVerified: true
            }
        });

        await POST();

        expect(claimVerificationSendMock).not.toHaveBeenCalled();
    });

    it('does not claim a send when email delivery is not configured', async () => {
        vi.stubEnv('SMTP_HOST', '');

        await POST();

        expect(claimVerificationSendMock).not.toHaveBeenCalled();
    });
});
