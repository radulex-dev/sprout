import { beforeEach, describe, expect, it, vi } from 'vitest';

// Services
import { readPostHogDistinctId } from './index';

// Types
import { PostHogEvent } from './types';

const { captureExceptionMock, captureMock, constructorMock, PostHogMock } = vi.hoisted(() => {
    const captureExceptionMock = vi.fn();
    const captureMock = vi.fn();
    const constructorMock = vi.fn();

    class PostHogMock {
        capture = captureMock;
        captureException = captureExceptionMock;

        constructor(...constructorArguments: unknown[]) {
            constructorMock(...constructorArguments);
        }
    }

    return {
        captureExceptionMock,
        captureMock,
        constructorMock,
        PostHogMock
    };
});

vi.mock('posthog-node', () => {
    return {
        PostHog: PostHogMock
    };
});

describe('captureEvent', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
    });

    it.each(['NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'NEXT_PUBLIC_POSTHOG_HOST'])('does nothing when %s is blank', async (variable) => {
        vi.stubEnv(variable, '');
        const { captureEvent } = await import('./index');

        captureEvent('user-1', PostHogEvent.PlantCreated);

        expect(constructorMock).not.toHaveBeenCalled();
        expect(captureMock).not.toHaveBeenCalled();
    });

    it('captures the event with the user id as the distinct id', async () => {
        const { captureEvent } = await import('./index');

        captureEvent('user-1', PostHogEvent.PlantCreated, {
            source: 'test'
        });

        expect(captureMock).toHaveBeenCalledWith({
            distinctId: 'user-1',
            event: 'plant_created',
            properties: {
                source: 'test',
                environment: 'local'
            }
        });
    });

    it('tags events with the PRD environment in production', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const { captureEvent } = await import('./index');

        captureEvent('user-1', PostHogEvent.PlantCreated);

        expect(captureMock).toHaveBeenCalledWith({
            distinctId: 'user-1',
            event: 'plant_created',
            properties: {
                environment: 'PRD'
            }
        });
    });

    it('constructs the client with immediate flush settings', async () => {
        const { captureEvent } = await import('./index');

        captureEvent('user-1', PostHogEvent.PlantCreated);

        expect(constructorMock).toHaveBeenCalledWith('phc_test', {
            host: 'https://eu.i.posthog.com',
            flushAt: 1,
            flushInterval: 0
        });
    });

    it('reuses one client across events', async () => {
        const { captureEvent } = await import('./index');

        captureEvent('user-1', PostHogEvent.PlantCreated);
        captureEvent('user-1', PostHogEvent.PlantIdentified);

        expect(constructorMock).toHaveBeenCalledTimes(1);
        expect(captureMock).toHaveBeenCalledTimes(2);
    });
});

describe('captureException', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
    });

    it('does nothing when the project token is unset', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
        const { captureException } = await import('./index');

        captureException(new Error('boom'), 'user-1');

        expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('captures the exception with the distinct id and environment', async () => {
        const { captureException } = await import('./index');
        const error = new Error('boom');

        captureException(error, 'user-1');

        expect(captureExceptionMock).toHaveBeenCalledWith(error, 'user-1', {
            environment: 'local'
        });
    });
});

describe('readPostHogDistinctId()', () => {
    it.each([{
        label: 'a lone posthog cookie',
        cookie: 'ph_phc_abc_posthog=%7B%22distinct_id%22%3A%22user-1%22%7D',
        expected: 'user-1'
    }, {
        label: 'a posthog cookie among others',
        cookie: 'other=1; ph_phc_abc_posthog=%7B%22distinct_id%22%3A%22user-2%22%7D; more=2',
        expected: 'user-2'
    }, {
        label: 'an array of cookie headers',
        cookie: ['ph_phc_abc_posthog=%7B%22distinct_id%22%3A%22user-3%22%7D', 'other=1'],
        expected: 'user-3'
    }, {
        label: 'no posthog cookie',
        cookie: 'other=1',
        expected: undefined
    }, {
        label: 'a malformed posthog cookie',
        cookie: 'ph_phc_abc_posthog=not-json',
        expected: undefined
    }, {
        label: 'a missing cookie header',
        cookie: undefined,
        expected: undefined
    }])('reads $expected from $label', ({ cookie, expected }) => {
        expect(readPostHogDistinctId(cookie)).toBe(expected);
    });
});
