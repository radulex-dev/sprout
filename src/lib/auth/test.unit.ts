import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
import { UNVERIFIED_SESSION, VERIFIED_SESSION } from '@test/vitest/data/session.mock';

// Auth
import { VERIFY_REQUIRED_MESSAGE } from './constants';
import { assertVerified, UnverifiedEmailError } from './errors';

vi.mock('next/headers', () => {
    return {
        headers: () => {
            return Promise.resolve(new Headers());
        }
    };
});

describe('assertVerified', () => {
    it('throws UnverifiedEmailError with the verify message when the email is unverified', () => {
        expect(() => {
            assertVerified(false);
        }).toThrow(UnverifiedEmailError);
        expect(() => {
            assertVerified(false);
        }).toThrow(VERIFY_REQUIRED_MESSAGE);
    });

    it('returns without throwing when the email is verified', () => {
        expect(() => {
            assertVerified(true);
        }).not.toThrow();
    });
});

describe('requireVerifiedUser', () => {
    beforeEach(() => {
        vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000');
        vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-at-least-32-characters-long');
    });

    it('returns the session when the email is verified', async () => {
        const { auth } = await import('./index');
        const session = VERIFIED_SESSION;
        vi.spyOn(auth.api, 'getSession').mockResolvedValue(session);

        const { requireVerifiedUser } = await import('./session');

        await expect(requireVerifiedUser()).resolves.toBe(session);
    });

    it('throws UnverifiedEmailError when the email is unverified', async () => {
        const { auth } = await import('./index');
        const session = UNVERIFIED_SESSION;
        vi.spyOn(auth.api, 'getSession').mockResolvedValue(session);

        const { requireVerifiedUser } = await import('./session');

        await expect(requireVerifiedUser()).rejects.toBeInstanceOf(UnverifiedEmailError);
        await expect(requireVerifiedUser()).rejects.toThrow(VERIFY_REQUIRED_MESSAGE);
    });
});

describe('<auth /> password reset config', () => {
    beforeEach(() => {
        vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000');
        vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-at-least-32-characters-long');
    });

    it('nests the token TTL, session revocation and send callback inside emailAndPassword', async () => {
        const { auth } = await import('./index');

        expect(auth.options.emailAndPassword.resetPasswordTokenExpiresIn).toBe(86_400);
        expect(auth.options.emailAndPassword.revokeSessionsOnPasswordReset).toBe(true);
        expect(typeof auth.options.emailAndPassword.sendResetPassword).toBe('function');
    });
});
