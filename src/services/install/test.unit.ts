import { afterEach, describe, expect, it, vi } from 'vitest';

// Services
import { getInstallBrowser, getInstallPlatform, isInAppBrowser, isPhoneBrowser, isStandalone } from './index';

// Types
import { InstallBrowser, InstallPlatform } from './types';

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
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        expected: InstallPlatform.Ios
    }, {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        expected: InstallPlatform.Ios
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        expected: InstallPlatform.Chromium
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87',
        expected: InstallPlatform.Chromium
    }, {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        expected: InstallPlatform.Chromium
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0',
        expected: InstallPlatform.Chromium
    }, {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
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

describe('getInstallBrowser', () => {
    it.each([{
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        expected: InstallBrowser.Safari
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
        expected: InstallBrowser.Chrome
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
        expected: InstallBrowser.Firefox
    }, {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        expected: InstallBrowser.Chrome
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        expected: InstallBrowser.Chrome
    }, {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
        expected: InstallBrowser.Firefox
    }, {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        expected: InstallBrowser.Safari
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87',
        expected: InstallBrowser.Other
    }])('detects $userAgent as $expected', ({ userAgent, expected }) => {
        overrideNavigatorProperty('userAgent', userAgent);

        expect(getInstallBrowser()).toBe(expected);
    });
});

describe('isInAppBrowser', () => {
    it.each([{
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36',
        expected: true
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.0.30.94 (iPhone14,5; iOS 17_5; en_US; en-US; scale=2.00; 390x844; 576506467)',
        expected: true
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_34.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store',
        expected: true
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/453.0.0.36.108;FBBV/584386464;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
        expected: true
    }, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        expected: false
    }, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        expected: false
    }])('reports in-app $expected for $userAgent', ({ userAgent, expected }) => {
        overrideNavigatorProperty('userAgent', userAgent);

        expect(isInAppBrowser()).toBe(expected);
    });
});
