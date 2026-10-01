'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useId, useReducer } from 'react';

// Constants
import { RESET_PASSWORD_CONFIRM_LABEL, RESET_PASSWORD_FRESH_LINK_LABEL, RESET_PASSWORD_GENERIC_ERROR, RESET_PASSWORD_MAX_LENGTH, RESET_PASSWORD_MIN_LENGTH, RESET_PASSWORD_MISMATCH, RESET_PASSWORD_NEW_LABEL, RESET_PASSWORD_SUBMIT_LABEL, RESET_PASSWORD_TITLE, RESET_PASSWORD_TOKEN_ERROR, RESET_PASSWORD_TOO_LONG, RESET_PASSWORD_TOO_SHORT, ResetPasswordActionType, ResetPasswordErrorCode, ResetPasswordStatus } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Helpers
import { initialState, resetPasswordReducer } from './helpers';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'main'> {
    token: string;
}

const ResetPasswordScreen: React.FunctionComponent<Props> = ({ token, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const [state, dispatch] = useReducer(resetPasswordReducer, initialState);
    const fieldErrorId = useId();

    const { confirmPassword, fieldError, isSubmitting, newPassword, status } = state;

    const handleNewPasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: ResetPasswordActionType.ChangeNew,
            value: event.target.value
        });
    }, []);

    const handleConfirmPasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: ResetPasswordActionType.ChangeConfirm,
            value: event.target.value
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

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        {RESET_PASSWORD_NEW_LABEL}
                        <input type="password" value={newPassword} onChange={handleNewPasswordChange} autoComplete="new-password" aria-describedby={fieldError ? fieldErrorId : undefined} required />
                    </label>

                    {fieldError && (
                        <p className={styles.error} role="alert" id={fieldErrorId}>
                            {fieldError}
                        </p>
                    )}

                    <label className={styles.field}>
                        {RESET_PASSWORD_CONFIRM_LABEL}
                        <input type="password" value={confirmPassword} onChange={handleConfirmPasswordChange} autoComplete="new-password" required />
                    </label>

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
            </div>
        </main>
    );
};

export default ResetPasswordScreen;
