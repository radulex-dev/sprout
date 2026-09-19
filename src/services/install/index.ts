import { UAParser } from 'ua-parser-js';
import { EngineName, OSName } from 'ua-parser-js/enums';

// Constants
import { IPADOS_MIN_TOUCH_POINTS, IPADOS_TOUCH_PLATFORM, STANDALONE_DISPLAY_MODE, TOUCH_ONLY_QUERY } from './constants';

// Types
import { InstallPlatform, type InstallNavigator } from './types';

export { InstallPlatform } from './types';

const isIosStandalone = (): boolean => {
    const navigatorWithStandalone = globalThis.navigator as InstallNavigator;

    return navigatorWithStandalone.standalone === true;
};

export const isStandalone = (): boolean => {
    if (!('window' in globalThis)) {
        return false;
    }

    const isDisplayModeStandalone = typeof globalThis.matchMedia === 'function' && globalThis.matchMedia(STANDALONE_DISPLAY_MODE).matches;

    return isDisplayModeStandalone || isIosStandalone();
};

export const isPhoneBrowser = (): boolean => {
    if (!('window' in globalThis)) {
        return false;
    }

    return typeof globalThis.matchMedia === 'function' && globalThis.matchMedia(TOUCH_ONLY_QUERY).matches;
};

export const getInstallPlatform = (): InstallPlatform => {
    if (!('navigator' in globalThis)) {
        return InstallPlatform.Other;
    }

    const { maxTouchPoints, platform, userAgent } = globalThis.navigator;
    const { engine, os } = new UAParser(userAgent).getResult();

    if (os.is(OSName.IOS) || (platform === IPADOS_TOUCH_PLATFORM && maxTouchPoints > IPADOS_MIN_TOUCH_POINTS)) {
        return InstallPlatform.Ios;
    }

    if (engine.is(EngineName.BLINK)) {
        return InstallPlatform.Chromium;
    }

    return InstallPlatform.Other;
};
