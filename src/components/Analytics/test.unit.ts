import { describe, expect, it } from 'vitest';

// Helpers
import { beforeSend } from './helpers';

describe('Helpers', () => {
    describe('beforeSend()', () => {
        it.each([{
            name: 'plant detail by uuid',
            url: 'https://sprout.radualex.me/plants/4f2a9c1e-8b3d-4a7f-9c21-0d5e6f7a8b9c',
            expected: 'https://sprout.radualex.me/plants/[id]'
        }, {
            name: 'plant detail with a trailing slash',
            url: 'https://sprout.radualex.me/plants/4f2a9c1e/',
            expected: 'https://sprout.radualex.me/plants/[id]'
        }, {
            name: 'relative plant detail url',
            url: '/plants/4f2a9c1e',
            expected: `${globalThis.location.origin}/plants/[id]`
        }, {
            name: 'plant index',
            url: 'https://sprout.radualex.me/plants',
            expected: 'https://sprout.radualex.me/plants'
        }, {
            name: 'plant photo',
            url: 'https://sprout.radualex.me/plants/4f2a9c1e/photo',
            expected: 'https://sprout.radualex.me/plants/4f2a9c1e/photo'
        }, {
            name: 'care',
            url: 'https://sprout.radualex.me/care',
            expected: 'https://sprout.radualex.me/care'
        }, {
            name: 'settings',
            url: 'https://sprout.radualex.me/settings',
            expected: 'https://sprout.radualex.me/settings'
        }, {
            name: 'login',
            url: 'https://sprout.radualex.me/login',
            expected: 'https://sprout.radualex.me/login'
        }])('sends $name', ({ url, expected }) => {
            expect(beforeSend({
                type: 'pageview',
                url
            })?.url).toBe(expected);
        });
    });
});
