'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useReducer } from 'react';

// Constants
import { RESET_PASSWORD_CONFIRM_LABEL, RESET_PASSWORD_EXPIRED_NOTICE, RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED, RESET_PASSWORD_FRESH_LINK_LABEL, RESET_PASSWORD_GENERIC_ERROR, RESET_PASSWORD_MAX_LENGTH, RESET_PASSWORD_MIN_LENGTH, RESET_PASSWORD_MISMATCH, RESET_PASSWORD_NEW_LABEL, RESET_PASSWORD_SUBMIT_LABEL, RESET_PASSWORD_TITLE, RESET_PASSWORD_TOKEN_ERROR, RESET_PASSWORD_TOO_LONG, RESET_PASSWORD_TOO_SHORT, ResetPasswordActionType, ResetPasswordErrorCode, ResetPasswordStatus } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import Field from '@/design-system/Field';

// Helpers
import { initialState, resetPasswordReducer } from './helpers';

// Database
import { rememberResetEmail } from '@/lib/db/actions';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'main'> {
    token: string;
    email?: string;
    emailVerified?: boolean;
    tokenExpired?: boolean;
}

const ResetPasswordScreen: React.FunctionComponent<Props> = ({ token, email, emailVerified = false, tokenExpired = false, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const [state, dispatch] = useReducer(resetPasswordReducer, initialState);

    const { confirmPassword, fieldError, isSubmitting, newPassword, status } = state;

    const expiredNotice = emailVerified ? RESET_PASSWORD_EXPIRED_NOTICE : RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED;

    const handleNewPasswordChange = useCallback((value: string) => {
        dispatch({
            type: ResetPasswordActionType.ChangeNew,
            value
        });
    }, []);

    const handleConfirmPasswordChange = useCallback((value: string) => {
        dispatch({
            type: ResetPasswordActionType.ChangeConfirm,
            value
        });
    }, []);

    const handleSubmit = useCallback(async (event: React.SyntheticEvent) => {
        event.preventDefault();

        dispatch({
            type: ResetPasswordActionType.Validate
        });

        if (newPassword !== confirmPassword) {
            dispatch({
                type: ResetPasswordActionType.FieldError,
                fieldError: RESET_PASSWORD_MISMATCH
            });

            return;
        }

        if (newPassword.length < RESET_PASSWORD_MIN_LENGTH) {
            dispatch({
                type: ResetPasswordActionType.FieldError,
                fieldError: RESET_PASSWORD_TOO_SHORT
            });

            return;
        }

        if (newPassword.length > RESET_PASSWORD_MAX_LENGTH) {
            dispatch({
                type: ResetPasswordActionType.FieldError,
                fieldError: RESET_PASSWORD_TOO_LONG
            });

            return;
        }

        dispatch({
            type: ResetPasswordActionType.BeginSubmit
        });

        const result = await authClient.resetPassword({
            newPassword,
            token
        });

        if (!result.error) {
            router.push('/login?reset=success');

            return;
        }

        if (result.error.code === ResetPasswordErrorCode.InvalidToken) {
            dispatch({
                type: ResetPasswordActionType.TokenError
            });

            return;
        }

        if (result.error.code === ResetPasswordErrorCode.PasswordTooShort) {
            dispatch({
                type: ResetPasswordActionType.FieldError,
                fieldError: RESET_PASSWORD_TOO_SHORT
            });

            return;
        }

        if (result.error.code === ResetPasswordErrorCode.PasswordTooLong) {
            dispatch({
                type: ResetPasswordActionType.FieldError,
                fieldError: RESET_PASSWORD_TOO_LONG
            });

            return;
        }

        dispatch({
            type: ResetPasswordActionType.GenericError
        });
    }, [newPassword, confirmPassword, token, router]);

    return (
        <main className={classes} {...props}>
            <div className={styles.card}>
                <h1 className={styles.title}>
                    {RESET_PASSWORD_TITLE}
                </h1>

                {tokenExpired ? (
                    <div className={styles.expired}>
                        <p className={styles.notice}>
                            {expiredNotice}
                        </p>

                        <form className={styles.switch} action={rememberResetEmail}>
                            <input type="hidden" name="email" value={email ?? ''} />

                            <Button variant={ButtonVariant.Primary} type="submit">
                                {RESET_PASSWORD_FRESH_LINK_LABEL}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <Field label={RESET_PASSWORD_NEW_LABEL} type="password" value={newPassword} onValueChange={handleNewPasswordChange} autoComplete="new-password" error={fieldError} required />

                        <Field label={RESET_PASSWORD_CONFIRM_LABEL} type="password" value={confirmPassword} onValueChange={handleConfirmPasswordChange} autoComplete="new-password" required />

                        {status === ResetPasswordStatus.TokenError && (
                            <p className={styles.error} role="alert">
                                {RESET_PASSWORD_TOKEN_ERROR}
                            </p>
                        )}

                        {status === ResetPasswordStatus.GenericError && (
                            <p className={styles.error} role="alert">
                                {RESET_PASSWORD_GENERIC_ERROR}
                            </p>
                        )}

                        {status === ResetPasswordStatus.TokenError && (
                            <p className={styles.switch}>
                                <Link href="/forgot-password">
                                    {RESET_PASSWORD_FRESH_LINK_LABEL}
                                </Link>
                            </p>
                        )}

                        <Button variant={ButtonVariant.Primary} block type="submit" disabled={isSubmitting}>
                            {RESET_PASSWORD_SUBMIT_LABEL}
                        </Button>
                    </form>
                )}
            </div>
        </main>
    );
};

export default ResetPasswordScreen;
