import { and, desc, eq, lt, sql } from 'drizzle-orm';

// Constants
import { VERIFY_THROTTLE_SECONDS } from '@/lib/auth/constants';
import { VERIFY_SENT_IDENTIFIER_PREFIX } from './constants';

// Helpers
import { isMarkerRecent } from './helpers';

// Database
import { database } from '@/lib/db';
import { verification } from '@/lib/db/schema';

// Types
import { type VerificationMarkerRow } from './types';

const buildIdentifier = (email: string): string => {
    return `${VERIFY_SENT_IDENTIFIER_PREFIX}${email.toLowerCase()}`;
};

const readLatestMarker = async (email: string): Promise<VerificationMarkerRow | undefined> => {
    const rows = await database
        .select({
            identifier: verification.identifier,
            createdAt: verification.createdAt
        })
        .from(verification)
        .where(eq(verification.identifier, buildIdentifier(email)))
        .orderBy(desc(verification.createdAt))
        .limit(1);

    return rows.at(0);
};

export const claimVerificationSend = async (email: string): Promise<boolean> => {
    const latest = await readLatestMarker(email);

    if (latest !== undefined && isMarkerRecent(latest.createdAt, Date.now())) {
        return false;
    }

    if (latest !== undefined) {
        await database
            .delete(verification)
            .where(and(
                eq(verification.identifier, buildIdentifier(email)),
                lt(sql`extract(epoch from ${verification.createdAt})`, sql.raw(`extract(epoch from now()) - ${VERIFY_THROTTLE_SECONDS}`))
            ));
    }

    await database
        .insert(verification)
        .values({
            id: crypto.randomUUID(),
            identifier: buildIdentifier(email),
            value: 'sent',
            expiresAt: new Date(Date.now() + VERIFY_THROTTLE_SECONDS * 1000)
        })
        .returning({
            id: verification.id
        });

    return true;
};
