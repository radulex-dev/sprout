// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

export const readConsent = (): boolean | undefined => {
    const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);

    if (!stored) {
        return;
    }

    return stored === 'true';
};

export const writeConsent = (hasConsented: boolean): void => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, String(hasConsented));
};
