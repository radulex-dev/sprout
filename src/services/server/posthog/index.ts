import 'server-only';
import { PostHog } from 'posthog-node';

// Types
import type { PostHogEvent } from './types';

const clients = new Map<string, PostHog>();

const readPostHogEnvironment = () => {
    return {
        environment: process.env.NODE_ENV === 'production' ? 'PRD' : 'local',
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '',
        token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? ''
    };
};

const isPostHogConfigured = (): boolean => {
    const environment = readPostHogEnvironment();

    return Boolean(environment.token && environment.host);
};

const getClient = (): PostHog | undefined => {
    if (!isPostHogConfigured()) {
        return undefined;
    }

    const environment = readPostHogEnvironment();
    const key = `${environment.host}:${environment.token}`;
    const cached = clients.get(key);

    if (cached) {
        return cached;
    }

    const created = new PostHog(environment.token, {
        host: environment.host,
        flushAt: 1,
        flushInterval: 0
    });
    clients.set(key, created);

    return created;
};

export const captureEvent = (distinctId: string, event: PostHogEvent, properties?: Record<string, unknown>): void => {
    const posthog = getClient();

    if (!posthog) {
        return;
    }

    posthog.capture({
        distinctId,
        event,
        properties: {
            ...properties,
            environment: readPostHogEnvironment().environment
        }
    });
};
