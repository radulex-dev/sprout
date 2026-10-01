import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { RESET_EMAIL_SUBJECT, RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX } from './constants';

// Helpers
import { buildResetEmail, hasRecentSiblingReset } from './helpers';

// Services
import { sendPasswordResetEmail } from './index';

const { selectMock, sendEmailMock } = vi.hoisted(() => {
    return {
        selectMock: vi.fn(),
        sendEmailMock: vi.fn()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            select: selectMock
        }
    };
});

vi.mock('@/services/server/email', () => {
    return {
        sendEmail: sendEmailMock
    };
});

describe('hasRecentSiblingReset', () => {
    it('returns false when only the current token row is present', () => {
        const now = Date.now();

        expect(hasRecentSiblingReset({
            rows: [{
                identifier: `${RESET_IDENTIFIER_PREFIX}current-token`,
                createdAt: new Date(now)
            }],
            currentToken: 'current-token',
            now
        })).toBe(false);
    });

    it('returns true for a sibling row 30 seconds old', () => {
        const now = Date.now();

        expect(hasRecentSiblingReset({
            rows: [{
                identifier: `${RESET_IDENTIFIER_PREFIX}sibling-token`,
                createdAt: new Date(now - 30_000)
            }],
            currentToken: 'current-token',
            now
        })).toBe(true);
    });

    it('returns false for a sibling row 61 seconds old', () => {
        const now = Date.now();

        expect(hasRecentSiblingReset({
            rows: [{
                identifier: `${RESET_IDENTIFIER_PREFIX}sibling-token`,
                createdAt: new Date(now - 61_000)
            }],
            currentToken: 'current-token',
            now
        })).toBe(false);
    });

    it('returns true for a sibling row exactly 60 seconds old', () => {
        const now = Date.now();

        expect(hasRecentSiblingReset({
            rows: [{
                identifier: `${RESET_IDENTIFIER_PREFIX}sibling-token`,
                createdAt: new Date(now - RESET_THROTTLE_SECONDS * 1000)
            }],
            currentToken: 'current-token',
            now
        })).toBe(true);
    });

    it('returns true when the current token row sits beside a different token row', () => {
        const now = Date.now();

        expect(hasRecentSiblingReset({
            rows: [{
                identifier: `${RESET_IDENTIFIER_PREFIX}current-token`,
                createdAt: new Date(now)
            }, {
                identifier: `${RESET_IDENTIFIER_PREFIX}other-token`,
                createdAt: new Date(now - 5000)
            }],
            currentToken: 'current-token',
            now
        })).toBe(true);
    });
});

describe('buildResetEmail', () => {
    it('uses the reset subject and the passed recipient', () => {
        const message = buildResetEmail({
            to: 'user@example.test',
            resetUrl: 'https://app.test/reset-password/abc',
            hasPassword: true
        });

        expect(message.subject).toBe(RESET_EMAIL_SUBJECT);
        expect(message.to).toBe('user@example.test');
    });

    it('omits the Google sentence when the account has a password', () => {
        const message = buildResetEmail({
            to: 'user@example.test',
            resetUrl: 'https://app.test/reset-password/abc',
            hasPassword: true
        });

        expect(message.html).not.toContain('Your account normally signs in with Google');
    });

    it('includes the Google sentence when the account has no password', () => {
        const message = buildResetEmail({
            to: 'user@example.test',
            resetUrl: 'https://app.test/reset-password/abc',
            hasPassword: false
        });

        expect(message.html).toContain('Your account normally signs in with Google');
    });

    it('renders the reset URL verbatim', () => {
        const message = buildResetEmail({
            to: 'user@example.test',
            resetUrl: 'https://app.test/reset-password/abc',
            hasPassword: true
        });

        expect(message.html).toContain('https://app.test/reset-password/abc');
    });
});

describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sendEmailMock.mockResolvedValue(undefined);
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns before any DB read when the account is unverified', async () => {
        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: false
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok123'
        });

        expect(selectMock).not.toHaveBeenCalled();
        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(vi.mocked(console.warn)).not.toHaveBeenCalled();
    });

    it('suppresses the send when a sibling reset was requested 30 seconds ago', async () => {
        selectMock.mockReturnValueOnce({
            from: () => {
                return {
                    where: () => {
                        return Promise.resolve([{
                            identifier: `${RESET_IDENTIFIER_PREFIX}other`,
                            createdAt: new Date(Date.now() - 30_000)
                        }]);
                    }
                };
            }
        });

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: true
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok123'
        });

        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(vi.mocked(console.warn)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn)).toHaveBeenCalledWith('Password reset email suppressed by the 60-second throttle.');
    });

    it('sends the reset link with the app origin when the request is not throttled', async () => {
        selectMock.mockReturnValueOnce({
            from: () => {
                return {
                    where: () => {
                        return Promise.resolve([]);
                    }
                };
            }
        });
        selectMock.mockReturnValueOnce({
            from: () => {
                return {
                    where: () => {
                        return Promise.resolve([{
                            id: 'credential-1'
                        }]);
                    }
                };
            }
        });

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: true
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok123'
        });

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(sendEmailMock).toHaveBeenCalledWith({
            to: 'user@example.test',
            subject: RESET_EMAIL_SUBJECT,
            html: expect.stringContaining('http://localhost:3000/reset-password/tok123')
        });
    });
});
