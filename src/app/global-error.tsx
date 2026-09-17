'use client';

import React, { useCallback } from 'react';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import './globals.css';
import styles from './global-error.module.css';

export interface Props {
    error: Error & { digest?: string; };
    reset: () => void;
}

const GlobalError: React.FunctionComponent<Pick<Props, 'reset'>> = ({ reset }) => {
    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    const handleSignOut = useCallback(async () => {
        await Promise.allSettled([authClient.signOut()]);

        location.assign('/login');
    }, []);

    return (
        <html lang="en">
            <body>
                <main className={styles.root}>
                    <h1 className={styles.title}>Something went wrong</h1>
                    <p className={styles.message}>
                        Sprout hit an unexpected error while loading. Try again to reload the app.
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
            </body>
        </html>
    );
};

export default GlobalError;
