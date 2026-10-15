import { useEffect, useState } from 'react';

// Services
import { isNudgeSuppressed } from '@/services/install-nudge';
import { isInstallNudgeHandoffPending } from '@/services/install-nudge/helpers';

// Types
import type { InstallNudgeState } from './types';

export const useInstallNudgeState = (pathname: string): InstallNudgeState => {
    const [isPending, setIsPending] = useState(false);
    const [isSuppressed, setIsSuppressed] = useState(true);

    useEffect(() => {
        if (!isInstallNudgeHandoffPending()) {
            return;
        }

        setIsPending(true);
        setIsSuppressed(isNudgeSuppressed());
    }, [pathname]);

    return {
        isPending,
        isSuppressed
    };
};
