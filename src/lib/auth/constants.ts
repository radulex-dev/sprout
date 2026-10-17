// Helpers
import { PASSWORD_MIN_LENGTH } from '@/helpers/password/constants';

export const VERIFY_REQUIRED_MESSAGE = 'Verify your email address to use plant identification';

export const VERIFY_EMAIL_SUBJECT = 'Confirm your email address';

export const VERIFY_EMAIL_TOKEN_TTL_SECONDS = 86_400;

export const VERIFY_THROTTLE_SECONDS = 60;

export const SEND_VERIFICATION_PATH = '/send-verification-email';

export const RESET_EMAIL_SUBJECT = 'Reset your Sprout password';

export const RESET_TOKEN_TTL_SECONDS = 86_400;

export const RESET_THROTTLE_SECONDS = 60;

export const RESET_PASSWORD_PATH = '/reset-password';

export const RESET_PREFILL_COOKIE = 'sprout_reset_prefill';

export const SIGN_UP_EMAIL_PATH = '/sign-up/email';

export const CHANGE_PASSWORD_PATH = '/change-password';

export const PASSWORD_POLICY_CODE = 'PASSWORD_POLICY';

export const PASSWORD_POLICY_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include a letter, a number and a special character.`;

export const PASSWORD_POLICY_PATHS = new Set([SIGN_UP_EMAIL_PATH, RESET_PASSWORD_PATH, CHANGE_PASSWORD_PATH]);
