import { and, desc, eq, gt, like, ne, sql } from 'drizzle-orm';

// Constants
import { RESET_PASSWORD_PATH, RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX } from './constants';

// Helpers
import { buildResetEmail, isCurrentTokenNewest, isRecentSibling } from './helpers';

// Services
import { sendEmail } from '@/services/server/email';

// Database
import { database } from '@/lib/db';
import { account, verification } from '@/lib/db/schema';

// Types
import { type ResetTokenRow, type SendPasswordResetEmailProps } from './types';

const readResetRows = async (userId: string): Promise<ResetTokenRow[]> => {
    return await database
        .select({
            identifier: verification.identifier,
            createdAt: verification.createdAt
        })
        .from(verification)
        .where(and(eq(verification.value, userId), like(verification.identifier, `${RESET_IDENTIFIER_PREFIX}%`)))
        .orderBy(desc(verification.createdAt));
};

const claimResetSend = async (userId: string, currentToken: string): Promise<boolean> => {
    const rows = await readResetRows(userId);

    if (!isCurrentTokenNewest(rows, currentToken)) {
        return false;
    }

    const hasRecentSibling = rows.some((row) => {
        return isRecentSibling(row, currentToken, Date.now());
    });

    if (hasRecentSibling) {
        return false;
    }

    await database
        .delete(verification)
        .where(and(
            eq(verification.value, userId),
            like(verification.identifier, `${RESET_IDENTIFIER_PREFIX}%`),
            ne(verification.identifier, `${RESET_IDENTIFIER_PREFIX}${currentToken}`),
            gt(sql`extract(epoch from ${verification.createdAt})`, sql.raw(`extract(epoch from now()) - ${RESET_THROTTLE_SECONDS}`))
        ));

    return true;
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

export const sendPasswordResetEmail = async (props: SendPasswordResetEmailProps): Promise<void> => {
    const { user, url, token } = props;

    if (!await claimResetSend(user.id, token)) {
        console.warn('Password reset email suppressed by the 60-second throttle.');

        return;
    }

    const hasPassword = await hasCredentialPassword(user.id);
    const resetUrl = `${new URL(url).origin}${RESET_PASSWORD_PATH}/${token}`;

    await sendEmail(buildResetEmail(user.email, resetUrl, hasPassword));
};
