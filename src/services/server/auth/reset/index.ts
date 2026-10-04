import { and, desc, eq, gt, like, ne, sql } from 'drizzle-orm';

// Constants
import { RESET_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { RESET_IDENTIFIER_PREFIX, ResetDispatch, ResetTokenState } from './constants';

// Helpers
import { buildResetEmail, buildResetUrl, isCurrentTokenNewest, isRecentSibling } from './helpers';

// Services
import { claimVerificationSend } from '@/services/server/auth/verification';
import { sendEmail } from '@/services/server/email';

// Database
import { database } from '@/lib/db';
import { account, user, verification } from '@/lib/db/schema';

// Types
import { type DispatchResetRequestProps, type ResetTokenRow, type ResetTokenStatus, type SendPasswordResetEmailProps } from './types';

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

export const getResetTokenStatus = async (token: string): Promise<ResetTokenStatus> => {
    try {
        const rows = await database
            .select({
                value: verification.value,
                expiresAt: verification.expiresAt
            })
            .from(verification)
            .where(eq(verification.identifier, `${RESET_IDENTIFIER_PREFIX}${token}`))
            .limit(1);

        const row = rows.at(0);

        if (row === undefined) {
            return {
                state: ResetTokenState.Invalid
            };
        }

        if (row.expiresAt.getTime() >= Date.now()) {
            return {
                state: ResetTokenState.Valid
            };
        }

        const owners = await database
            .select({
                email: user.email,
                emailVerified: user.emailVerified
            })
            .from(user)
            .where(eq(user.id, row.value))
            .limit(1);

        return {
            state: ResetTokenState.Expired,
            email: owners.at(0)?.email,
            emailVerified: owners.at(0)?.emailVerified ?? false
        };
    } catch (error) {
        console.error('Could not read reset token status.', error);

        return {
            state: ResetTokenState.Valid
        };
    }
};

export const dispatchResetRequest = async (props: DispatchResetRequestProps): Promise<ResetDispatch> => {
    const { user: requestedUser, url, token, sendReset, sendVerification } = props;

    if (!requestedUser.emailVerified) {
        if (!await claimVerificationSend(requestedUser.email)) {
            console.warn('Reset verification email suppressed by the 60-second throttle.');

            return ResetDispatch.Suppressed;
        }

        await sendVerification({
            email: requestedUser.email,
            callbackURL: buildResetUrl(url, token)
        });

        return ResetDispatch.Verification;
    }

    await sendReset({
        user: {
            id: requestedUser.id,
            email: requestedUser.email
        },
        url,
        token
    });

    return ResetDispatch.Reset;
};

export const sendPasswordResetEmail = async (props: SendPasswordResetEmailProps): Promise<void> => {
    const { user: resetUser, url, token } = props;

    if (!await claimResetSend(resetUser.id, token)) {
        console.warn('Password reset email suppressed by the 60-second throttle.');

        return;
    }

    const hasPassword = await hasCredentialPassword(resetUser.id);
    const resetUrl = buildResetUrl(url, token);

    await sendEmail(buildResetEmail(resetUser.email, resetUrl, hasPassword));
};
