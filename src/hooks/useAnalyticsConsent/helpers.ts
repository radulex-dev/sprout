// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

export const parseConsent = (value: string | null): boolean | undefined => {
    if (value !== 'true' && value !== 'false') {
        return;
    }

    return value === 'true';
};

export const readConsent = (): boolean | undefined => {
    try {
        return parseConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY));
    } catch {
        return;
    }
};

export const writeConsent = (hasConsented: boolean): void => {
    try {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, String(hasConsented));
    } catch (error) {
        console.error('Failed to persist analytics consent', error);
    }
};
