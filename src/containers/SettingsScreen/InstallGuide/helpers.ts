// Constants
import { INSTALL_GUIDE_CONTENT, IOS_ALTERNATE_GUIDE_CONTENT } from './constants';

// Services
import { InstallBrowser, InstallPlatform } from '@/services/install';

// Types
import type { InstallGuideContent } from './types';

export const getInstallGuideContent = (platform: InstallPlatform, browser?: InstallBrowser): InstallGuideContent => {
    const isAlternateIosBrowser = platform === InstallPlatform.Ios && (browser === InstallBrowser.Chrome || browser === InstallBrowser.Firefox);

    if (!isAlternateIosBrowser) {
        return INSTALL_GUIDE_CONTENT[platform];
    }

    return IOS_ALTERNATE_GUIDE_CONTENT;
};
