import { useEffect, useState } from 'react';

// Helpers
import { detectNoticePlatform } from './helpers';

// Types
import type { InstallPlatform } from '@/services/install/types';

export const useNoticePlatform = (): InstallPlatform | undefined => {
    const [platform, setPlatform] = useState<InstallPlatform>();

    useEffect(() => {
        setPlatform(detectNoticePlatform());
    }, []);

    return platform;
};
