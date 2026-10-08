import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

// Constants
import { ANALYTICS_CONSENT_ACCEPT_LABEL, ANALYTICS_CONSENT_DECLINE_LABEL, ANALYTICS_CONSENT_EXIT_MS, ANALYTICS_CONSENT_MESSAGE } from './constants';
import { ANALYTICS_CONSENT_KEY } from '@/hooks/useAnalyticsConsent/constants';

// Components
import AnalyticsConsent from './index';

vi.mock('@/components/Analytics', () => {
    return {
        default: () => {
            return <span>Umami</span>;
        }
    };
});

const props: React.ComponentProps<typeof AnalyticsConsent> = {};

describe('AnalyticsConsent', () => {
    it('shows the banner and loads no analytics when no choice is stored', () => {
        render(<AnalyticsConsent {...props} />);

        expect(screen.getByText(ANALYTICS_CONSENT_MESSAGE)).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: ANALYTICS_CONSENT_ACCEPT_LABEL
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: ANALYTICS_CONSENT_DECLINE_LABEL
        })).toBeInTheDocument();
        expect(screen.queryByText('Umami')).not.toBeInTheDocument();
    });

    it('stores the choice and loads analytics after the exit animation when accepting', async () => {
        vi.useFakeTimers();

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        render(<AnalyticsConsent {...props} />);

        const click = user.click(screen.getByRole('button', {
            name: ANALYTICS_CONSENT_ACCEPT_LABEL
        }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });

        await click;

        expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('true');
        expect(screen.getByText(ANALYTICS_CONSENT_MESSAGE)).toBeInTheDocument();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(ANALYTICS_CONSENT_EXIT_MS);
        });

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.getByText('Umami')).toBeInTheDocument();
    });

    it('stores the choice and loads no analytics after the exit animation when declining', async () => {
        vi.useFakeTimers();

        const user = userEvent.setup({
            advanceTimers: (delay) => {
                vi.advanceTimersByTime(delay);
            }
        });

        render(<AnalyticsConsent {...props} />);

        const click = user.click(screen.getByRole('button', {
            name: ANALYTICS_CONSENT_DECLINE_LABEL
        }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });

        await click;

        expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('false');
        expect(screen.getByText(ANALYTICS_CONSENT_MESSAGE)).toBeInTheDocument();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(ANALYTICS_CONSENT_EXIT_MS);
        });

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.queryByText('Umami')).not.toBeInTheDocument();
    });

    it('loads analytics without a banner when acceptance is already stored', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');

        render(<AnalyticsConsent {...props} />);

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.getByText('Umami')).toBeInTheDocument();
    });

    it('shows no banner and loads no analytics when a refusal is already stored', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'false');

        render(<AnalyticsConsent {...props} />);

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.queryByText('Umami')).not.toBeInTheDocument();
    });

    it('hides the banner and loads analytics on a cross-tab accept without advancing timers', () => {
        render(<AnalyticsConsent {...props} />);

        act(() => {
            dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                newValue: 'true',
                storageArea: localStorage
            }));
        });

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.getByText('Umami')).toBeInTheDocument();
    });

    it('hides the banner and loads no analytics on a cross-tab decline without advancing timers', () => {
        render(<AnalyticsConsent {...props} />);

        act(() => {
            dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                newValue: 'false',
                storageArea: localStorage
            }));
        });

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();
        expect(screen.queryByText('Umami')).not.toBeInTheDocument();
    });

    it('re-shows the banner on a cross-tab reset without a reload or timers', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'false');

        render(<AnalyticsConsent {...props} />);

        expect(screen.queryByText(ANALYTICS_CONSENT_MESSAGE)).not.toBeInTheDocument();

        act(() => {
            dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                storageArea: localStorage
            }));
        });

        expect(screen.getByText(ANALYTICS_CONSENT_MESSAGE)).toBeInTheDocument();
        expect(screen.queryByText('Umami')).not.toBeInTheDocument();
    });
});
