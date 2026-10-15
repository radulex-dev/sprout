import { BrowserName } from 'ua-parser-js/enums';

// Types
import { InstallBrowser } from './types';

export const STANDALONE_DISPLAY_MODE = '(display-mode: standalone)';

export const TOUCH_ONLY_QUERY = '(pointer: coarse) and (hover: none)';

export const IPADOS_TOUCH_PLATFORM = 'MacIntel';

export const IPADOS_MIN_TOUCH_POINTS = 1;

export const INSTALL_BROWSERS: Record<string, InstallBrowser> = {
    [BrowserName.CHROME]: InstallBrowser.Chrome,
    [BrowserName.CHROME_MOBILE]: InstallBrowser.Chrome,
    [BrowserName.FIREFOX]: InstallBrowser.Firefox,
    [BrowserName.FIREFOX_MOBILE]: InstallBrowser.Firefox,
    [BrowserName.SAFARI]: InstallBrowser.Safari,
    [BrowserName.SAFARI_MOBILE]: InstallBrowser.Safari
};

export const IN_APP_BROWSER_NAMES: readonly string[] = [
    BrowserName.CHROME_WEBVIEW,
    BrowserName.EDGE_WEBVIEW,
    BrowserName.EDGE_WEBVIEW2,
    BrowserName.FACEBOOK,
    BrowserName.INSTAGRAM,
    BrowserName.TIKTOK
];
