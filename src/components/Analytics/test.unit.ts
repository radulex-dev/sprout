import { describe, expect, it } from 'vitest';

// Helpers
import { beforeSend } from './helpers';

describe('Helpers', () => {
    describe('beforeSend()', () => {
        it.each([{
            url: 'https://sprout.radualex.me/plants/4f2a9c1e-8b3d-4a7f-9c21-0d5e6f7a8b9c',
            expected: 'https://sprout.radualex.me/plants/[id]'
        }, {
            url: 'https://sprout.radualex.me/plants/4f2a9c1e/',
            expected: 'https://sprout.radualex.me/plants/[id]'
        }, {
            url: '/plants/4f2a9c1e',
            expected: `${globalThis.location.origin}/plants/[id]`
        }, {
            url: 'https://sprout.radualex.me/plants',
            expected: 'https://sprout.radualex.me/plants'
        }, {
            url: 'https://sprout.radualex.me/plants/4f2a9c1e/photo',
            expected: 'https://sprout.radualex.me/plants/4f2a9c1e/photo'
        }, {
            url: 'https://sprout.radualex.me/reset-password/eyJhbGciOiJIUzI1NiJ9.abc123',
            expected: 'https://sprout.radualex.me/reset-password/[token]'
        }, {
            url: 'https://sprout.radualex.me/reset-password/eyJhbGciOiJIUzI1NiJ9.abc123/',
            expected: 'https://sprout.radualex.me/reset-password/[token]'
        }, {
            url: '/reset-password/eyJhbGciOiJIUzI1NiJ9.abc123',
            expected: `${globalThis.location.origin}/reset-password/[token]`
        }, {
            url: 'https://sprout.radualex.me/reset-password',
            expected: 'https://sprout.radualex.me/reset-password'
        }, {
            url: 'https://sprout.radualex.me/care',
            expected: 'https://sprout.radualex.me/care'
        }, {
            url: 'https://sprout.radualex.me/settings',
            expected: 'https://sprout.radualex.me/settings'
        }, {
            url: 'https://sprout.radualex.me/login',
            expected: 'https://sprout.radualex.me/login'
        }])('resolves $url to $expected', ({ url, expected }) => {
            expect(beforeSend('event', {
                url
            })?.url).toBe(expected);
        });

        it('passes a payload with no url through', () => {
            expect(beforeSend('identify', {})).toEqual({});
        });
    });
});
