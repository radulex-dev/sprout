import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { VERIFY_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { VERIFY_SENT_IDENTIFIER_PREFIX } from './constants';

// Helpers
import { mockDeleteChain, mockInsertChain, mockSelectChain } from '@test/vitest/helpers/mockDb';
import { isMarkerRecent } from './helpers';

// Services
import { claimVerificationSend } from './index';

const { deleteMock, insertMock, selectMock } = vi.hoisted(() => {
    return {
        deleteMock: vi.fn(),
        insertMock: vi.fn(),
        selectMock: vi.fn()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            delete: deleteMock,
            insert: insertMock,
            select: selectMock
        }
    };
});

describe('isMarkerRecent', () => {
    it.each([{
        ageMs: (VERIFY_THROTTLE_SECONDS * 1000) / 2,
        expected: true
    }, {
        ageMs: VERIFY_THROTTLE_SECONDS * 1000,
        expected: true
    }, {
        ageMs: VERIFY_THROTTLE_SECONDS * 1000 + 1000,
        expected: false
    }])('a marker $ageMs ms old is recent: $expected', ({ ageMs, expected }) => {
        expect(isMarkerRecent(new Date(Date.now() - ageMs), Date.now())).toBe(expected);
    });
});

describe('claimVerificationSend', () => {
    beforeEach(() => {
        deleteMock.mockReset();
        insertMock.mockReset();
        selectMock.mockReset();
    });

    it('claims and inserts a marker when no prior marker exists', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([]));
        insertMock.mockReturnValueOnce(mockInsertChain());

        const isClaimed = await claimVerificationSend('ada@example.test');

        expect(isClaimed).toBe(true);
        expect(insertMock).toHaveBeenCalledTimes(1);
    });

    it('suppresses when a marker exists inside the window', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${VERIFY_SENT_IDENTIFIER_PREFIX}ada@example.test`,
            createdAt: new Date(Date.now() - (VERIFY_THROTTLE_SECONDS * 1000) / 2)
        }]));

        const isClaimed = await claimVerificationSend('ada@example.test');

        expect(isClaimed).toBe(false);
        expect(insertMock).not.toHaveBeenCalled();
    });

    it('claims when the only marker is past the window', async () => {
        selectMock.mockReturnValueOnce(mockSelectChain([{
            identifier: `${VERIFY_SENT_IDENTIFIER_PREFIX}ada@example.test`,
            createdAt: new Date(Date.now() - VERIFY_THROTTLE_SECONDS * 1000 - 1000)
        }]));
        deleteMock.mockReturnValueOnce(mockDeleteChain());
        insertMock.mockReturnValueOnce(mockInsertChain());

        const isClaimed = await claimVerificationSend('ada@example.test');

        expect(isClaimed).toBe(true);
        expect(insertMock).toHaveBeenCalledTimes(1);
    });

    it('keys the marker on the lowercased address', async () => {
        const insertChain = mockInsertChain();

        selectMock.mockReturnValueOnce(mockSelectChain([]));
        insertMock.mockReturnValueOnce(insertChain);

        await claimVerificationSend('ADA@Example.Test');

        expect(insertChain.values).toHaveBeenCalledWith(expect.objectContaining({
            identifier: `${VERIFY_SENT_IDENTIFIER_PREFIX}ada@example.test`
        }));
    });
});
