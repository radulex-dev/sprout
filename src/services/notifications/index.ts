// Constants
import { CARE_CHECK_INTERVAL_MS, REMINDERS_OPTED_OUT_KEY } from './constants';

// Helpers
import { subscribeToPush } from './helpers';
import { buildCareNotification, dueTasks, isNotifiedToday } from '@/helpers/care';
import { decodeVapidPublicKey } from '@/helpers/push';

// Database
import { recordNotified } from '@/lib/db/actions';

// Types
import type { Plant } from '@/types';

const hasMatchingApplicationServerKey = (subscription: PushSubscription, currentKey: Uint8Array): boolean => {
    const existingKey = subscription.options.applicationServerKey;

    if (!existingKey) {
        return false;
    }

    const existingBytes = new Uint8Array(existingKey);

    if (existingBytes.length !== currentKey.length) {
        return false;
    }

    return existingBytes.every((byte, index) => {
        return byte === currentKey[index];
    });
};

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

const persistActivePreference = async (isEnabled: boolean): Promise<void> => {
    if (!isNotificationsSupported()) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            return;
        }

        await fetch('/api/push/subscribe', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                active: isEnabled
            })
        });
    } catch (error) {
        console.error('Failed to persist the reminders preference', error);
    }
};

export const isRemindersOptedOut = (): boolean => {
    try {
        return localStorage.getItem(REMINDERS_OPTED_OUT_KEY) === '1';
    } catch {
        return false;
    }
};

export const setRemindersOptedOut = (isOptedOut: boolean): void => {
    try {
        if (isOptedOut) {
            localStorage.setItem(REMINDERS_OPTED_OUT_KEY, '1');

            return;
        }

        localStorage.removeItem(REMINDERS_OPTED_OUT_KEY);
    } catch (error) {
        console.error('Failed to persist the reminders opt-out flag', error);
    }
};

export const hasPushSubscription = async (): Promise<boolean> => {
    if (!isNotificationsSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch {
        return false;
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

        const currentKey = decodeVapidPublicKey(key);
        const existing = await pushManager.getSubscription();
        const isExistingCurrentKey = existing ? hasMatchingApplicationServerKey(existing, currentKey) : false;

        if (existing && !isExistingCurrentKey) {
            // A refused unsubscribe leaves the stale-key subscription in place, and subscribing would return it unchanged.
            const didUnsubscribe = await existing.unsubscribe();

            if (!didUnsubscribe) {
                return;
            }
        }

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(existing && isExistingCurrentKey ? existing : await subscribeToPush(pushManager, currentKey))
        });

        if (isRemindersOptedOut()) {
            await persistActivePreference(false);
        }
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
    if (isRemindersOptedOut()) {
        return 0;
    }

    if (!isNotificationsSupported() || Notification.permission !== 'granted') {
        return 0;
    }

    const [reg, plants] = await Promise.all([navigator.serviceWorker.ready, fetchPlants()]);
    const now = Date.now();

    const pendingTasks = dueTasks(plants, now).filter((task) => {
        return !isNotifiedToday(task.plant, task.kind, now);
    });

    if (pendingTasks.length === 0) {
        return 0;
    }

    const notification = buildCareNotification(pendingTasks);

    await reg.showNotification(notification.title, {
        body: notification.body,
        tag: notification.tag,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    });
    await Promise.all(pendingTasks.map((task) => {
        return recordNotified(task.plant.id, task.kind, now);
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

export const setRemindersEnabled = async (isEnabled: boolean): Promise<void> => {
    if (isEnabled) {
        setRemindersOptedOut(false);

        if (isNotificationsSupported() && Notification.permission === 'granted') {
            await ensurePushSubscription();
        }

        await persistActivePreference(true);

        return;
    }

    setRemindersOptedOut(true);
    await persistActivePreference(false);
};
