import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import RemindersCard from './index';

const props: React.ComponentProps<typeof RemindersCard> = {
    isSupported: true,
    perm: 'granted',
    isStandalone: false,
    testCooldown: 0,
    onEnable: vi.fn(),
    onInstall: vi.fn(),
    onTest: vi.fn(),
    testStatus: ''
};

describe('RemindersCard', () => {
    it('calls onInstall from the unsupported-browser install CTA', async () => {
        const handleInstall = vi.fn();
        const user = userEvent.setup();

        render(<RemindersCard {...props} isSupported={false} perm="default" onInstall={handleInstall} />);

        await user.click(screen.getByRole('button', {
            name: 'Install the app to enable reminders'
        }));

        expect(handleInstall).toHaveBeenCalledTimes(1);
    });

    it('shows notification controls and no install button when notifications are supported', () => {
        render(<RemindersCard {...props} perm="default" />);

        expect(screen.getByRole('button', {
            name: 'Enable notifications'
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Install the app'
        })).not.toBeInTheDocument();
    });

    it('hides the install CTA once the app is installed', () => {
        render(<RemindersCard {...props} isSupported={false} perm="denied" isStandalone />);

        expect(screen.queryByRole('button', {
            name: 'Install the app to enable reminders'
        })).not.toBeInTheDocument();
    });

    it('shows the test push status', () => {
        render(<RemindersCard {...props} testStatus="Test push sent to 1 device." />);

        expect(screen.getByRole('status')).toHaveTextContent('Test push sent to 1 device.');
    });

    it('disables the test button and shows the remaining cooldown', () => {
        render(<RemindersCard {...props} testCooldown={12} />);

        expect(screen.getByRole('button', {
            name: 'Try again in 12s'
        })).toBeDisabled();
    });

    it('enables the test button once the cooldown has elapsed', () => {
        render(<RemindersCard {...props} />);

        expect(screen.getByRole('button', {
            name: 'Send a test notification'
        })).toBeEnabled();
    });
});
