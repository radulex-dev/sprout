// Constants
import { URL_NORMALISATIONS } from './constants';

// Types
import type { UmamiBeforeSend } from './types';

export const beforeSend: UmamiBeforeSend = (...[, payload]) => {
    if (typeof payload.url !== 'string' || payload.url.length === 0) {
        return payload;
    }

    const url = new URL(payload.url, globalThis.location.origin);
    const match = URL_NORMALISATIONS.find((candidate) => {
        return candidate.pattern.test(url.pathname);
    });

    if (match === undefined) {
        return payload;
    }

    url.pathname = match.normalised;
    payload.url = url.href;

    return payload;
};

export const isAnalyticsConfigured = (): boolean => {
    return Boolean(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);
};
