import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

// Components
import type PostHogComponent from './index';

const { captureExceptionMock, identifyMock, initMock, registerMock, resetMock, useSessionMock } = vi.hoisted(() => {
    return {
        captureExceptionMock: vi.fn(),
        identifyMock: vi.fn(),
        initMock: vi.fn(),
        registerMock: vi.fn(),
        resetMock: vi.fn(),
        useSessionMock: vi.fn()
    };
});

vi.mock('posthog-js', () => {
    return {
        default: {
            captureException: captureExceptionMock,
            identify: identifyMock,
            init: initMock,
            register: registerMock,
            reset: resetMock
        }
    };
});

vi.mock('@/lib/auth/auth-client', () => {
    return {
        authClient: {
            useSession: useSessionMock
        }
    };
});

const props: React.ComponentProps<typeof PostHogComponent> = {};

describe('<PostHog />', () => {
    beforeEach(() => {
        vi.resetModules();
        useSessionMock.mockReturnValue({
            data: undefined,
            isPending: false
        });
    });

    it('initialises the client with the EU host and dated defaults when configured', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(initMock).toHaveBeenCalledWith('phc_test', {
            api_host: 'https://eu.i.posthog.com',
            defaults: '2026-05-30'
        });
        expect(registerMock).toHaveBeenCalledWith({
            environment: 'local'
        });
    });

    it('tags events with the PRD environment in production', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(registerMock).toHaveBeenCalledWith({
            environment: 'PRD'
        });
    });

    it('does not initialise or identify when the project token is unset', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
        useSessionMock.mockReturnValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'user@example.test'
                }
            },
            isPending: false
        });
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(initMock).not.toHaveBeenCalled();
        expect(identifyMock).not.toHaveBeenCalled();
    });

    it('identifies the signed-in user', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        useSessionMock.mockReturnValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'user@example.test'
                }
            },
            isPending: false
        });
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(identifyMock).toHaveBeenCalledWith('user-1', {
            email: 'user@example.test'
        });
    });

    it('neither identifies nor resets while the session is pending', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        useSessionMock.mockReturnValue({
            data: undefined,
            isPending: true
        });
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(identifyMock).not.toHaveBeenCalled();
        expect(resetMock).not.toHaveBeenCalled();
    });

    it('does not reset on a fresh anonymous page load', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        const { default: PostHog } = await import('./index');

        render(<PostHog {...props} />);

        expect(resetMock).not.toHaveBeenCalled();
    });

    it('resets the identity when a previously identified user signs out', async () => {
        vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
        useSessionMock.mockReturnValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'user@example.test'
                }
            },
            isPending: false
        });
        const { default: PostHog } = await import('./index');
        const { rerender } = render(<PostHog {...props} />);

        expect(identifyMock).toHaveBeenCalledWith('user-1', {
            email: 'user@example.test'
        });

        useSessionMock.mockReturnValue({
            data: undefined,
            isPending: false
        });
        rerender(<PostHog {...props} />);

        expect(resetMock).toHaveBeenCalledTimes(1);
    });

    describe('Helpers', () => {
        describe('captureClientException()', () => {
            beforeEach(() => {
                vi.resetModules();
            });

            it('captures the exception when configured', async () => {
                vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
                const { captureClientException } = await import('./helpers');
                const error = new Error('boom');

                captureClientException(error);

                expect(captureExceptionMock).toHaveBeenCalledWith(error);
            });

            it('does nothing when unconfigured', async () => {
                vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
                const { captureClientException } = await import('./helpers');

                captureClientException(new Error('boom'));

                expect(captureExceptionMock).not.toHaveBeenCalled();
            });
        });
    });
});
