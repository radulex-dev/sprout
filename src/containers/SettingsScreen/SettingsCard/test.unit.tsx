import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import SettingsCard from './index';

const props: React.ComponentProps<typeof SettingsCard> = {
    user: {
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        emailVerified: false
    },
    verifyCooldown: 0,
    onVerify: vi.fn(),
    onSignOut: vi.fn()
};

describe('<SettingsCard />', () => {
    it('renders the Account heading and the Preferences section', () => {
        render(<SettingsCard {...props} />);

        expect(screen.getByRole('heading', {
            name: 'Account'
        })).toBeInTheDocument();
        expect(screen.getByRole('heading', {
            name: 'Preferences'
        })).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('renders an enabled verify button while the email is unverified', () => {
        render(<SettingsCard {...props} />);

        expect(screen.getByRole('button', {
            name: 'Verify account'
        })).toBeEnabled();
    });

    it('disables the verify button and shows the remaining cooldown', () => {
        render(<SettingsCard {...props} verifyCooldown={42} />);

        expect(screen.getByRole('button', {
            name: 'Try again in 42s'
        })).toBeDisabled();
        expect(screen.queryByText('Email verified')).not.toBeInTheDocument();
    });

    it('renders the verified badge and no verify button once the email is verified', () => {
        const verifiedUser = {
            name: 'Ada Lovelace',
            email: 'ada@example.test',
            emailVerified: true
        };

        render(<SettingsCard {...props} user={verifiedUser} />);

        const badge = screen.getByText('Email verified');

        expect(badge).toBeInTheDocument();
        expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('button', {
            name: 'Verify account'
        })).not.toBeInTheDocument();
    });
});
