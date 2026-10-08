import { useCallback, useEffect, useState } from 'react';

// Helpers
import { readConsent, writeConsent } from './helpers';

// Types
import type { AnalyticsConsentState } from './types';

export const useAnalyticsConsent = (): AnalyticsConsentState => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [consent, setConsent] = useState<boolean>();

    useEffect(() => {
        const stored = readConsent();

        setConsent(stored);
        setIsLoaded(true);
    }, []);

    const accept = useCallback(() => {
        writeConsent(true);
        setConsent(true);
    }, []);

    const decline = useCallback(() => {
        writeConsent(false);
        setConsent(false);
    }, []);

    return {
        isLoaded,
        consent,
        accept,
        decline
    };
};
