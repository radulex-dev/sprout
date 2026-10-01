import { and, eq, like } from 'drizzle-orm';

// Constants
import { RESET_PASSWORD_PATH } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX } from './constants';

// Helpers
import { buildResetEmail, hasRecentSiblingReset } from './helpers';

// Services
import { sendEmail } from '@/services/server/email';

// Database
import { database } from '@/lib/db';
import { account, verification } from '@/lib/db/schema';

// Types
import { type SendPasswordResetEmailProps } from './types';

export const isResetThrottled = async (userId: string, currentToken: string): Promise<boolean> => {
    const rows = await database
        .select({
            identifier: verification.identifier,
            createdAt: verification.createdAt
        })
        .from(verification)
        .where(and(eq(verification.value, userId), like(verification.identifier, `${RESET_IDENTIFIER_PREFIX}%`)));

    return hasRecentSiblingReset({
        rows,
        currentToken,
        now: Date.now()
    });
};

export const hasCredentialPassword = async (userId: string): Promise<boolean> => {
    const rows = await database
        .select({
            id: account.id
        })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')));

    return rows.length > 0;
};

export const sendPasswordResetEmail = async ({ user, url, token }: SendPasswordResetEmailProps): Promise<void> => {
    if (!user.emailVerified) {
        return;
    }

    if (await isResetThrottled(user.id, token)) {
        console.warn('Password reset email suppressed by the 60-second throttle.');

        return;
    }

    const hasPassword = await hasCredentialPassword(user.id);
    const resetUrl = `${new URL(url).origin}${RESET_PASSWORD_PATH}/${token}`;

    await sendEmail(buildResetEmail({
        to: user.email,
        resetUrl,
        hasPassword
    }));
};
