import 'server-only';
import { PostHog } from 'posthog-node';

// Constants
import { POSTHOG_COOKIE_PATTERN } from './constants';

// Types
import type { PostHogCookieState, PostHogEvent } from './types';

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
        return;
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

export const captureException = (error: unknown, distinctId?: string): void => {
    const posthog = getClient();

    if (!posthog) {
        return;
    }

    posthog.captureException(error, distinctId, {
        environment: readPostHogEnvironment().environment
    });
};

export const readPostHogDistinctId = (cookieHeader: string | string[] | undefined): string | undefined => {
    const cookie = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;

    if (!cookie) {
        return;
    }

    const encoded = POSTHOG_COOKIE_PATTERN.exec(cookie)?.at(1);

    if (!encoded) {
        return;
    }

    try {
        const data = JSON.parse(decodeURIComponent(encoded)) as PostHogCookieState;

        return data.distinct_id;
    } catch {
        return;
    }
};
