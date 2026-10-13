import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

// Constants
import { UMAMI_BEFORE_SEND_GLOBAL } from './constants';

// Components
import type AnalyticsComponent from './index';

// Helpers
import { beforeSend } from './helpers';

const props: React.ComponentProps<typeof AnalyticsComponent> = {};

describe('<Analytics />', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('renders no tracker when both analytics variables are unset', async () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_SCRIPT_URL', '');
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', '');
        const { default: Analytics } = await import('./index');

        expect(render(<Analytics {...props} />).container).toBeEmptyDOMElement();
    });

    it('renders no tracker when only the script url is set', async () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_SCRIPT_URL', 'https://umami.example.com/script.js');
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', '');
        const { default: Analytics } = await import('./index');

        expect(render(<Analytics {...props} />).container).toBeEmptyDOMElement();
    });

    it('loads the tracker script and registers the before-send hook when both analytics variables are set', async () => {
        vi.stubEnv('NEXT_PUBLIC_UMAMI_SCRIPT_URL', 'https://umami.example.com/script.js');
        vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', 'test-website-id');
        const { default: Analytics } = await import('./index');

        render(<Analytics {...props} />);

        const script = document.querySelector('script[src="https://umami.example.com/script.js"]');

        expect(script).toBeInTheDocument();
        expect(script).toHaveAttribute('data-website-id', 'test-website-id');
        expect(script).toHaveAttribute('data-before-send', UMAMI_BEFORE_SEND_GLOBAL);

        const sent = window[UMAMI_BEFORE_SEND_GLOBAL]?.('event', {
            url: `${location.origin}/plants/plant-1`
        });

        expect(sent?.url).toBe(`${location.origin}/plants/[id]`);
    });
});

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
            expected: `${location.origin}/plants/[id]`
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
            expected: `${location.origin}/reset-password/[token]`
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
