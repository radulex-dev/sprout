'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Sprout } from 'lucide-react';

// Constants
import { ERROR_GOOGLE_SIGN_IN, GIS_RENDER_TIMEOUT_MS, GOOGLE_BUTTON_WIDTH } from './constants';
import { CONFIRM_LABEL, INSTALL_GUIDE_CONTENT } from '@/containers/SettingsScreen/InstallGuide/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import InstallButton from './InstallButton';
import InstallGuide from '@/containers/SettingsScreen/InstallGuide';
import AlertDialog from '@/design-system/AlertDialog';
import Button from '@/design-system/Button';

// Hooks
import { useInstall } from '@/hooks';

// Services
import { InstallPlatform } from '@/services/install';

// Auth
import { authClient } from '@/lib/auth/auth-client';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'main'> {
    mode: 'login' | 'signup';
    clientId: string;
}

const AuthScreen: React.FunctionComponent<Props> = ({ mode, clientId, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const { isStandalone, isPhone, platform, canPrompt, promptInstall } = useInstall();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleUnavailable, setIsGoogleUnavailable] = useState(!clientId);
    const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
    const googleSlotRef = useRef<HTMLDivElement>(null);
    const errorId = useId();

    useEffect(() => {
        if (isGoogleUnavailable) {
            return;
        }

        const timer = setTimeout(() => {
            const frame = googleSlotRef.current?.querySelector('iframe');

            if (!frame || frame.getBoundingClientRect().height < 10) {
                setIsGoogleUnavailable(true);
            }
        }, GIS_RENDER_TIMEOUT_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [isGoogleUnavailable]);

    const isSignup = mode === 'signup';
    const guidePlatform = platform ?? InstallPlatform.Other;
    const guideContent = INSTALL_GUIDE_CONTENT[guidePlatform];

    const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    }, []);

    const handlePasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }, []);

    const handleSubmit = useCallback(async (event: React.SyntheticEvent) => {
        event.preventDefault();

        setError('');
        setIsSubmitting(true);

        const callbackURL = '/';

        if (isSignup) {
            const result = await authClient.signUp.email({
                name,
                email,
                password,
                callbackURL
            });
            if (result.error) {
                setError(result.error.message ?? 'Sign-up failed.');
                setIsSubmitting(false);

                return;
            }
        } else {
            const result = await authClient.signIn.email({
                email,
                password
            });
            if (result.error) {
                setError(result.error.message ?? 'Sign-in failed.');
                setIsSubmitting(false);

                return;
            }
        }

        router.push(callbackURL);
        router.refresh();
    }, [name, email, password, isSignup, router]);

    const handleGoogleCredential = useCallback(async (response: CredentialResponse) => {
        if (!response.credential) {
            setError(ERROR_GOOGLE_SIGN_IN);

            return;
        }

        const result = await authClient.signIn.social({
            provider: 'google',
            idToken: {
                token: response.credential
            }
        });

        if (result.error) {
            setError(result.error.message ?? ERROR_GOOGLE_SIGN_IN);

            return;
        }

        router.push('/');
        router.refresh();
    }, [router]);

    const handleGoogleError = useCallback(() => {
        setError(ERROR_GOOGLE_SIGN_IN);
    }, []);

    const handleGoogleUnavailable = useCallback(() => {
        setIsGoogleUnavailable(true);
    }, []);

    const handleInstall = useCallback(async () => {
        if (canPrompt) {
            await promptInstall();

            return;
        }

        setIsInstallGuideOpen(true);
    }, [canPrompt, promptInstall]);

    const handleCloseInstallGuide = useCallback(() => {
        setIsInstallGuideOpen(false);
    }, []);

    const renderGooglePlaceholder = () => {
        return (
            <div className={styles.notice} role="status">
                Google sign-in is unavailable right now.
            </div>
        );
    };

    const renderGoogleButton = () => {
        return (
            <GoogleOAuthProvider clientId={clientId} onScriptLoadError={handleGoogleUnavailable}>
                <div className={styles.googleSlot} ref={googleSlotRef}>
                    <GoogleLogin type="standard" theme="outline" size="large" shape="pill" text="continue_with" logo_alignment="left" width={GOOGLE_BUTTON_WIDTH} onSuccess={handleGoogleCredential} onError={handleGoogleError} />
                </div>
            </GoogleOAuthProvider>
        );
    };

    const renderInstallButton = () => {
        if (isStandalone !== false || isPhone !== true) {
            return;
        }

        return (
            <InstallButton isPromptAvailable={canPrompt} onInstall={handleInstall} />
        );
    };

    const renderInstallGuide = () => {
        return (
            <AlertDialog isOpen={isInstallGuideOpen} title={guideContent.title} description={guideContent.description} confirmLabel={CONFIRM_LABEL} confirmVariant={ButtonVariant.Primary} hideCancel onConfirm={handleCloseInstallGuide} onCancel={handleCloseInstallGuide}>
                <InstallGuide platform={guidePlatform} />
            </AlertDialog>
        );
    };

    return (
        <main className={classes} {...props}>
            <div className={styles.hero}>
                <div className={styles.logo}>
                    <Sprout size="2.75rem" aria-hidden />
                </div>
                <h1>
                    Sprout
                </h1>
                <p className={styles.sub}>
                    Track your plants, never miss a watering.
                </p>
            </div>

            {renderInstallButton()}

            <form className={styles.form} onSubmit={handleSubmit}>
                {isSignup && (
                    <label className={styles.field}>
                        Name
                        <input value={name} onChange={handleNameChange} placeholder="Ada Lovelace" autoComplete="name" required />
                    </label>
                )}

                <label className={styles.field}>
                    Email
                    <input type="email" value={email} onChange={handleEmailChange} placeholder="you@example.com" autoComplete="email" aria-describedby={error ? errorId : undefined} required />
                </label>

                <label className={styles.field}>
                    Password
                    <input type="password" value={password} onChange={handlePasswordChange} placeholder="••••••••" autoComplete={isSignup ? 'new-password' : 'current-password'} aria-describedby={error ? errorId : undefined} required />
                </label>

                {error && (
                    <p className={styles.error} role="alert" id={errorId}>
                        {error}
                    </p>
                )}

                <Button variant={ButtonVariant.Primary} block type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'One moment…' : (isSignup ? 'Create account' : 'Sign in')}
                </Button>
            </form>

            <div className={styles.divider}>
                <span>
                    or
                </span>
            </div>

            {isGoogleUnavailable ? renderGooglePlaceholder() : renderGoogleButton()}

            <p className={styles.switch}>
                {`${isSignup ? 'Already have an account?' : 'New to Sprout?'} `}
                <Link href={isSignup ? '/login' : '/signup'}>
                    {isSignup ? 'Sign in' : 'Create account'}
                </Link>
            </p>

            {renderInstallGuide()}
        </main>
    );
};

export default AuthScreen;
