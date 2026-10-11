import classNames from 'classnames';
import React from 'react';
import { BadgeCheck, Info, SlidersHorizontal, User } from 'lucide-react';

// Constants
import { NOTIFICATIONS_DESCRIPTION, NOTIFICATIONS_LABEL, PREFERENCES_LABEL, VERIFIED_LABEL, VERIFY_HINT, VERIFY_LABEL } from '../constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import Popover from '@/design-system/Popover';

// Styles
import styles from './styles.module.css';

// Types
import type { SettingsUser } from '../types';

export interface Props extends React.ComponentProps<'div'> {
    user: SettingsUser;
    verifyCooldown: number;
    notificationsControl?: React.ReactNode;
    notificationsFooter?: React.ReactNode;
    onVerify: () => void;
    onSignOut: () => void;
}

const SettingsCard: React.FunctionComponent<Props> = ({ user, verifyCooldown, notificationsControl, notificationsFooter, onVerify, onSignOut, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const renderVerification = () => {
        if (user.emailVerified) {
            return (
                <div className={styles.notice}>
                    <BadgeCheck size="1rem" aria-hidden />
                    {VERIFIED_LABEL}
                </div>
            );
        }

        const isVerifyCoolingDown = verifyCooldown > 0;

        return (
            <React.Fragment>
                <div className={styles.notice}>
                    {VERIFY_HINT}
                </div>
                <Button block disabled={isVerifyCoolingDown} onClick={onVerify}>
                    {isVerifyCoolingDown ? `Try again in ${verifyCooldown}s` : VERIFY_LABEL}
                </Button>
            </React.Fragment>
        );
    };

    return (
        <div className={classes} {...props}>
            <h2>
                <User size="1.125rem" aria-hidden />
                Account
            </h2>
            <p className={styles.identity}>
                Signed in as
                <strong className={styles.name}>
                    {user.name}
                </strong>
                <span className={styles.email}>
                    {user.email}
                </span>
            </p>
            {renderVerification()}
            <div className={styles.settings}>
                <h3 className={styles.heading}>
                    <SlidersHorizontal size="1.125rem" aria-hidden />
                    {PREFERENCES_LABEL}
                </h3>
                <div className={styles.row}>
                    <span className={styles.rowLabel}>
                        {NOTIFICATIONS_LABEL}
                    </span>
                    <div className={styles.controls}>
                        {notificationsControl}
                        <Popover trigger={<Info size="1rem" aria-hidden />} aria-label={`About ${NOTIFICATIONS_LABEL}`} openOnHover className={styles.info}>
                            <p className={styles.description}>
                                {NOTIFICATIONS_DESCRIPTION}
                            </p>
                        </Popover>
                    </div>
                </div>
                {notificationsFooter ? (
                    <div className={styles.footer}>
                        {notificationsFooter}
                    </div>
                ) : undefined}
            </div>
            <div className={styles.actions}>
                <Button variant={ButtonVariant.Secondary} block onClick={onSignOut}>
                    Log out
                </Button>
            </div>
        </div>
    );
};

export default SettingsCard;
