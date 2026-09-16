'use client';

import { useEffect } from 'react';

// Services
import { startCareWatcher } from '@/services/notifications';

export interface Props {
    children: React.ReactNode;
}

const purgeServiceWorker = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => {
        return registration.unregister();
    }));
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
        return caches.delete(key);
    }));
};

const SiteCore: React.FunctionComponent<Props> = ({ children }) => {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            if (process.env.NODE_ENV === 'production') {
                void navigator.serviceWorker.register('/sw.js', {
                    updateViaCache: 'none'
                });
            } else {
                void purgeServiceWorker();
            }
        }

        return startCareWatcher();
    }, []);

    return children;
};

export default SiteCore;
