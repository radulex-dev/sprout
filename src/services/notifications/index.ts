// Constants
import { CARE_CHECK_INTERVAL_MS, PERIODIC_SYNC_MIN_INTERVAL_MS } from './constants';
import { CARE_META, DAY_MS } from '@/helpers/care/constants';

// Helpers
import { dueTasks } from '@/helpers/care';

// Database
import { recordNotified } from '@/lib/db/actions';

// Types
import type { Plant } from '@/types';
import type { CareCheckMessage, ServiceWorkerRegistrationWithPeriodicSync } from './types';

const fetchPlants = async (): Promise<Plant[]> => {
    try {
        const response = await fetch('/api/plants', {
            cache: 'no-store'
        });

        if (!response.ok) {
            return [];
        }

        return (await response.json()) as Plant[];
    } catch {
        return [];
    }
};

const registerPeriodicSync = async () => {
    try {
        const reg = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithPeriodicSync;
        // Only available on installed PWAs in Chromium; fails silently elsewhere.
        await reg.periodicSync?.register('sprout-care-check', {
            minInterval: PERIODIC_SYNC_MIN_INTERVAL_MS
        });
    } catch {
        /* periodic sync unavailable — in-app checks still run */
    }
};

export const isNotificationsSupported = (): boolean => {
    return 'Notification' in globalThis && 'serviceWorker' in navigator;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!isNotificationsSupported()) {
        return 'denied';
    }

    const perm = await Notification.requestPermission();

    if (perm === 'granted') {
        await registerPeriodicSync();
    }

    return perm;
};

export const checkAndNotify = async (): Promise<number> => {
    if (!isNotificationsSupported() || Notification.permission !== 'granted') {
        return 0;
    }

    const [reg, plants] = await Promise.all([navigator.serviceWorker.ready, fetchPlants()]);
    const now = Date.now();

    const pendingTasks = dueTasks(plants, now).filter((task) => {
        const last = task.plant.lastNotified[task.kind] ?? 0;

        return now - last >= DAY_MS;
    });

    await Promise.all(pendingTasks.map(async (task) => {
        const meta = CARE_META[task.kind];
        const name = task.plant.nickname || task.plant.commonName || task.plant.species;

        await reg.showNotification(`Time to ${meta.label.toLowerCase()} ${name}`, {
            body:
                task.daysUntil < 0
                    ? `${name} is ${-task.daysUntil} day${task.daysUntil === -1 ? '' : 's'} overdue for ${meta.label.toLowerCase()}ing.`
                    : `${name} is due for ${meta.label.toLowerCase()}ing today.`,
            tag: `sprout-${task.plant.id}-${task.kind}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
        await recordNotified(task.plant.id, task.kind, now);
    }));

    return pendingTasks.length;
};

export const startCareWatcher = (): (() => void) => {
    void checkAndNotify();

    const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : undefined;

    const handleFocus = () => {
        void checkAndNotify();
    };

    const handleTick = () => {
        void checkAndNotify();
    };

    const handleMessage = (event: MessageEvent<CareCheckMessage>) => {
        if (event.data.type === 'care-check') {
            void checkAndNotify();
        }
    };

    window.addEventListener('focus', handleFocus);
    sw?.addEventListener('message', handleMessage);
    const interval = setInterval(handleTick, CARE_CHECK_INTERVAL_MS);

    return () => {
        window.removeEventListener('focus', handleFocus);
        sw?.removeEventListener('message', handleMessage);
        clearInterval(interval);
    };
};
