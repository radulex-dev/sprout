import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('<auth /> password reset config', () => {
    beforeEach(() => {
        vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000');
        vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-at-least-32-characters-long');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('nests the token TTL, session revocation and send callback inside emailAndPassword', async () => {
        const { auth } = await import('./index');

        expect(auth.options.emailAndPassword.resetPasswordTokenExpiresIn).toBe(86_400);
        expect(auth.options.emailAndPassword.revokeSessionsOnPasswordReset).toBe(true);
        expect(typeof auth.options.emailAndPassword.sendResetPassword).toBe('function');
    });
});
