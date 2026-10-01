import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { FORGOT_PASSWORD_LABEL, RESET_SUCCESS_TEXT } from './constants';

// Components
import AuthScreen from './index';

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: vi.fn(),
                refresh: vi.fn()
            };
        }
    };
});

const props: React.ComponentProps<typeof AuthScreen> = {
    mode: 'login',
    clientId: ''
};

describe('AuthScreen', () => {
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
});
