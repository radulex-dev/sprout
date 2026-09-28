// Constants
import { PLANT_DETAIL_NORMALISED, PLANT_DETAIL_PATTERN } from './constants';

// Types
import type { UmamiBeforeSend } from './types';

export const beforeSend: UmamiBeforeSend = (...[, payload]) => {
    if (typeof payload.url !== 'string' || payload.url.length === 0) {
        return payload;
    }

    const url = new URL(payload.url, globalThis.location.origin);

    if (!PLANT_DETAIL_PATTERN.test(url.pathname)) {
        return payload;
    }

    url.pathname = PLANT_DETAIL_NORMALISED;
    payload.url = url.href;

    return payload;
};
