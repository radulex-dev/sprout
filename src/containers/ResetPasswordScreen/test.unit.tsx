import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { RESET_PASSWORD_CONFIRM_LABEL, RESET_PASSWORD_EXPIRED_NOTICE, RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED, RESET_PASSWORD_FRESH_LINK_LABEL, RESET_PASSWORD_GENERIC_ERROR, RESET_PASSWORD_MISMATCH, RESET_PASSWORD_NEW_LABEL, RESET_PASSWORD_SUBMIT_LABEL, RESET_PASSWORD_TOKEN_ERROR, RESET_PASSWORD_TOO_LONG, RESET_PASSWORD_TOO_SHORT } from './constants';

// Components
import ResetPasswordScreen from './index';

const { pushMock, rememberResetEmailMock, resetPasswordMock } = vi.hoisted(() => {
    return {
        pushMock: vi.fn(),
        rememberResetEmailMock: vi.fn<(formData: FormData) => Promise<void>>(),
        resetPasswordMock: vi.fn()
    };
});

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: pushMock
            };
        }
    };
});

vi.mock('@/lib/auth/auth-client', () => {
    return {
        authClient: {
            resetPassword: resetPasswordMock
        }
    };
});

vi.mock('@/lib/db/actions', () => {
    return {
        rememberResetEmail: rememberResetEmailMock
    };
});

const props: React.ComponentProps<typeof ResetPasswordScreen> = {
    token: 'reset-token-abc'
};

describe('ResetPasswordScreen', () => {
    beforeEach(() => {
        rememberResetEmailMock.mockResolvedValue(undefined);
    });

    it('rejects a mismatched confirmation before calling resetPassword', async () => {
        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'new-password-123');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'new-password-124');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByText(RESET_PASSWORD_MISMATCH)).toBeInTheDocument();
        expect(resetPasswordMock).not.toHaveBeenCalled();
    });

    it('routes to the login page with the success flag after a reset', async () => {
        resetPasswordMock.mockResolvedValue({
            data: {
                status: true
            },
            error: undefined
        });

        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'new-password-123');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'new-password-123');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(resetPasswordMock).toHaveBeenCalledWith({
            newPassword: 'new-password-123',
            token: 'reset-token-abc'
        });
        expect(pushMock).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith('/login?reset=success');
    });

    it('shows the token error and a fresh-link path for an invalid token', async () => {
        resetPasswordMock.mockResolvedValue({
            data: undefined,
            error: {
                status: 400,
                code: 'INVALID_TOKEN'
            }
        });

        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'new-password-123');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'new-password-123');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByText(RESET_PASSWORD_TOKEN_ERROR)).toBeInTheDocument();
        expect(screen.getByRole('link', {
            name: RESET_PASSWORD_FRESH_LINK_LABEL
        })).toHaveAttribute('href', '/forgot-password');
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('shows the verified expiry notice, a fresh-link submit, and no address in the URL for an expired link', () => {
        const { container } = render(<ResetPasswordScreen {...props} email="a@b.com" emailVerified tokenExpired />);

        expect(screen.getByText(RESET_PASSWORD_EXPIRED_NOTICE)).toBeInTheDocument();
        expect(screen.queryByText(RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        })).not.toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: RESET_PASSWORD_FRESH_LINK_LABEL
        })).toBeInTheDocument();

        const emailInput = screen.getByDisplayValue('a@b.com');

        expect(emailInput).toHaveAttribute('type', 'hidden');
        expect(emailInput).toHaveAttribute('name', 'email');
        expect(container.innerHTML).not.toContain('?email=');
    });

    it('submits the address to the remember-reset-email action from the expired state', async () => {
        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} email="a@b.com" emailVerified tokenExpired />);

        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_FRESH_LINK_LABEL
        }));

        expect(rememberResetEmailMock).toHaveBeenCalledTimes(1);

        const [formData] = rememberResetEmailMock.mock.calls.at(0) ?? [];

        expect(formData?.get('email')).toBe('a@b.com');
    });

    it('shows the neutral expiry notice when the expired link belongs to an unverified account', () => {
        render(<ResetPasswordScreen {...props} tokenExpired />);

        expect(screen.getByText(RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED)).toBeInTheDocument();
        expect(screen.queryByText(RESET_PASSWORD_EXPIRED_NOTICE)).not.toBeInTheDocument();
    });

    it('renders the form and no expiry notice for a usable link', () => {
        render(<ResetPasswordScreen {...props} />);

        expect(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        })).toBeInTheDocument();
        expect(screen.queryByText(RESET_PASSWORD_EXPIRED_NOTICE)).not.toBeInTheDocument();
        expect(screen.queryByText(RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED)).not.toBeInTheDocument();
    });

    it('rejects a password shorter than eight characters before calling resetPassword', async () => {
        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'short');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'short');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByText(RESET_PASSWORD_TOO_SHORT)).toBeInTheDocument();
        expect(resetPasswordMock).not.toHaveBeenCalled();
    });

    it('maps a server PASSWORD_TOO_LONG error to the inline field error', async () => {
        resetPasswordMock.mockResolvedValue({
            data: undefined,
            error: {
                status: 400,
                code: 'PASSWORD_TOO_LONG'
            }
        });

        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'new-password-123');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'new-password-123');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByText(RESET_PASSWORD_TOO_LONG)).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('shows a generic error for any other failure code', async () => {
        resetPasswordMock.mockResolvedValue({
            data: undefined,
            error: {
                status: 500,
                code: 'UNEXPECTED_ERROR'
            }
        });

        const user = userEvent.setup();

        render(<ResetPasswordScreen {...props} />);

        await user.type(screen.getByLabelText(RESET_PASSWORD_NEW_LABEL), 'new-password-123');
        await user.type(screen.getByLabelText(RESET_PASSWORD_CONFIRM_LABEL), 'new-password-123');
        await user.click(screen.getByRole('button', {
            name: RESET_PASSWORD_SUBMIT_LABEL
        }));

        expect(screen.getByText(RESET_PASSWORD_GENERIC_ERROR)).toBeInTheDocument();
        expect(screen.queryByText(RESET_PASSWORD_TOKEN_ERROR)).not.toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
