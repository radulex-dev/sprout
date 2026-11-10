import 'server-only';
import { sql } from 'drizzle-orm';

// Constants
import { AI_DAILY_CALL_LIMIT_KEY, DEFAULT_DAILY_CALL_LIMIT } from './constants';

// Helpers
import { buildDayBucket } from './helpers';

// Database
import { database } from '@/lib/db';
import { aiUsage } from '@/lib/db/schema';

export const claimAiUsage = async (userId: string): Promise<boolean> => {
    const day = buildDayBucket(Date.now());
    const configured = Number(process.env[AI_DAILY_CALL_LIMIT_KEY] ?? DEFAULT_DAILY_CALL_LIMIT);
    const limit = Number.isSafeInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_CALL_LIMIT;

    const claimed = await database
        .insert(aiUsage)
        .values({
            userId,
            day,
            calls: 1,
            createdAt: Date.now()
        })
        .onConflictDoUpdate({
            target: [aiUsage.userId, aiUsage.day],
            set: {
                calls: sql`${aiUsage.calls} + 1`
            },
            setWhere: sql`${aiUsage.calls} < ${limit}`
        })
        .returning({
            calls: aiUsage.calls
        });

    return claimed.length > 0;
};
