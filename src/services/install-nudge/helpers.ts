// Constants
import { INSTALL_NUDGE_HANDOFF_KEY } from './constants';

export const markInstallNudgeHandoff = (): void => {
    try {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
    } catch (error) {
        console.error('Failed to record the install nudge handoff', error);
    }
};

export const isInstallNudgeHandoffPending = (): boolean => {
    try {
        return sessionStorage.getItem(INSTALL_NUDGE_HANDOFF_KEY) === '1';
    } catch {
        return false;
    }
};

export const clearInstallNudgeHandoff = (): void => {
    try {
        sessionStorage.removeItem(INSTALL_NUDGE_HANDOFF_KEY);
    } catch (error) {
        console.error('Failed to clear the install nudge handoff', error);
    }
};
