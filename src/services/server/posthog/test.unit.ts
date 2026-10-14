import { beforeEach, describe, expect, it, vi } from 'vitest';

// Types
import { PostHogEvent } from './types';

const { captureMock, constructorMock, PostHogMock } = vi.hoisted(() => {
    const captureMock = vi.fn();
    const constructorMock = vi.fn();

    class PostHogMock {
        capture = captureMock;

        constructor(...constructorArguments: unknown[]) {
            constructorMock(...constructorArguments);
        }
    }

    return {
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
