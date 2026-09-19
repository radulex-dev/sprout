// Constants
import { CHROMIUM_USER_AGENT_PATTERN, IOS_USER_AGENT_PATTERN, IPADOS_MIN_TOUCH_POINTS, IPADOS_TOUCH_PLATFORM, STANDALONE_DISPLAY_MODE } from './constants';

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

export const getInstallPlatform = (): InstallPlatform => {
    if (!('navigator' in globalThis)) {
        return InstallPlatform.Other;
    }

    const { maxTouchPoints, platform, userAgent } = globalThis.navigator;

    if (IOS_USER_AGENT_PATTERN.test(userAgent) || (platform === IPADOS_TOUCH_PLATFORM && maxTouchPoints > IPADOS_MIN_TOUCH_POINTS)) {
        return InstallPlatform.Ios;
    }

    if (CHROMIUM_USER_AGENT_PATTERN.test(userAgent)) {
        return InstallPlatform.Chromium;
    }

    return InstallPlatform.Other;
};
