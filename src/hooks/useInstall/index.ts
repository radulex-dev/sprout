import { useCallback, useEffect, useState } from 'react';
import { pwaInstallHandler } from 'pwa-install-handler';

// Services
import { getInstallBrowser, getInstallPlatform, isInAppBrowser, isPhoneBrowser, isStandalone, type InstallBrowser, type InstallPlatform } from '@/services/install';

export interface InstallState {
    isStandalone: boolean | undefined;
    isPhone: boolean | undefined;
    platform: InstallPlatform | undefined;
    browser: InstallBrowser | undefined;
    isInApp: boolean | undefined;
    canPrompt: boolean;
    promptInstall: () => Promise<void>;
}

export const useInstall = (): InstallState => {
    const [standalone, setStandalone] = useState<boolean | undefined>(undefined);
    const [isPhone, setIsPhone] = useState<boolean | undefined>(undefined);
    const [platform, setPlatform] = useState<InstallPlatform | undefined>(undefined);
    const [browser, setBrowser] = useState<InstallBrowser | undefined>(undefined);
    const [isInApp, setIsInApp] = useState<boolean | undefined>(undefined);
    const [canPrompt, setCanPrompt] = useState(false);

    useEffect(() => {
        setStandalone(isStandalone());
        setIsPhone(isPhoneBrowser());
        setPlatform(getInstallPlatform());
        setBrowser(getInstallBrowser());
        setIsInApp(isInAppBrowser());

        const handleCanInstallChange = (canInstall: boolean) => {
            setCanPrompt(canInstall);
        };

        pwaInstallHandler.addListener(handleCanInstallChange);

        return () => {
            pwaInstallHandler.removeListener(handleCanInstallChange);
        };
    }, []);

    const requestInstall = useCallback(async (): Promise<void> => {
        await pwaInstallHandler.install();
    }, []);

    return {
        isStandalone: standalone,
        isPhone,
        platform,
        browser,
        isInApp,
        canPrompt,
        promptInstall: requestInstall
    };
};
