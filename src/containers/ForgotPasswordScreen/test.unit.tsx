import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { FORGOT_PASSWORD_CONFIRMATION, FORGOT_PASSWORD_EMAIL_LABEL, FORGOT_PASSWORD_ERROR, FORGOT_PASSWORD_SUBMIT_LABEL } from './constants';

// Components
import ForgotPasswordScreen from './index';

const { requestPasswordResetMock } = vi.hoisted(() => {
    return {
        requestPasswordResetMock: vi.fn()
    };
});

vi.mock('@/lib/auth/auth-client', () => {
    return {
        authClient: {
            requestPasswordReset: requestPasswordResetMock
        }
    };
});

const props: React.ComponentProps<typeof ForgotPasswordScreen> = {};

describe('ForgotPasswordScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requestPasswordResetMock.mockResolvedValue({
            data: {
                status: true
            },
            error: undefined
        });
    });

    it('pre-fills the address from the initialEmail prop', () => {
        render(<ForgotPasswordScreen {...props} initialEmail="a@b.com" />);

        expect(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL)).toHaveValue('a@b.com');
    });

    it('starts with an empty address when no initialEmail is provided', () => {
        render(<ForgotPasswordScreen {...props} />);

        expect(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL)).toHaveValue('');
    });

    it('requests a reset link once for the entered address', async () => {
        const user = userEvent.setup();

        render(<ForgotPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL), 'ada@example.test');
        await user.click(screen.getByRole('button', {
            name: FORGOT_PASSWORD_SUBMIT_LABEL
        }));

        expect(requestPasswordResetMock).toHaveBeenCalledTimes(1);
        expect(requestPasswordResetMock).toHaveBeenCalledWith({
            email: 'ada@example.test'
        });
    });

    it('shows the anti-enumeration confirmation when the request resolves', async () => {
        const user = userEvent.setup();

        render(<ForgotPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL), 'ada@example.test');
        await user.click(screen.getByRole('button', {
            name: FORGOT_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByRole('status')).toHaveTextContent(FORGOT_PASSWORD_CONFIRMATION);
    });

    it('shows the confirmation when the request resolves with an error instead of rejecting', async () => {
        requestPasswordResetMock.mockResolvedValue({
            data: undefined,
            error: {
                status: 400,
                code: 'RESET_PASSWORD_DISABLED'
            }
        });

        const user = userEvent.setup();

        render(<ForgotPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL), 'ada@example.test');
        await user.click(screen.getByRole('button', {
            name: FORGOT_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByRole('status')).toHaveTextContent(FORGOT_PASSWORD_CONFIRMATION);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows the error copy when the request rejects', async () => {
        requestPasswordResetMock.mockRejectedValue(new Error('Failed to fetch'));

        const user = userEvent.setup();

        render(<ForgotPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL), 'ada@example.test');
        await user.click(screen.getByRole('button', {
            name: FORGOT_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByRole('alert')).toHaveTextContent(FORGOT_PASSWORD_ERROR);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('disables the submit control while the 60 second cooldown runs', async () => {
        const user = userEvent.setup();

        render(<ForgotPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(FORGOT_PASSWORD_EMAIL_LABEL), 'ada@example.test');
        await user.click(screen.getByRole('button', {
            name: FORGOT_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByRole('button', {
            name: 'Try again in 60s'
        })).toBeDisabled();
        expect(requestPasswordResetMock).toHaveBeenCalledTimes(1);
    });
});
