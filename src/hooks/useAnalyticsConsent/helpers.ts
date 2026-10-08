// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

export const parseConsent = (value: string | null): boolean | undefined => {
    if (!value) {
        return;
    }

    return value === 'true';
};

export const readConsent = (): boolean | undefined => {
    return parseConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY));
};

export const writeConsent = (hasConsented: boolean): void => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, String(hasConsented));
};
