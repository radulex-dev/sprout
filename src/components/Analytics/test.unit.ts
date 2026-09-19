import { describe, expect, it } from 'vitest';
import type { BeforeSendEvent } from '@vercel/analytics/next';

// Helpers
import { beforeSend } from './helpers';

const ORIGIN = 'https://sprout.radualex.me';

const pageView = (url: string): BeforeSendEvent => {
    return {
        type: 'pageview',
        url
    };
};

describe('Helpers', () => {
    describe('beforeSend()', () => {
        it.each([{
            name: 'plant detail by uuid',
            url: `${ORIGIN}/plants/4f2a9c1e-8b3d-4a7f-9c21-0d5e6f7a8b9c`,
            expected: `${ORIGIN}/plants/[id]`
        }, {
            name: 'plant detail with a trailing slash',
            url: `${ORIGIN}/plants/4f2a9c1e/`,
            expected: `${ORIGIN}/plants/[id]`
        }, {
            name: 'relative plant detail url',
            url: '/plants/4f2a9c1e',
            expected: `${globalThis.location.origin}/plants/[id]`
        }, {
            name: 'plant index',
            url: `${ORIGIN}/plants`,
            expected: `${ORIGIN}/plants`
        }, {
            name: 'plant photo',
            url: `${ORIGIN}/plants/4f2a9c1e/photo`,
            expected: `${ORIGIN}/plants/4f2a9c1e/photo`
        }, {
            name: 'care',
            url: `${ORIGIN}/care`,
            expected: `${ORIGIN}/care`
        }, {
            name: 'settings',
            url: `${ORIGIN}/settings`,
            expected: `${ORIGIN}/settings`
        }, {
            name: 'login',
            url: `${ORIGIN}/login`,
            expected: `${ORIGIN}/login`
        }])('sends $name', ({ url, expected }) => {
            expect(beforeSend(pageView(url))?.url).toBe(expected);
        });
    });
});
