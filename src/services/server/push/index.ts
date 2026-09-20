import { and, eq } from 'drizzle-orm';

// Database
import { database } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

export interface PushSubscriptionInput {
    endpoint: string;
    keys: { p256dh: string; auth: string; };
}

export const subscribe = async (userId: string, input: PushSubscriptionInput): Promise<void> => {
    const now = Date.now();

    await database
        .insert(pushSubscriptions)
        .values({
            userId,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            createdAt: now
        })
        .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: {
                userId,
                p256dh: input.keys.p256dh,
                auth: input.keys.auth,
                createdAt: now
            }
        });
};

export const unsubscribe = async (userId: string, endpoint: string): Promise<void> => {
    await database
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
};

export const removePushSubscription = async (endpoint: string): Promise<void> => {
    await database.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
};
