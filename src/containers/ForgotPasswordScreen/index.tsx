'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';

// Constants
import { FORGOT_PASSWORD_CONFIRMATION, FORGOT_PASSWORD_COOLDOWN_SECONDS, FORGOT_PASSWORD_EMAIL_LABEL, FORGOT_PASSWORD_ERROR, FORGOT_PASSWORD_HINT, FORGOT_PASSWORD_SUBMIT_LABEL, FORGOT_PASSWORD_TITLE, ForgotPasswordStatus } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'main'> {
    initialEmail?: string;
}

const ForgotPasswordScreen: React.FunctionComponent<Props> = ({ initialEmail = '', className, ...props }) => {
    const classes = classNames(styles.root, className);

    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState(ForgotPasswordStatus.Idle);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) {
            return;
        }

        const timeout = setTimeout(() => {
            setCooldown((remaining) => {
                return remaining - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [cooldown]);

    const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    }, []);

    const handleSubmit = useCallback(async (event: React.SyntheticEvent) => {
        event.preventDefault();

        setStatus(ForgotPasswordStatus.Idle);
        setCooldown(FORGOT_PASSWORD_COOLDOWN_SECONDS);

        try {
            await authClient.requestPasswordReset({
                email
            });

            setStatus(ForgotPasswordStatus.Confirmation);
        } catch {
            setStatus(ForgotPasswordStatus.Failure);
        }
    }, [email]);

    const isCoolingDown = cooldown > 0;
    const submitLabel = isCoolingDown ? `Try again in ${cooldown}s` : FORGOT_PASSWORD_SUBMIT_LABEL;

    return (
        <main className={classes} {...props}>
            <div className={styles.card}>
                <h1 className={styles.title}>
                    {FORGOT_PASSWORD_TITLE}
                </h1>
                <p className={styles.hint}>
                    {FORGOT_PASSWORD_HINT}
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        {FORGOT_PASSWORD_EMAIL_LABEL}
                        <input type="email" value={email} onChange={handleEmailChange} placeholder="you@example.com" autoComplete="email" required />
                    </label>

                    {status === ForgotPasswordStatus.Confirmation && (
                        <p className={styles.confirmation} role="status">
                            {FORGOT_PASSWORD_CONFIRMATION}
                        </p>
                    )}

                    {status === ForgotPasswordStatus.Failure && (
                        <p className={styles.error} role="alert">
                            {FORGOT_PASSWORD_ERROR}
                        </p>
                    )}

                    <Button variant={ButtonVariant.Primary} block type="submit" disabled={isCoolingDown}>
                        {submitLabel}
                    </Button>
                </form>
            </div>
        </main>
    );
};

export default ForgotPasswordScreen;
