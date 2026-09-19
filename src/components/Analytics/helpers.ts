import type { BeforeSendEvent } from '@vercel/analytics';
import type { BeforeSend } from '@vercel/analytics/next';

// Constants
import { PLANT_DETAIL_NORMALISED, PLANT_DETAIL_PATTERN } from './constants';

export const beforeSend: BeforeSend = (event: BeforeSendEvent) => {
    const url = new URL(event.url, globalThis.location.origin);

    if (!PLANT_DETAIL_PATTERN.test(url.pathname)) {
        return event;
    }

    url.pathname = PLANT_DETAIL_NORMALISED;
    event.url = url.href;

    return event;
};
