import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import RemindersCard from './index';

describe('RemindersCard', () => {
    it('calls onInstall from the unsupported-browser install CTA', async () => {
        const handleInstall = vi.fn();
        const user = userEvent.setup();

        render(<RemindersCard isSupported={false} perm="default" isStandalone={false} onEnable={vi.fn()} onInstall={handleInstall} onTest={vi.fn()} testStatus="" />);

        await user.click(screen.getByRole('button', {
            name: 'Install the app to enable reminders'
        }));

        expect(handleInstall).toHaveBeenCalledTimes(1);
    });

    it('shows notification controls and no install button when notifications are supported', () => {
        render(<RemindersCard isSupported perm="default" isStandalone={false} onEnable={vi.fn()} onInstall={vi.fn()} onTest={vi.fn()} testStatus="" />);

        expect(screen.getByRole('button', {
            name: 'Enable notifications'
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Install the app'
        })).not.toBeInTheDocument();
    });

    it('hides the install CTA once the app is installed', () => {
        render(<RemindersCard isSupported={false} perm="denied" isStandalone onEnable={vi.fn()} onInstall={vi.fn()} onTest={vi.fn()} testStatus="" />);

        expect(screen.queryByRole('button', {
            name: 'Install the app to enable reminders'
        })).not.toBeInTheDocument();
    });

    it('shows the test notification status', () => {
        render(<RemindersCard isSupported perm="granted" isStandalone={false} onEnable={vi.fn()} onInstall={vi.fn()} onTest={vi.fn()} testStatus="Service worker is not running." />);

        expect(screen.getByRole('status')).toHaveTextContent('Service worker is not running.');
    });
});
