import { useCallback, useEffect, useState } from 'react';
import { pwaInstallHandler } from 'pwa-install-handler';

// Services
import { getInstallPlatform, isPhoneBrowser, isStandalone, type InstallPlatform } from '@/services/install';

export interface InstallState {
    isStandalone: boolean | undefined;
    isPhone: boolean | undefined;
    platform: InstallPlatform | undefined;
    canPrompt: boolean;
    promptInstall: () => Promise<void>;
}

export const useInstall = (): InstallState => {
    const [standalone, setStandalone] = useState<boolean | undefined>(undefined);
    const [isPhone, setIsPhone] = useState<boolean | undefined>(undefined);
    const [platform, setPlatform] = useState<InstallPlatform | undefined>(undefined);
    const [canPrompt, setCanPrompt] = useState(false);

    useEffect(() => {
        setStandalone(isStandalone());
        setIsPhone(isPhoneBrowser());
        setPlatform(getInstallPlatform());

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
        canPrompt,
        promptInstall: requestInstall
    };
};
