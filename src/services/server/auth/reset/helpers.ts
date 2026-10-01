// Constants
import { RESET_EMAIL_SUBJECT, RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX } from './constants';

// Services
import type { EmailMessage } from '@/services/server/email/types';

// Types
import { type BuildResetEmailProps } from './types';

export const buildResetEmail = ({ to, resetUrl, hasPassword }: BuildResetEmailProps): EmailMessage => {
    const googleNote = hasPassword ? '' : '<p>Your account normally signs in with Google; setting a password also adds password sign-in.</p>';

    return {
        to,
        subject: RESET_EMAIL_SUBJECT,
        html: `<p>We received a request to reset your Sprout password.</p>${googleNote}<p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 24 hours. If you did not request it, ignore this email.</p>`
    };
};

export interface SiblingResetCheckProps {
    rows: ResetTokenRow[];
    currentToken: string;
    now: number;
}

export interface ResetTokenRow {
    identifier: string;
    createdAt: Date;
}

export const hasRecentSiblingReset = ({ rows, currentToken, now }: SiblingResetCheckProps): boolean => {
    return rows.some((row) => {
        return row.identifier !== `${RESET_IDENTIFIER_PREFIX}${currentToken}`
            && now - row.createdAt.getTime() <= RESET_THROTTLE_SECONDS * 1000;
    });
};
