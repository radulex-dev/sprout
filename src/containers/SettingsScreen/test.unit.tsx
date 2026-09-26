import type React from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

// Components
import SettingsScreen from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const { fetchMock, pushMock, signOutMock } = vi.hoisted(() => {
    return {
        fetchMock: vi.fn(),
        pushMock: vi.fn(),
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
                isStandalone: true,
                isPhone: false,
                platform: undefined,
                canPrompt: false,
                promptInstall: vi.fn()
            };
        }
    };
});

vi.mock('@/hooks/useNotifications', () => {
    return {
        useNotifications: () => {
            return {
                isSupported: true,
                permission: 'granted',
                requestPermission: vi.fn()
            };
        }
    };
});

vi.mock('@/services/notifications', () => {
    return {
        checkAndNotify: vi.fn()
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

const clickVerify = async (name: string): Promise<void> => {
    const browserUser = userEvent.setup({
        advanceTimers: (delay) => {
            vi.advanceTimersByTime(delay);
        }
    });

    const click = browserUser.click(screen.getByRole('button', {
        name
    }));

    await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
    });

    await click;
};

const advanceCooldown = async (seconds: number): Promise<void> => {
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
    }
};

describe('SettingsScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('requests one verification email and blocks a resend while the cooldown runs', async () => {
        render(<SettingsScreen {...props} />);

        await clickVerify('Verify account');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/email/resend-verification', {
            method: 'POST'
        });
        expect(screen.getByRole('status')).toHaveTextContent('Verification email requested. Check your inbox.');
        expect(screen.getByRole('button', {
            name: 'Try again in 60s'
        })).toBeDisabled();

        await clickVerify('Try again in 60s');

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('counts the cooldown down and re-enables the verify control after 60 seconds', async () => {
        render(<SettingsScreen {...props} />);

        await clickVerify('Verify account');

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

        render(<SettingsScreen {...props} />);

        await clickVerify('Verify account');

        expect(screen.getByRole('status')).toHaveTextContent(expectedCopy);
    });

    it('shows the failure copy when the route answers an unexpected status', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500
        });

        render(<SettingsScreen {...props} />);

        await clickVerify('Verify account');

        expect(screen.getByRole('status')).toHaveTextContent('The verification email could not be sent.');
    });

    it('shows the failure copy when the request rejects', async () => {
        fetchMock.mockRejectedValue(new Error('Failed to fetch'));

        render(<SettingsScreen {...props} />);

        await clickVerify('Verify account');

        expect(screen.getByRole('status')).toHaveTextContent('Failed to fetch');
    });
});
