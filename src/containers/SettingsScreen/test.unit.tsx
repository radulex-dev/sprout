import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

// Constants
import { NOTIFICATIONS_LABEL } from './constants';
import { TEST_PUSH_LABEL } from './TestPushButton/constants';

// Components
import SettingsScreen from './index';
import ToastProvider from '@/design-system/ToastProvider';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const { checkNotifyMock, fetchMock, installMock, notificationsMock, permissionMock, promptInstallMock, pushMock, setRemindersEnabledMock, signOutMock } = vi.hoisted(() => {
    return {
        checkNotifyMock: vi.fn(),
        fetchMock: vi.fn(),
        installMock: {
            canPrompt: false,
            isStandalone: true
        },
        notificationsMock: {
            isOptedOut: false,
            isSubscribed: true,
            isSupported: true
        },
        permissionMock: vi.fn((): NotificationPermission => {
            return 'granted';
        }),
        promptInstallMock: vi.fn(),
        pushMock: vi.fn(),
        setRemindersEnabledMock: vi.fn(),
        signOutMock: vi.fn(() => {
            return Promise.resolve();
        })
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
                isStandalone: installMock.isStandalone,
                isPhone: false,
                platform: undefined,
                canPrompt: installMock.canPrompt,
                promptInstall: promptInstallMock
            };
        }
    };
});

vi.mock('@/hooks/useNotifications', () => {
    return {
        useNotifications: () => {
            return {
                isSupported: notificationsMock.isSupported,
                permission: permissionMock(),
                isSubscribed: notificationsMock.isSubscribed,
                isOptedOut: notificationsMock.isOptedOut,
                requestPermission: vi.fn(),
                setRemindersEnabled: setRemindersEnabledMock
            };
        }
    };
});

vi.mock('@/services/notifications', () => {
    return {
        checkAndNotify: checkNotifyMock
    };
});

vi.mock('@/lib/auth/auth-client', () => {
    return {
        authClient: {
            signOut: signOutMock
        }
    };
});

const props: React.ComponentProps<typeof SettingsScreen> = {
    plants: [makePlant()],
    user: {
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        emailVerified: false
    }
};

const advanceCooldown = async (seconds: number): Promise<void> => {
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
    }
};

describe('<SettingsScreen />', () => {
    beforeEach(() => {
        vi.useFakeTimers({
            shouldAdvanceTime: true
        });
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200
        });

        installMock.canPrompt = false;
        installMock.isStandalone = true;
        notificationsMock.isOptedOut = false;
        notificationsMock.isSubscribed = true;
        notificationsMock.isSupported = true;
        permissionMock.mockReturnValue('granted');
    });

    it('requests one verification email and blocks a resend while the cooldown runs', async () => {
        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/email/resend-verification', {
            method: 'POST'
        });
        expect(screen.getByText('Verification email requested. Check your inbox.')).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Try again in 60s'
        })).toBeDisabled();

        await user.click(screen.getByRole('button', {
            name: 'Try again in 60s'
        }));

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('counts the cooldown down and re-enables the verify control after 60 seconds', async () => {
        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(screen.getByRole('button', {
            name: 'Try again in 60s'
        })).toBeDisabled();

        await advanceCooldown(1);

        expect(screen.getByRole('button', {
            name: 'Try again in 59s'
        })).toBeDisabled();

        await advanceCooldown(59);

        expect(screen.getByRole('button', {
            name: 'Verify account'
        })).toBeEnabled();
    });

    it.each([{
        status: 503,
        expectedCopy: 'Email delivery is not configured on this server.'
    }, {
        status: 409,
        expectedCopy: 'This address is already verified.'
    }])('shows the server message when the route answers $status', async ({ status, expectedCopy }) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status
        });

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(screen.getByText(expectedCopy)).toBeInTheDocument();
    });

    it('shows the failure copy when the route answers an unexpected status', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500
        });

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(screen.getByText('The verification email could not be sent.')).toBeInTheDocument();
    });

    it('shows the failure copy when the request rejects', async () => {
        fetchMock.mockRejectedValue(new Error('Failed to fetch'));

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('shows the fallback failure copy when the verification request rejects with a non-Error', async () => {
        fetchMock.mockRejectedValue('offline');

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Verify account'
        }));

        expect(screen.getByText('The verification email could not be sent.')).toBeInTheDocument();
    });

    it('signs out and sends the user to the login screen', async () => {
        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Log out'
        }));

        expect(signOutMock).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith('/login');
    });

    it.each([{
        sent: 1,
        expectedCopy: 'Test push sent to 1 device.'
    }, {
        sent: 2,
        expectedCopy: 'Test push sent to 2 devices.'
    }])('shows the success copy when the test push reports sent=$sent', async ({ sent, expectedCopy }) => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                sent
            })
        });

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: TEST_PUSH_LABEL
        }));

        expect(screen.getByText(expectedCopy)).toBeInTheDocument();

        await advanceCooldown(15);

        expect(screen.getByRole('button', {
            name: TEST_PUSH_LABEL
        })).toBeEnabled();
    });

    it.each([{
        status: 409,
        expectedCopy: 'No push subscription is registered for this device, so reminders cannot reach it.'
    }, {
        status: 502,
        expectedCopy: 'The test push could not be sent.'
    }])('shows the test push failure copy when the route answers $status', async ({ status, expectedCopy }) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status
        });

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: TEST_PUSH_LABEL
        }));

        expect(screen.getByText(expectedCopy)).toBeInTheDocument();
    });

    it.each([{
        rejection: new Error('Push service unavailable'),
        expectedCopy: 'Push service unavailable'
    }, {
        rejection: 'offline',
        expectedCopy: 'The test push could not be sent.'
    }])('shows the test push failure copy when the request rejects with $rejection', async ({ rejection, expectedCopy }) => {
        fetchMock.mockRejectedValue(rejection);

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: TEST_PUSH_LABEL
        }));

        expect(screen.getByText(expectedCopy)).toBeInTheDocument();
    });

    it('turns reminders off without running a care check', async () => {
        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('switch', {
            name: NOTIFICATIONS_LABEL
        }));

        expect(setRemindersEnabledMock).toHaveBeenCalledTimes(1);
        expect(setRemindersEnabledMock).toHaveBeenCalledWith(false);
        expect(checkNotifyMock).not.toHaveBeenCalled();
    });

    it('turns reminders on and runs a care check', async () => {
        notificationsMock.isOptedOut = true;

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        expect(screen.queryByRole('button', {
            name: TEST_PUSH_LABEL
        })).not.toBeInTheDocument();

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('switch', {
            name: NOTIFICATIONS_LABEL
        }));

        expect(setRemindersEnabledMock).toHaveBeenCalledTimes(1);
        expect(setRemindersEnabledMock).toHaveBeenCalledWith(true);
        expect(checkNotifyMock).toHaveBeenCalledTimes(1);
    });

    it('prompts the install flow when the browser can prompt', async () => {
        installMock.canPrompt = true;
        installMock.isStandalone = false;
        notificationsMock.isSupported = false;

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Install the app to enable reminders'
        }));

        expect(promptInstallMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('opens the install guide and closes it when dismissed', async () => {
        installMock.isStandalone = false;
        notificationsMock.isSupported = false;

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        await user.click(screen.getByRole('button', {
            name: 'Install the app to enable reminders'
        }));

        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText('Install Sprout to get the full-screen app experience on your device.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Got it'
        }));

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('explains that notifications are unsupported when installed but the browser lacks support', () => {
        notificationsMock.isSupported = false;

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        expect(screen.getByText('Notifications aren\'t supported in this browser.')).toBeInTheDocument();
        expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('explains that notifications are blocked when permission is denied', () => {
        permissionMock.mockReturnValue('denied');

        render(
            <ToastProvider>
                <SettingsScreen {...props} />
            </ToastProvider>
        );

        expect(screen.getByText('Notifications are blocked. Enable them for this site in your browser settings.')).toBeInTheDocument();
        expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
});
