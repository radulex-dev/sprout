export const RESET_PASSWORD_TITLE = 'Choose a new password';
export const RESET_PASSWORD_NEW_LABEL = 'New password';
export const RESET_PASSWORD_CONFIRM_LABEL = 'Confirm new password';
export const RESET_PASSWORD_SUBMIT_LABEL = 'Set new password';
export const RESET_PASSWORD_MISMATCH = 'Those passwords do not match.';
export const RESET_PASSWORD_TOO_SHORT = 'Use at least 8 characters.';
export const RESET_PASSWORD_TOO_LONG = 'Use at most 128 characters.';
export const RESET_PASSWORD_TOKEN_ERROR = 'This reset link is invalid or has expired.';
export const RESET_PASSWORD_GENERIC_ERROR = 'Something went wrong. Please try again.';
export const RESET_PASSWORD_FRESH_LINK_LABEL = 'Request a fresh link';
export const RESET_PASSWORD_EXPIRED_NOTICE = 'Your email is verified. Request a fresh reset link to set a new password.';
export const RESET_PASSWORD_EXPIRED_NOTICE_UNVERIFIED = 'This reset link has expired. Request a fresh link to set a new password.';
export const RESET_PASSWORD_MIN_LENGTH = 8;
export const RESET_PASSWORD_MAX_LENGTH = 128;

export enum ResetPasswordStatus {
    Idle = 'idle',
    TokenError = 'token-error',
    GenericError = 'generic-error'
}

export enum ResetPasswordActionType {
    ChangeNew = 'change-new',
    ChangeConfirm = 'change-confirm',
    Validate = 'validate',
    BeginSubmit = 'begin-submit',
    FieldError = 'field-error',
    TokenError = 'token-error',
    GenericError = 'generic-error'
}

export enum ResetPasswordErrorCode {
    InvalidToken = 'INVALID_TOKEN',
    PasswordTooShort = 'PASSWORD_TOO_SHORT',
    PasswordTooLong = 'PASSWORD_TOO_LONG'
}
