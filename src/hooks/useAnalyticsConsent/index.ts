import { useCallback, useEffect, useState } from 'react';

// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

// Helpers
import { parseConsent, readConsent, writeConsent } from './helpers';

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

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            try {
                if (event.storageArea !== localStorage) {
                    return;
                }

                if (event.key !== ANALYTICS_CONSENT_KEY && event.key !== null) {
                    return;
                }

                setConsent(parseConsent(event.newValue));
            } catch {
                return;
            }
        };

        globalThis.addEventListener('storage', handleStorage);

        return () => {
            globalThis.removeEventListener('storage', handleStorage);
        };
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
