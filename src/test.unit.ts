import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/* eslint-disable @onefinity/eslint-config/import-grouping */
import { onRequestError } from './instrumentation';
import { proxy } from './proxy';
/* eslint-enable @onefinity/eslint-config/import-grouping */

// Constants
import { HttpStatus } from '@/lib/http/constants';

const { captureExceptionMock, readPostHogDistinctIdMock } = vi.hoisted(() => {
    return {
        captureExceptionMock: vi.fn(),
        readPostHogDistinctIdMock: vi.fn()
    };
});

vi.mock('@/services/server/posthog', () => {
    return {
        captureException: captureExceptionMock,
        readPostHogDistinctId: readPostHogDistinctIdMock
    };
});

describe('Next.js', () => {
    describe('proxy', () => {
        it.each([{
            label: 'lets a signed-out user reach a reset-password link',
            url: 'http://localhost:3000/reset-password/abc',
            cookie: '',
            status: HttpStatus.Ok,
            location: undefined
        }, {
            label: 'lets a signed-out user reach forgot-password',
            url: 'http://localhost:3000/forgot-password',
            cookie: '',
            status: HttpStatus.Ok,
            location: undefined
        }, {
            label: 'redirects a signed-out user from a private page to login',
            url: 'http://localhost:3000/plants',
            cookie: '',
            status: HttpStatus.TemporaryRedirect,
            location: 'http://localhost:3000/login'
        }, {
            label: 'redirects a signed-in user away from login',
            url: 'http://localhost:3000/login',
            cookie: 'better-auth.session_token=session-token-value',
            status: HttpStatus.TemporaryRedirect,
            location: 'http://localhost:3000/'
        }, {
            label: 'lets a signed-in user reach a reset-password link',
            url: 'http://localhost:3000/reset-password/abc',
            cookie: 'better-auth.session_token=session-token-value',
            status: HttpStatus.Ok,
            location: undefined
        }])('$label', ({ url, cookie, status, location }) => {
            const response = proxy(new NextRequest(url, {
                headers: {
                    cookie
                }
            }));

            expect(response.status).toBe(status);

            if (location === undefined) {
                expect(response.headers.get('location')).toBeNull();
            } else {
                expect(response.headers.get('location')).toBe(location);
            }
        });
    });

    describe('Instrumentation', () => {
        describe('onRequestError', () => {
            beforeEach(() => {
                vi.stubEnv('NEXT_RUNTIME', 'nodejs');
                readPostHogDistinctIdMock.mockReturnValue('user-1');
            });

            it('captures the server error with the distinct id read from the cookie', async () => {
                const error = new Error('boom');

                await onRequestError(error, {
                    path: '/plants',
                    method: 'POST',
                    headers: {
                        cookie: 'ph_phc_abc_posthog=%7B%7D'
                    }
                }, {
                    routerKind: 'App Router',
                    routePath: '/plants',
                    routeType: 'route',
                    revalidateReason: undefined
                });

                expect(readPostHogDistinctIdMock).toHaveBeenCalledWith('ph_phc_abc_posthog=%7B%7D');
                expect(captureExceptionMock).toHaveBeenCalledWith(error, 'user-1');
            });

            it('does nothing outside the nodejs runtime', async () => {
                vi.stubEnv('NEXT_RUNTIME', 'edge');

                await onRequestError(new Error('boom'), {
                    path: '/plants',
                    method: 'POST',
                    headers: {}
                }, {
                    routerKind: 'App Router',
                    routePath: '/plants',
                    routeType: 'route',
                    revalidateReason: undefined
                });

                expect(captureExceptionMock).not.toHaveBeenCalled();
            });
        });
    });
});
