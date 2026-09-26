import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Routes
import { POST } from './route';

const { headersMock, requireUserMock, sendVerificationEmailMock } = vi.hoisted(() => {
    return {
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

describe('/api/email/resend-verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('RESEND_API_KEY', 're_test_key');
        vi.stubEnv('EMAIL_FROM', 'no-reply@example.test');
        headersMock.mockResolvedValue(new Headers());
        requireUserMock.mockResolvedValue({
            user: {
                id: 'user-1',
                email: 'ada@example.test',
                emailVerified: false
            }
        });
        sendVerificationEmailMock.mockResolvedValue({
            status: true
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('sends to the session address and answers 200', async () => {
        const requestHeaders = new Headers();

        headersMock.mockResolvedValue(requestHeaders);

        const response = await POST();

        expect(response.status).toBe(200);
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            body: {
                email: 'ada@example.test'
            },
            headers: requestHeaders
        });
    });

    it.each([{
        variable: 'RESEND_API_KEY'
    }, {
        variable: 'EMAIL_FROM'
    }])('answers 503 and sends nothing when $variable is blank', async ({ variable }) => {
        vi.stubEnv(variable, '');

        const response = await POST();

        expect(response.status).toBe(503);
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

        expect(response.status).toBe(409);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('answers 502 when the send throws', async () => {
        const consoleErrorMock = vi.spyOn(console, 'error');

        sendVerificationEmailMock.mockRejectedValue(new Error('resend unavailable'));

        const response = await POST();

        expect(response.status).toBe(502);
        expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
        expect(consoleErrorMock).toHaveBeenCalledTimes(1);

        consoleErrorMock.mockRestore();
    });
});
