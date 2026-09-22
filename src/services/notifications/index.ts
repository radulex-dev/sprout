// Constants
import { CARE_CHECK_INTERVAL_MS } from './constants';
import { CARE_META } from '@/helpers/care/constants';

// Helpers
import { dueTasks, isNotifiedToday } from '@/helpers/care';
import { decodeVapidPublicKey } from '@/helpers/push';

// Database
import { recordNotified } from '@/lib/db/actions';

// Types
import type { Plant } from '@/types';

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

export const ensurePushSubscription = async (): Promise<void> => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!isNotificationsSupported() || Notification.permission !== 'granted' || !key) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const pushManager = registration.pushManager as PushManager | undefined;

        if (!pushManager) {
            return;
        }

        const existing = await pushManager.getSubscription();
        const subscription = existing ?? await pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidPublicKey(key)
        });

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });
    } catch (error) {
        console.error('Failed to register the push subscription', error);
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
        await ensurePushSubscription();
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
        return !isNotifiedToday(task.plant, task.kind, now);
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

    const handleFocus = () => {
        void checkAndNotify();
    };

    const handleTick = () => {
        void checkAndNotify();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(handleTick, CARE_CHECK_INTERVAL_MS);

    return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
    };
};
