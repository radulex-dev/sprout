import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { RESET_PASSWORD_CONFIRM_LABEL, RESET_PASSWORD_FRESH_LINK_LABEL, RESET_PASSWORD_GENERIC_ERROR, RESET_PASSWORD_MISMATCH, RESET_PASSWORD_NEW_LABEL, RESET_PASSWORD_SUBMIT_LABEL, RESET_PASSWORD_TOKEN_ERROR, RESET_PASSWORD_TOO_LONG, RESET_PASSWORD_TOO_SHORT } from './constants';

// Components
import ResetPasswordScreen from './index';

const { pushMock, resetPasswordMock } = vi.hoisted(() => {
    return {
        pushMock: vi.fn(),
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

const props: React.ComponentProps<typeof ResetPasswordScreen> = {
    token: 'reset-token-abc'
};

describe('ResetPasswordScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
