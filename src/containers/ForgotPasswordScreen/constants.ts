export const FORGOT_PASSWORD_TITLE = 'Reset your password';
export const FORGOT_PASSWORD_HINT = 'Enter your email and we will send you a link to reset it.';
export const FORGOT_PASSWORD_CONFIRMATION = 'If an account exists for that address, we have sent a reset link.';
export const FORGOT_PASSWORD_ERROR = 'Something went wrong. Please try again.';
export const FORGOT_PASSWORD_SUBMIT_LABEL = 'Send reset link';
export const FORGOT_PASSWORD_EMAIL_LABEL = 'Email';
export const FORGOT_PASSWORD_COOLDOWN_SECONDS = 60;

export enum ForgotPasswordStatus {
    Idle = 'idle',
    Confirmation = 'confirmation',
    Failure = 'failure'
}
