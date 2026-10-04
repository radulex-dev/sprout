export const RESET_IDENTIFIER_PREFIX = 'reset-password:';

export enum ResetTokenState {
    Valid = 'valid',
    Expired = 'expired',
    Invalid = 'invalid'
}

export enum ResetDispatch {
    Reset = 'reset',
    Verification = 'verification',
    Suppressed = 'suppressed'
}
