'use client';

import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// Constants
import { CONFIRM_LABEL, INSTALL_GUIDE_CONTENT } from './InstallGuide/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import AboutCard from './AboutCard';
import AccountCard from './AccountCard';
import InstallCard from './InstallCard';
import InstallGuide from './InstallGuide';
import RemindersCard from './RemindersCard';
import AlertDialog from '@/design-system/AlertDialog';

// Hooks
import { useInstall } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

// Services
import { InstallPlatform } from '@/services/install';
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
    const { isStandalone, platform, canPrompt, promptInstall } = useInstall();
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const guidePlatform = platform ?? InstallPlatform.Other;
    const guideContent = INSTALL_GUIDE_CONTENT[guidePlatform];

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

    const handleInstall = useCallback(async () => {
        if (canPrompt) {
            await promptInstall();

            return;
        }

        setIsGuideOpen(true);
    }, [canPrompt, promptInstall]);

    const handleCloseInstallGuide = useCallback(() => {
        setIsGuideOpen(false);
    }, []);

    const handleShowInstallGuide = useCallback(() => {
        setIsGuideOpen(true);
    }, []);

    const renderAccountCard = () => {
        return (
            <AccountCard user={user} onSignOut={handleSignOut} />
        );
    };

    const renderRemindersCard = () => {
        return (
            <RemindersCard isSupported={isSupported} perm={permission} needsInstall={isSupported === false && isStandalone === false} onEnable={handleEnableNotifications} onInstall={handleShowInstallGuide} onTest={handleTestNotification} />
        );
    };

    const renderInstallCard = () => {
        if (isStandalone !== false) {
            return;
        }

        return (
            <InstallCard onInstall={handleInstall} />
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
                {renderInstallCard()}
                {renderAboutCard()}
            </div>
        );
    };

    const renderInstallGuide = () => {
        return (
            <AlertDialog isOpen={isGuideOpen} title={guideContent.title} description={guideContent.description} confirmLabel={CONFIRM_LABEL} confirmVariant={ButtonVariant.Primary} hideCancel onConfirm={handleCloseInstallGuide} onCancel={handleCloseInstallGuide}>
                <InstallGuide platform={guidePlatform} />
            </AlertDialog>
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
            {renderInstallGuide()}
        </div>
    );
};

export default SettingsScreen;
