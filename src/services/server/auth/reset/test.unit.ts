import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { RESET_EMAIL_SUBJECT, RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX, ResetDispatch, ResetTokenState } from './constants';

// Helpers
import { mockDeleteChain, mockSelectChain } from '@test/vitest/helpers/mockDb';
import { buildResetEmail, buildResetUrl, isCurrentTokenNewest, isRecentSibling } from './helpers';

// Services
import { dispatchResetRequest, getResetTokenStatus, sendPasswordResetEmail } from './index';

const { claimVerificationSendMock, deleteMock, selectMock, sendEmailMock } = vi.hoisted(() => {
    return {
        claimVerificationSendMock: vi.fn(),
        deleteMock: vi.fn(),
        selectMock: vi.fn(),
        sendEmailMock: vi.fn()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            delete: deleteMock,
            select: selectMock
        }
    };
});

vi.mock('@/services/server/auth/verification', () => {
    return {
        claimVerificationSend: claimVerificationSendMock
    };
});

vi.mock('@/services/server/email', () => {
    return {
        sendEmail: sendEmailMock
    };
});

describe('isCurrentTokenNewest', () => {
    it('returns false when there are no rows', () => {
        expect(isCurrentTokenNewest([], 'tok')).toBe(false);
    });

    it('returns true when the newest row is the current token', () => {
        expect(isCurrentTokenNewest([{
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date()
        }, {
            identifier: `${RESET_IDENTIFIER_PREFIX}older`,
            createdAt: new Date(Date.now() - 5000)
        }], 'tok')).toBe(true);
    });

    it('returns false when a newer sibling row supersedes the current token', () => {
        expect(isCurrentTokenNewest([{
            identifier: `${RESET_IDENTIFIER_PREFIX}newer`,
            createdAt: new Date(Date.now() - 1000)
        }, {
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date(Date.now() - 5000)
        }], 'tok')).toBe(false);
    });
});

describe('isRecentSibling', () => {
    it('returns false for the current token row', () => {
        expect(isRecentSibling({
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date(Date.now() - 1000)
        }, 'tok', Date.now())).toBe(false);
    });

    it.each([{
        ageMs: (RESET_THROTTLE_SECONDS * 1000) / 2,
        expected: true
    }, {
        ageMs: RESET_THROTTLE_SECONDS * 1000,
        expected: true
    }, {
        ageMs: RESET_THROTTLE_SECONDS * 1000 + 1000,
        expected: false
    }])('a sibling row $ageMs ms old is recent: $expected', ({ ageMs, expected }) => {
        expect(isRecentSibling({
            identifier: `${RESET_IDENTIFIER_PREFIX}other`,
            createdAt: new Date(Date.now() - ageMs)
        }, 'tok', Date.now())).toBe(expected);
    });
});

describe('buildResetEmail', () => {
    it('uses the reset subject and the passed recipient', () => {
        const message = buildResetEmail('user@example.test', 'https://app.test/reset-password/abc', true);

        expect(message.subject).toBe(RESET_EMAIL_SUBJECT);
        expect(message.to).toBe('user@example.test');
    });

    it('renders the reset URL verbatim', () => {
        const message = buildResetEmail('user@example.test', 'https://app.test/reset-password/abc', true);

        expect(message.html).toContain('https://app.test/reset-password/abc');
    });

    it.each([{
        hasPassword: false,
        expected: true
    }, {
        hasPassword: true,
        expected: false
    }])('hasPassword $hasPassword includes the Google sentence: $expected', ({ hasPassword, expected }) => {
        const message = buildResetEmail('user@example.test', 'https://app.test/reset-password/abc', hasPassword);

        expect(message.html.includes('Your account normally signs in with Google')).toBe(expected);
    });
});

describe('buildResetUrl', () => {
    it('keeps the origin and appends the reset path and token', () => {
        expect(buildResetUrl('https://host/api/auth/reset-password/x?callbackURL=', 'abc')).toBe('https://host/reset-password/abc');
    });
});

describe('getResetTokenStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        selectMock.mockReset();
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns Invalid when no token row exists', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([]));

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Invalid
        });
    });

    it('returns Valid when the token row has not expired', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            value: 'user-1',
            expiresAt: new Date(Date.now() + 60_000)
        }]));

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Valid
        });
    });

    it('returns Expired with the verified owner when the token row is past', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            value: 'user-1',
            expiresAt: new Date(Date.now() - 60_000)
        }]));
        selectMock.mockReturnValueOnce(mockSelectChain([{
            email: 'user@example.test',
            emailVerified: true
        }]));

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Expired,
            email: 'user@example.test',
            emailVerified: true
        });
    });

    it('returns Expired with emailVerified false for an unverified owner', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            value: 'user-1',
            expiresAt: new Date(Date.now() - 60_000)
        }]));
        selectMock.mockReturnValueOnce(mockSelectChain([{
            email: 'user@example.test',
            emailVerified: false
        }]));

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Expired,
            email: 'user@example.test',
            emailVerified: false
        });
    });

    it('returns Valid when the token row expires exactly now', async () => {
        vi.useFakeTimers();
        const now = new Date('2026-10-04T12:00:00Z').getTime();
        vi.setSystemTime(now);
        selectMock.mockReturnValueOnce(mockSelectChain([{
            value: 'user-1',
            expiresAt: new Date(now)
        }]));
        selectMock.mockReturnValueOnce(mockSelectChain([{
            email: 'user@example.test',
            emailVerified: true
        }]));

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Valid
        });
    });

    it('returns Valid and logs when the database read throws', async () => {
        vi.mocked(console.error);

        selectMock.mockImplementationOnce(() => {
            throw new Error('database unavailable');
        });

        await expect(getResetTokenStatus('tok')).resolves.toEqual({
            state: ResetTokenState.Valid
        });
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('Could not read reset token status.', expect.any(Error));
    });
});

describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        deleteMock.mockReset();
        selectMock.mockReset();
        sendEmailMock.mockResolvedValue(undefined);
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sends when the current token is newest and no recent sibling exists', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date()
        }]));
        selectMock.mockReturnValueOnce(mockSelectChain([{
            id: 'credential-1'
        }]));
        deleteMock.mockReturnValueOnce(mockDeleteChain());

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test'
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok'
        });

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(sendEmailMock).toHaveBeenCalledWith({
            to: 'user@example.test',
            subject: RESET_EMAIL_SUBJECT,
            html: expect.stringContaining('http://localhost:3000/reset-password/tok')
        });
    });

    it('suppresses when an older sibling was already sent inside the window', async () => {
        vi.mocked(console.warn);

        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date()
        }, {
            identifier: `${RESET_IDENTIFIER_PREFIX}other`,
            createdAt: new Date(Date.now() - (RESET_THROTTLE_SECONDS * 1000) / 2)
        }]));

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test'
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok'
        });

        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('Password reset email suppressed by the 60-second throttle.');
    });

    it('suppresses when a newer sibling supersedes the current token', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${RESET_IDENTIFIER_PREFIX}newer`,
            createdAt: new Date(Date.now() - 1000)
        }, {
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date(Date.now() - 5000)
        }]));

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test'
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok'
        });

        expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('sends when the only sibling is past the window', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${RESET_IDENTIFIER_PREFIX}tok`,
            createdAt: new Date()
        }, {
            identifier: `${RESET_IDENTIFIER_PREFIX}old`,
            createdAt: new Date(Date.now() - RESET_THROTTLE_SECONDS * 1000 - 1000)
        }]));
        selectMock.mockReturnValueOnce(mockSelectChain([{
            id: 'credential-1'
        }]));
        deleteMock.mockReturnValueOnce(mockDeleteChain());

        await sendPasswordResetEmail({
            user: {
                id: 'user-1',
                email: 'user@example.test'
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok'
        });

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
    });
});

describe('dispatchResetRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        claimVerificationSendMock.mockReset();
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sends a verification email for an unverified account when the claim succeeds', async () => {
        claimVerificationSendMock.mockResolvedValue(true);
        const sendReset = vi.fn();
        const sendVerification = vi.fn();

        await expect(dispatchResetRequest({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: false
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok',
            sendReset,
            sendVerification
        })).resolves.toBe(ResetDispatch.Verification);

        expect(sendVerification).toHaveBeenCalledTimes(1);
        expect(sendVerification).toHaveBeenCalledWith({
            email: 'user@example.test',
            callbackURL: 'http://localhost:3000/reset-password/tok'
        });
        expect(sendReset).not.toHaveBeenCalled();
    });

    it('suppresses the verification email when the per-address claim fails', async () => {
        vi.mocked(console.warn);

        claimVerificationSendMock.mockResolvedValue(false);
        const sendReset = vi.fn();
        const sendVerification = vi.fn();

        await expect(dispatchResetRequest({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: false
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok',
            sendReset,
            sendVerification
        })).resolves.toBe(ResetDispatch.Suppressed);

        expect(sendReset).not.toHaveBeenCalled();
        expect(sendVerification).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('Reset verification email suppressed by the 60-second throttle.');
    });

    it('sends the reset email for a verified account and never claims a verification send', async () => {
        const sendReset = vi.fn();
        const sendVerification = vi.fn();

        await expect(dispatchResetRequest({
            user: {
                id: 'user-1',
                email: 'user@example.test',
                emailVerified: true
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok',
            sendReset,
            sendVerification
        })).resolves.toBe(ResetDispatch.Reset);

        expect(sendReset).toHaveBeenCalledTimes(1);
        expect(sendReset).toHaveBeenCalledWith({
            user: {
                id: 'user-1',
                email: 'user@example.test'
            },
            url: 'http://localhost:3000/api/auth/reset-password/tok123?callbackURL=',
            token: 'tok'
        });
        expect(sendVerification).not.toHaveBeenCalled();
        expect(claimVerificationSendMock).not.toHaveBeenCalled();
    });
});
