import { afterEach, describe, expect, it, vi } from 'vitest';

// Services
import { getInstallPlatform, isPhoneBrowser, isStandalone } from './index';

// Types
import { InstallPlatform } from './types';

const IPHONE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const IPAD_USER_AGENT = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const EDGE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87';

const ANDROID_CHROME_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

const OPERA_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0';

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

describe('isPhoneBrowser', () => {
    it.each([{
        expected: true,
        isMatched: true
    }, {
        expected: false,
        isMatched: false
    }, {
        expected: false,
        isMatched: undefined
    }])('matchMedia $isMatched yields $expected', ({ isMatched, expected }) => {
        if (isMatched !== undefined) {
            stubMatchMedia(isMatched);
        }

        expect(isPhoneBrowser()).toBe(expected);
    });
});

describe('getInstallPlatform', () => {
    it.each([{
        userAgent: IPHONE_USER_AGENT,
        expected: InstallPlatform.Ios
    }, {
        userAgent: IPAD_USER_AGENT,
        expected: InstallPlatform.Ios
    }, {
        userAgent: CHROME_USER_AGENT,
        expected: InstallPlatform.Chromium
    }, {
        userAgent: EDGE_USER_AGENT,
        expected: InstallPlatform.Chromium
    }, {
        userAgent: ANDROID_CHROME_USER_AGENT,
        expected: InstallPlatform.Chromium
    }, {
        userAgent: OPERA_USER_AGENT,
        expected: InstallPlatform.Chromium
    }, {
        userAgent: UNKNOWN_USER_AGENT,
        expected: InstallPlatform.Other
    }])('detects $userAgent as $expected', ({ userAgent, expected }) => {
        overrideNavigatorProperty('userAgent', userAgent);

        expect(getInstallPlatform()).toBe(expected);
    });

    it('detects iPadOS from a desktop platform with touch support', () => {
        overrideNavigatorProperty('platform', 'MacIntel');
        overrideNavigatorProperty('maxTouchPoints', 2);

        expect(getInstallPlatform()).toBe(InstallPlatform.Ios);
    });
});
