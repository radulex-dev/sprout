import classNames from 'classnames';
import React from 'react';
import { User } from 'lucide-react';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

// Types
import type { SettingsUser } from '../types';

export interface Props extends React.ComponentProps<'div'> {
    user: SettingsUser;
    onSignOut: () => void;
}

const AccountCard: React.FunctionComponent<Props> = ({ user, onSignOut, className, ...props }) => {
    const classes = classNames(styles.root, className);

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
            <div className={styles.actions}>
                <Button variant={ButtonVariant.Secondary} block onClick={onSignOut}>
                    Log out
                </Button>
            </div>
        </div>
    );
};

export default AccountCard;
