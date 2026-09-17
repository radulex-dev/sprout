'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Components
import AboutCard from './AboutCard';
import AccountCard from './AccountCard';
import RemindersCard from './RemindersCard';

// Hooks
import { useNotifications } from '@/hooks/useNotifications';

// Services
import { checkAndNotify } from '@/services/notifications';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './styles.module.css';

// Types
import type { SettingsUser } from './types';
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plants: Plant[];
    user: SettingsUser;
}

const handleTestNotification = async (): Promise<void> => {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Sprout is ready', {
        body: 'You\'ll get a reminder here when a plant needs watering, fertilising or repotting.',
        icon: '/icon-192.png'
    });
};

const SettingsScreen: React.FunctionComponent<Props> = ({ plants, user, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const { isSupported, permission, requestPermission } = useNotifications();

    const handleSignOut = useCallback(async () => {
        await authClient.signOut();

        router.push('/login');
        router.refresh();
    }, [router]);

    const handleEnableNotifications = useCallback(async () => {
        const granted = await requestPermission();

        if (granted === 'granted') {
            await checkAndNotify();
        }
    }, [requestPermission]);

    const renderAccountCard = () => {
        return (
            <AccountCard user={user} onSignOut={handleSignOut} />
        );
    };

    const renderRemindersCard = () => {
        return (
            <RemindersCard isSupported={isSupported} perm={permission} onEnable={handleEnableNotifications} onTest={handleTestNotification} />
        );
    };

    const renderAboutCard = () => {
        return (
            <AboutCard className={styles.about} plantCount={plants.length} />
        );
    };

    const renderContent = () => {
        return (
            <div className={styles.cards}>
                {renderAccountCard()}
                {renderRemindersCard()}
                {renderAboutCard()}
            </div>
        );
    };

    return (
        <div className={classes} {...props}>
            <header className={styles.appHeader}>
                <div>
                    <h1>
                        Settings
                    </h1>
                    <div className={styles.sub}>
                        Notifications & data
                    </div>
                </div>
            </header>

            {renderContent()}
        </div>
    );
};

export default SettingsScreen;
