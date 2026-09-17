'use client';

import React, { useCallback } from 'react';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './error.module.css';

export interface Props {
    error: Error & { digest?: string; };
    reset: () => void;
}

const RootError: React.FunctionComponent<Pick<Props, 'reset'>> = ({ reset }) => {
    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    const handleSignOut = useCallback(async () => {
        await Promise.allSettled([authClient.signOut()]);

        location.assign('/login');
    }, []);

    return (
        <main className={styles.root}>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.message}>
                An unexpected error interrupted this screen. Try again to reload it.
            </p>
            <div className={styles.actions}>
                <Button block onClick={handleReset}>
                    Try again
                </Button>
                <Button variant={ButtonVariant.Outline} block onClick={handleSignOut}>
                    Log out
                </Button>
            </div>
        </main>
    );
};

export default RootError;
