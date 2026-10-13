import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

// Constants
import { ERROR_GOOGLE_SIGN_IN, FORGOT_PASSWORD_LABEL, GIS_RENDER_TIMEOUT_MS, RESET_SUCCESS_TEXT } from './constants';
import { CONFIRM_LABEL, STEPS_HEADING } from '@/containers/SettingsScreen/InstallGuide/constants';

// Components
import AuthScreen from './index';

const { googleMock, installState, promptInstallMock, pushMock, signInEmailMock, signInSocialMock, signUpEmailMock } = vi.hoisted(() => {
    return {
        googleMock: {
            credential: 'google-id-token',
            failWithError: false,
            omitCredential: false
        },
        installState: {
            canPrompt: false,
            isPhone: false,
            isStandalone: false
        },
        promptInstallMock: vi.fn(),
        pushMock: vi.fn(),
        signInEmailMock: vi.fn(),
        signInSocialMock: vi.fn(),
        signUpEmailMock: vi.fn()
    };
});

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: pushMock,
                refresh: vi.fn()
            };
        }
    };
});

vi.mock('@/hooks', () => {
    return {
        useInstall: () => {
            return {
                canPrompt: installState.canPrompt,
                isPhone: installState.isPhone,
                isStandalone: installState.isStandalone,
                platform: undefined,
                promptInstall: promptInstallMock
            };
        }
    };
});

vi.mock('@/lib/auth/auth-client', () => {
    return {
        authClient: {
            signIn: {
                email: signInEmailMock,
                social: signInSocialMock
            },
            signUp: {
                email: signUpEmailMock
            }
        }
    };
});

vi.mock('@react-oauth/google', () => {
    return {
        GoogleLogin: (props: React.ComponentProps<typeof GoogleLogin>) => {
            const handleClick = () => {
                if (googleMock.failWithError) {
                    props.onError?.();

                    return;
                }

                if (googleMock.omitCredential) {
                    props.onSuccess({});

                    return;
                }

                props.onSuccess({
                    credential: googleMock.credential
                });
            };

            return (
                <button type="button" onClick={handleClick}>Continue with Google</button>
            );
        },
        GoogleOAuthProvider: (props: React.ComponentProps<typeof GoogleOAuthProvider>) => {
            const handleScriptLoadError = () => {
                props.onScriptLoadError?.();
            };

            return (
                <div>
                    <button type="button" onClick={handleScriptLoadError}>Simulate Google script error</button>
                    {props.children}
                </div>
            );
        }
    };
});

const props: React.ComponentProps<typeof AuthScreen> = {
    mode: 'login',
    clientId: ''
};

describe('<AuthScreen />', () => {
    beforeEach(() => {
        googleMock.credential = 'google-id-token';
        googleMock.failWithError = false;
        googleMock.omitCredential = false;
        installState.canPrompt = false;
        installState.isPhone = false;
        installState.isStandalone = false;
    });

    it('links to password recovery from the sign-in form', () => {
        render(<AuthScreen {...props} />);

        expect(screen.getByRole('link', {
            name: FORGOT_PASSWORD_LABEL
        })).toHaveAttribute('href', '/forgot-password');
    });

    it('hides password recovery from the sign-up form', () => {
        render(<AuthScreen {...props} mode="signup" />);

        expect(screen.queryByRole('link', {
            name: FORGOT_PASSWORD_LABEL
        })).not.toBeInTheDocument();
    });

    it('shows the reset notice after a password reset', () => {
        render(<AuthScreen {...props} resetSuccess />);

        expect(screen.getByText(RESET_SUCCESS_TEXT)).toBeInTheDocument();
    });

    it('hides the reset notice by default', () => {
        render(<AuthScreen {...props} />);

        expect(screen.queryByText(RESET_SUCCESS_TEXT)).not.toBeInTheDocument();
    });

    it('signs in with the email and password', async () => {
        const user = userEvent.setup();
        signInEmailMock.mockResolvedValue({
            error: undefined
        });

        render(<AuthScreen {...props} />);
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-pass');
        await user.click(screen.getByRole('button', {
            name: 'Sign in'
        }));

        await waitFor(() => {
            expect(signInEmailMock).toHaveBeenCalledWith({
                email: 'ada@example.com',
                password: 'secret-pass'
            });
        });
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('shows the sign-in error the auth service returns', async () => {
        const user = userEvent.setup();
        signInEmailMock.mockResolvedValue({
            error: {
                message: 'Invalid email or password'
            }
        });

        render(<AuthScreen {...props} />);
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'wrong-pass');
        await user.click(screen.getByRole('button', {
            name: 'Sign in'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
        expect(pushMock).not.toHaveBeenCalled();
        expect(screen.getByRole('button', {
            name: 'Sign in'
        })).toBeEnabled();
    });

    it('falls back to a generic sign-in error when the auth service sends no message', async () => {
        const user = userEvent.setup();
        signInEmailMock.mockResolvedValue({
            error: {}
        });

        render(<AuthScreen {...props} />);
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'wrong-pass');
        await user.click(screen.getByRole('button', {
            name: 'Sign in'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed.');
    });

    it('signs up with a name, email and password', async () => {
        const user = userEvent.setup();
        signUpEmailMock.mockResolvedValue({
            error: undefined
        });

        render(<AuthScreen {...props} mode="signup" />);
        await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-pass');
        await user.click(screen.getByRole('button', {
            name: 'Create account'
        }));

        await waitFor(() => {
            expect(signUpEmailMock).toHaveBeenCalledWith({
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                password: 'secret-pass',
                callbackURL: '/'
            });
        });
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('shows the sign-up error the auth service returns', async () => {
        const user = userEvent.setup();
        signUpEmailMock.mockResolvedValue({
            error: {
                message: 'Email already registered'
            }
        });

        render(<AuthScreen {...props} mode="signup" />);
        await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-pass');
        await user.click(screen.getByRole('button', {
            name: 'Create account'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('falls back to a generic sign-up error when the auth service sends no message', async () => {
        const user = userEvent.setup();
        signUpEmailMock.mockResolvedValue({
            error: {}
        });

        render(<AuthScreen {...props} mode="signup" />);
        await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-pass');
        await user.click(screen.getByRole('button', {
            name: 'Create account'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Sign-up failed.');
    });

    it('signs in with a Google credential', async () => {
        const user = userEvent.setup();
        signInSocialMock.mockResolvedValue({
            error: undefined
        });

        render(<AuthScreen {...props} clientId="client-id" />);
        await user.click(screen.getByRole('button', {
            name: 'Continue with Google'
        }));

        await waitFor(() => {
            expect(signInSocialMock).toHaveBeenCalledWith({
                provider: 'google',
                idToken: {
                    token: 'google-id-token'
                }
            });
        });
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('reports a missing Google credential without calling the auth service', async () => {
        const user = userEvent.setup();
        googleMock.omitCredential = true;

        render(<AuthScreen {...props} clientId="client-id" />);
        await user.click(screen.getByRole('button', {
            name: 'Continue with Google'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_GOOGLE_SIGN_IN);
        expect(signInSocialMock).not.toHaveBeenCalled();
    });

    it('shows the Google error the auth service returns', async () => {
        const user = userEvent.setup();
        signInSocialMock.mockResolvedValue({
            error: {
                message: 'Google account rejected'
            }
        });

        render(<AuthScreen {...props} clientId="client-id" />);
        await user.click(screen.getByRole('button', {
            name: 'Continue with Google'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Google account rejected');
    });

    it('shows the Google error when the sign-in button fails', async () => {
        const user = userEvent.setup();
        googleMock.failWithError = true;

        render(<AuthScreen {...props} clientId="client-id" />);
        await user.click(screen.getByRole('button', {
            name: 'Continue with Google'
        }));

        expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_GOOGLE_SIGN_IN);
    });

    it('falls back to the placeholder when the Google script fails to load', async () => {
        const user = userEvent.setup();

        render(<AuthScreen {...props} clientId="client-id" />);
        await user.click(screen.getByRole('button', {
            name: 'Simulate Google script error'
        }));

        expect(screen.getByText('Google sign-in is unavailable right now.')).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Continue with Google'
        })).not.toBeInTheDocument();
    });

    it('falls back to the placeholder when the Google button never renders in time', () => {
        vi.useFakeTimers({
            toFake: ['Date', 'setTimeout', 'clearTimeout']
        });

        render(<AuthScreen {...props} clientId="client-id" />);
        expect(screen.queryByText('Google sign-in is unavailable right now.')).not.toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(GIS_RENDER_TIMEOUT_MS);
        });

        expect(screen.getByText('Google sign-in is unavailable right now.')).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Continue with Google'
        })).not.toBeInTheDocument();
    });

    it('opens the install guide when the browser cannot prompt', async () => {
        const user = userEvent.setup();
        installState.isPhone = true;

        render(<AuthScreen {...props} />);
        await user.click(screen.getByRole('button', {
            name: 'How to install'
        }));

        expect(screen.getByRole('alertdialog')).toHaveTextContent('Install Sprout');
        expect(screen.getByRole('alertdialog')).toHaveTextContent(STEPS_HEADING);

        await user.click(screen.getByRole('button', {
            name: CONFIRM_LABEL
        }));

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('prompts the browser install instead of opening the guide when the prompt is available', async () => {
        const user = userEvent.setup();
        installState.canPrompt = true;
        installState.isPhone = true;

        render(<AuthScreen {...props} />);
        await user.click(screen.getByRole('button', {
            name: 'Install app'
        }));

        expect(promptInstallMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});
