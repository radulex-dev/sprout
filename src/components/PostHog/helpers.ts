import posthog from 'posthog-js';

// Constants
import { POSTHOG_PROJECT_TOKEN } from './constants';

export const captureClientException = (error: unknown): void => {
    if (!POSTHOG_PROJECT_TOKEN) {
        return;
    }

    posthog.captureException(error);
};
