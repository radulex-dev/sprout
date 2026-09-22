// Types
import type { PushPayload } from './types';

// Seconds the push service retains an undelivered message before dropping it.
export const PUSH_TTL_SECONDS = 24 * 60 * 60;

export const PUSH_TEST_PAYLOAD: PushPayload = {
    title: 'Sprout test notification',
    body: 'Care reminders will arrive like this, even with the app closed.',
    url: '/settings'
};
