'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Constants
import { NOTIFICATIONS_LABEL, TEST_PUSH_COOLDOWN_SECONDS, VERIFY_COOLDOWN_SECONDS } from './constants';
import { CONFIRM_LABEL, INSTALL_GUIDE_CONTENT } from './InstallGuide/constants';
import { ButtonVariant } from '@/design-system/Button/constants';
import { ToastVariant } from '@/design-system/Toast/constants';

// Components
import AboutCard from './AboutCard';
import CreditsCard from './CreditsCard';
import InstallGuide from './InstallGuide';
import SettingsCard from './SettingsCard';
import TestPushButton from './TestPushButton';
import AlertDialog from '@/design-system/AlertDialog';
import Button from '@/design-system/Button';
import Switch from '@/design-system/Switch';

// Hooks
import { useInstall } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/design-system/hooks/useToast';

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

const SettingsScreen: React.FunctionComponent<Props> = ({ plants, user, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const showToast = useToast();
    const { isSupported, permission, isSubscribed, isOptedOut, setRemindersEnabled } = useNotifications();
    const { isStandalone, platform, canPrompt, promptInstall } = useInstall();
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [testCooldown, setTestCooldown] = useState(0);
    const [verifyCooldown, setVerifyCooldown] = useState(0);

    const guidePlatform = platform ?? InstallPlatform.Other;
    const guideContent = INSTALL_GUIDE_CONTENT[guidePlatform];
    const isInstallRequired = isSupported === false && isStandalone === false;
    const isOn = permission === 'granted' && isSubscribed && !isOptedOut;
    const noticeClasses = classNames(styles.notice, styles.noticeWarn);

    useEffect(() => {
        if (testCooldown <= 0) {
            return;
        }

        const timeout = setTimeout(() => {
            setTestCooldown((remaining) => {
                return remaining - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [testCooldown]);

    useEffect(() => {
        if (verifyCooldown <= 0) {
            return;
        }

        const timeout = setTimeout(() => {
            setVerifyCooldown((remaining) => {
                return remaining - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [verifyCooldown]);

    const handleSignOut = useCallback(async () => {
        await authClient.signOut();

        router.push('/login');
        router.refresh();
    }, [router]);

    const handleToggleReminders = useCallback(async (isEnabled: boolean) => {
        await setRemindersEnabled(isEnabled);

        if (isEnabled) {
            await checkAndNotify();
        }
    }, [setRemindersEnabled]);

    const handleTestNotification = useCallback(async () => {
        setTestCooldown(TEST_PUSH_COOLDOWN_SECONDS);

        try {
            const response = await fetch('/api/push/test', {
                method: 'POST'
            });

            if (response.status === 409) {
                showToast({
                    timeout: 5000,
                    variant: ToastVariant.Warning,
                    title: 'No push subscription is registered for this device, so reminders cannot reach it.'
                });

                return;
            }

            if (!response.ok) {
                showToast({
                    timeout: 5000,
                    variant: ToastVariant.Error,
                    title: 'The test push could not be sent.'
                });

                return;
            }

            const { sent } = await response.json() as { sent: number; };

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: `Test push sent to ${sent} device${sent === 1 ? '' : 's'}.`
            });
        } catch (error) {
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: error instanceof Error ? error.message : 'The test push could not be sent.'
            });
        }
    }, [showToast]);

    const handleVerify = useCallback(async () => {
        setVerifyCooldown(VERIFY_COOLDOWN_SECONDS);

        try {
            const response = await fetch('/api/email/resend-verification', {
                method: 'POST'
            });

            if (response.status === 503) {
                showToast({
                    timeout: 5000,
                    variant: ToastVariant.Warning,
                    title: 'Email delivery is not configured on this server.'
                });

                return;
            }

            if (response.status === 409) {
                showToast({
                    timeout: 5000,
                    variant: ToastVariant.Info,
                    title: 'This address is already verified.'
                });

                return;
            }

            if (!response.ok) {
                showToast({
                    timeout: 5000,
                    variant: ToastVariant.Error,
                    title: 'The verification email could not be sent.'
                });

                return;
            }

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Verification email requested. Check your inbox.'
            });
        } catch (error) {
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: error instanceof Error ? error.message : 'The verification email could not be sent.'
            });
        }
    }, [showToast]);

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

    const renderSettingsCard = () => {
        return (
            <SettingsCard user={user} verifyCooldown={verifyCooldown} notificationsControl={renderNotificationsControl()} notificationsFooter={renderNotificationsFooter()} onVerify={handleVerify} onSignOut={handleSignOut} className={styles.wide} />
        );
    };

    const renderNotificationsControl = () => {
        if (isSupported !== true || permission === 'denied') {
            return;
        }

        return (
            <React.Fragment>
                {isOn ? (
                    <TestPushButton cooldown={testCooldown} total={TEST_PUSH_COOLDOWN_SECONDS} onSend={handleTestNotification} />
                ) : undefined}
                <Switch isChecked={isOn} onCheckedChange={handleToggleReminders} aria-label={NOTIFICATIONS_LABEL} />
            </React.Fragment>
        );
    };

    const renderNotificationsFooter = () => {
        if (isInstallRequired) {
            return (
                <Button block onClick={handleInstall}>
                    Install the app to enable reminders
                </Button>
            );
        }

        if (isSupported === false) {
            return (
                <div className={noticeClasses}>
                    Notifications aren't supported in this browser.
                </div>
            );
        }

        if (permission === 'denied') {
            return (
                <div className={noticeClasses}>
                    Notifications are blocked. Enable them for this site in your browser settings.
                </div>
            );
        }

        return;
    };

    const renderAboutCard = () => {
        return (
            <AboutCard className={styles.about} plantCount={plants.length} />
        );
    };

    const renderCreditsCard = () => {
        return (
            <CreditsCard className={styles.about} />
        );
    };

    const renderContent = () => {
        return (
            <div className={styles.cards}>
                {renderSettingsCard()}
                {renderAboutCard()}
                {renderCreditsCard()}
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
