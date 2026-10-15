import { describe, expect, it, vi } from 'vitest';

// Constants
import { INSTALL_NUDGE_HANDOFF_KEY, INSTALL_NUDGE_SEEN_KEY, INSTALL_NUDGE_SUPPRESSION_MS } from './constants';

// Services
import { clearInstallNudgeHandoff, isInstallNudgeHandoffPending, markInstallNudgeHandoff } from './helpers';
import { isNudgeSuppressed, markNudgeSeen } from './index';

describe('Nudge service', () => {
    it('is not suppressed when nothing is stored', () => {
        expect(isNudgeSuppressed()).toBe(false);
    });

    it.each([{
        ageMs: 0,
        isSuppressed: true
    }, {
        ageMs: INSTALL_NUDGE_SUPPRESSION_MS - 1,
        isSuppressed: true
    }, {
        ageMs: INSTALL_NUDGE_SUPPRESSION_MS,
        isSuppressed: false
    }, {
        ageMs: INSTALL_NUDGE_SUPPRESSION_MS + 1,
        isSuppressed: false
    }])('reports $isSuppressed for a seen timestamp $ageMs ms old', ({ ageMs, isSuppressed }) => {
        vi.useFakeTimers();
        localStorage.setItem(INSTALL_NUDGE_SEEN_KEY, String(Date.now() - ageMs));

        expect(isNudgeSuppressed()).toBe(isSuppressed);
    });

    it('is not suppressed when the stored value is unparseable', () => {
        localStorage.setItem(INSTALL_NUDGE_SEEN_KEY, 'not-a-timestamp');

        expect(isNudgeSuppressed()).toBe(false);
    });

    it('is not suppressed when reading storage throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        expect(isNudgeSuppressed()).toBe(false);
    });

    it('stores the current timestamp when marking the nudge seen', () => {
        vi.useFakeTimers();
        markNudgeSeen();

        expect(Number(localStorage.getItem(INSTALL_NUDGE_SEEN_KEY))).toBe(Date.now());
    });

    it('does not throw when writing storage throws', () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        expect(() => {
            markNudgeSeen();
        }).not.toThrow();
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('records a pending handoff', () => {
        markInstallNudgeHandoff();

        expect(isInstallNudgeHandoffPending()).toBe(true);
    });

    it('reports no pending handoff when none is recorded', () => {
        expect(isInstallNudgeHandoffPending()).toBe(false);
    });

    it('keeps the handoff pending when it is read', () => {
        markInstallNudgeHandoff();

        expect(isInstallNudgeHandoffPending()).toBe(true);
        expect(sessionStorage.getItem(INSTALL_NUDGE_HANDOFF_KEY)).toBe('1');
    });

    it('clears the pending handoff', () => {
        markInstallNudgeHandoff();
        clearInstallNudgeHandoff();

        expect(isInstallNudgeHandoffPending()).toBe(false);
        expect(sessionStorage.getItem(INSTALL_NUDGE_HANDOFF_KEY)).toBeNull();
    });

    it('reports no handoff when session storage reads throw', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        expect(isInstallNudgeHandoffPending()).toBe(false);
    });

    it('does not throw when clearing the handoff fails', () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        expect(() => {
            clearInstallNudgeHandoff();
        }).not.toThrow();
        expect(console.error).toHaveBeenCalledTimes(1);
    });
});
