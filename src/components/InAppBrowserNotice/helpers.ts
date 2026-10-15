// Constants
import { NOTICE_DISMISSED_KEY } from './constants';

// Services
import { getInstallPlatform, isInAppBrowser, type InstallPlatform } from '@/services/install';

export const copyCurrentUrl = async (): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(globalThis.location.href);

        return true;
    } catch {
        return false;
    }
};

export const detectNoticePlatform = (): InstallPlatform | undefined => {
    if (!isInAppBrowser() || isNoticeDismissed()) {
        return;
    }

    return getInstallPlatform();
};

export const isNoticeDismissed = (): boolean => {
    try {
        return sessionStorage.getItem(NOTICE_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
};

export const markNoticeDismissed = (): void => {
    try {
        sessionStorage.setItem(NOTICE_DISMISSED_KEY, '1');
    } catch (error) {
        console.error('Failed to persist the in-app browser notice dismissal', error);
    }
};
