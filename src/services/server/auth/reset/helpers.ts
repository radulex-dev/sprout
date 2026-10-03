// Constants
import { RESET_EMAIL_SUBJECT, RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX } from './constants';

// Services
import type { EmailMessage } from '@/services/server/email/types';

// Types
import { type ResetTokenRow } from './types';

export const buildResetEmail = (to: string, resetUrl: string, hasPassword: boolean): EmailMessage => {
    const googleNote = hasPassword ? '' : '<p>Your account normally signs in with Google; setting a password also adds password sign-in.</p>';

    return {
        to,
        subject: RESET_EMAIL_SUBJECT,
        html: `<p>We received a request to reset your Sprout password.</p>${googleNote}<p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 24 hours. If you did not request it, ignore this email.</p>`
    };
};

export const isCurrentTokenNewest = (rows: ResetTokenRow[], currentToken: string): boolean => {
    if (rows.length === 0) {
        return false;
    }

    return rows.at(0)?.identifier === `${RESET_IDENTIFIER_PREFIX}${currentToken}`;
};

export const isRecentSibling = (row: ResetTokenRow, currentToken: string, now: number): boolean => {
    return row.identifier !== `${RESET_IDENTIFIER_PREFIX}${currentToken}`
        && now - row.createdAt.getTime() <= RESET_THROTTLE_SECONDS * 1000;
};
