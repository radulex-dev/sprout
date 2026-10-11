import { useCallback, useEffect, useState } from 'react';

// Services
import { hasPushSubscription, isNotificationsSupported, isRemindersOptedOut, requestNotificationPermission, setRemindersEnabled as setRemindersEnabledService } from '@/services/notifications';

export interface NotificationsState {
    isSupported: boolean | undefined;
    permission: NotificationPermission;
    isSubscribed: boolean;
    isOptedOut: boolean;
    requestPermission: () => Promise<NotificationPermission>;
    setRemindersEnabled: (isEnabled: boolean) => Promise<void>;
}

export const useNotifications = (): NotificationsState => {
    const [isSupported, setIsSupported] = useState<boolean | undefined>(undefined);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOptedOut, setIsOptedOut] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    const refreshState = useCallback(async () => {
        const canNotify = isNotificationsSupported();

        setPermission(canNotify ? Notification.permission : 'denied');
        setIsSubscribed(await hasPushSubscription());
        setIsOptedOut(isRemindersOptedOut());
    }, []);

    useEffect(() => {
        setIsSupported(isNotificationsSupported());
        void refreshState();
    }, [refreshState]);

    const requestPermission = useCallback(async () => {
        const next = await requestNotificationPermission();

        setPermission(next);
        setIsSubscribed(await hasPushSubscription());

        return next;
    }, []);

    const handleSetRemindersEnabled = useCallback(async (isEnabled: boolean) => {
        if (isEnabled && Notification.permission !== 'granted') {
            const granted = await requestNotificationPermission();

            if (granted !== 'granted') {
                await refreshState();

                return;
            }
        }

        await setRemindersEnabledService(isEnabled);
        await refreshState();
    }, [refreshState]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isOptedOut,
        requestPermission,
        setRemindersEnabled: handleSetRemindersEnabled
    };
};
