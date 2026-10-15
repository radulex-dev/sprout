// Constants
import { INSTALL_NUDGE_SEEN_KEY, INSTALL_NUDGE_SUPPRESSION_MS } from './constants';

export const isNudgeSuppressed = (): boolean => {
    try {
        const stored = localStorage.getItem(INSTALL_NUDGE_SEEN_KEY);

        if (stored === null) {
            return false;
        }

        const seenAt = Number(stored);

        if (!Number.isFinite(seenAt)) {
            return false;
        }

        return Date.now() - seenAt < INSTALL_NUDGE_SUPPRESSION_MS;
    } catch {
        return false;
    }
};

export const markNudgeSeen = (): void => {
    try {
        localStorage.setItem(INSTALL_NUDGE_SEEN_KEY, String(Date.now()));
    } catch (error) {
        console.error('Failed to persist the install nudge timestamp', error);
    }
};
