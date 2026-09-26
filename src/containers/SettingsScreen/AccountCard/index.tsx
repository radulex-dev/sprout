import classNames from 'classnames';
import React from 'react';
import { BadgeCheck, User } from 'lucide-react';

// Constants
import { VERIFIED_LABEL, VERIFY_HINT, VERIFY_LABEL } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

// Types
import type { SettingsUser } from '../types';

export interface Props extends React.ComponentProps<'div'> {
    user: SettingsUser;
    verifyCooldown: number;
    verifyStatus: string;
    onVerify: () => void;
    onSignOut: () => void;
}

const AccountCard: React.FunctionComponent<Props> = ({ user, verifyCooldown, verifyStatus, onVerify, onSignOut, className, ...props }) => {
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
                {verifyStatus !== '' && (
                    <div className={styles.notice} role="status">
                        {verifyStatus}
                    </div>
                )}
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
            <div className={styles.actions}>
                <Button variant={ButtonVariant.Secondary} block onClick={onSignOut}>
                    Log out
                </Button>
            </div>
        </div>
    );
};

export default AccountCard;
