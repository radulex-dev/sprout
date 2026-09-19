import { afterEach, describe, expect, it, vi } from 'vitest';

// Services
import { getInstallPlatform, isStandalone } from './index';

// Types
import { InstallPlatform } from './types';

const IPHONE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const UNKNOWN_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0';

const overrideNavigatorProperty = (property: 'maxTouchPoints' | 'platform' | 'standalone' | 'userAgent', value: boolean | number | string) => {
    Object.defineProperty(globalThis.navigator, property, {
        configurable: true,
        value
    });
};

const stubMatchMedia = (isMatched: boolean) => {
    vi.stubGlobal('matchMedia', vi.fn(() => {
        return {
            matches: isMatched
        };
    }));
};

afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'maxTouchPoints');
    Reflect.deleteProperty(globalThis.navigator, 'platform');
    Reflect.deleteProperty(globalThis.navigator, 'standalone');
    Reflect.deleteProperty(globalThis.navigator, 'userAgent');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('isStandalone', () => {
    it('is false when neither standalone signal is present', () => {
        expect(isStandalone()).toBe(false);
    });

    it('is true when the standalone display mode matches', () => {
        stubMatchMedia(true);

        expect(isStandalone()).toBe(true);
    });

    it('is false when the standalone display mode does not match', () => {
        stubMatchMedia(false);

        expect(isStandalone()).toBe(false);
    });

    it('is true when navigator.standalone is true', () => {
        overrideNavigatorProperty('standalone', true);

        expect(isStandalone()).toBe(true);
    });
});

describe('getInstallPlatform', () => {
    it('detects iOS from an iPhone user agent', () => {
        overrideNavigatorProperty('userAgent', IPHONE_USER_AGENT);

        expect(getInstallPlatform()).toBe(InstallPlatform.Ios);
    });

    it('detects iPadOS from a desktop platform with touch support', () => {
        overrideNavigatorProperty('platform', 'MacIntel');
        overrideNavigatorProperty('maxTouchPoints', 2);

        expect(getInstallPlatform()).toBe(InstallPlatform.Ios);
    });

    it('detects Chromium from a Chrome user agent', () => {
        overrideNavigatorProperty('userAgent', CHROME_USER_AGENT);

        expect(getInstallPlatform()).toBe(InstallPlatform.Chromium);
    });

    it('returns other for an unknown user agent', () => {
        overrideNavigatorProperty('userAgent', UNKNOWN_USER_AGENT);

        expect(getInstallPlatform()).toBe(InstallPlatform.Other);
    });
});
