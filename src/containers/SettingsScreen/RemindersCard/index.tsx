import React from 'react';
import classNames from 'classnames';
import { Bell, Check, Lightbulb } from 'lucide-react';

// Constants
import { IPHONE_HINT_STYLE } from '../constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    isSupported: boolean | undefined;
    perm: NotificationPermission;
    needsInstall: boolean;
    onEnable: () => void;
    onInstall: () => void;
    onTest: () => void;
}

const RemindersCard: React.FunctionComponent<Props> = ({ isSupported, perm, needsInstall, onEnable, onInstall, onTest, className, ...props }) => {
    const warnNoticeClasses = classNames(styles.notice, styles.warn);
    const classes = classNames(styles.root, className);

    const renderUnsupported = () => {
        if (needsInstall) {
            return (
                <Button block onClick={onInstall}>
                    Install the app to enable reminders
                </Button>
            );
        }

        return (
            <div className={warnNoticeClasses}>
                Notifications aren't supported in this browser.
            </div>
        );
    };

    const renderEnabled = () => {
        return (
            <React.Fragment>
                <div className={styles.notice}>
                    <Check size="1rem" aria-hidden />
                    Notifications are enabled.
                </div>
                <Button variant={ButtonVariant.Secondary} block onClick={onTest}>
                    Send a test notification
                </Button>
            </React.Fragment>
        );
    };

    const renderBlocked = () => {
        return (
            <div className={warnNoticeClasses}>
                Notifications are blocked. Enable them for this site in your browser settings.
            </div>
        );
    };

    const renderPrompt = () => {
        return (
            <Button block onClick={onEnable}>
                Enable notifications
            </Button>
        );
    };

    const renderStatus = () => {
        if (isSupported === undefined) {
            return;
        }

        if (!isSupported) {
            return renderUnsupported();
        }

        if (perm === 'granted') {
            return renderEnabled();
        }

        if (perm === 'denied') {
            return renderBlocked();
        }

        return renderPrompt();
    };

    return (
        <div className={classes} {...props}>
            <h2>
                <Bell size="1.125rem" aria-hidden />
                Care reminders
            </h2>
            <p>
                Get a notification when a plant is due for watering, fertilising or repotting. Checks run
                when the app is open or in the background (installed app on Android/Chrome).
            </p>
            {renderStatus()}
            {!needsInstall && (
                <p className={styles.hint} style={IPHONE_HINT_STYLE}>
                    <Lightbulb size="1rem" aria-hidden />
                    <span>
                        On iPhone, open this app in Safari, tap Share →
                        <strong>
                            Add to Home Screen
                        </strong>
                        , then enable notifications from the installed app (iOS 16.4+).
                    </span>
                </p>
            )}
        </div>
    );
};

export default RemindersCard;
