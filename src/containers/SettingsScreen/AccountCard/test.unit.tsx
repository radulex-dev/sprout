import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import AccountCard from './index';

const props: React.ComponentProps<typeof AccountCard> = {
    user: {
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        emailVerified: false
    },
    verifyCooldown: 0,
    verifyStatus: '',
    onVerify: vi.fn(),
    onSignOut: vi.fn()
};

describe('AccountCard', () => {
    it('renders an enabled verify button while the email is unverified', () => {
        render(<AccountCard {...props} />);

        expect(screen.getByRole('button', {
            name: 'Verify account'
        })).toBeEnabled();
    });

    it('disables the verify button and shows the remaining cooldown', () => {
        render(<AccountCard {...props} verifyCooldown={42} />);

        expect(screen.getByRole('button', {
            name: 'Try again in 42s'
        })).toBeDisabled();
        expect(screen.queryByText('Email verified')).not.toBeInTheDocument();
    });

    it('shows the verification status in a live region while the email is unverified', () => {
        render(<AccountCard {...props} verifyStatus="Verification email requested. Check your inbox." />);

        expect(screen.getByRole('status')).toHaveTextContent('Verification email requested. Check your inbox.');
    });

    it('renders the verified badge and no verify button once the email is verified', () => {
        const verifiedUser = {
            name: 'Ada Lovelace',
            email: 'ada@example.test',
            emailVerified: true
        };

        render(<AccountCard {...props} user={verifiedUser} />);

        const badge = screen.getByText('Email verified');

        expect(badge).toBeInTheDocument();
        expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('button', {
            name: 'Verify account'
        })).not.toBeInTheDocument();
    });
});
