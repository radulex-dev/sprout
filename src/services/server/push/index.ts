import { and, eq } from 'drizzle-orm';
import { countBy } from 'lodash-es';
import { sendNotification, setVapidDetails, WebPushError } from 'web-push';

// Constants
import { PUSH_TTL_SECONDS } from './constants';

// Database
import { database } from '@/lib/db';
import { getPushSubscriptionsForUser } from '@/lib/db/queries';
import { pushSubscriptions } from '@/lib/db/schema';

// Types
import { PushOutcome, PushStopReason, type PushPayload, type PushSendResult, type PushSubscriptionInput } from './types';
import type { PushSubscriptionRow } from '@/lib/db/types';

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

const pruneSubscription = async (endpoint: string): Promise<PushOutcome> => {
    try {
        await removePushSubscription(endpoint);

        return PushOutcome.Removed;
    } catch (error) {
        console.error('Failed to remove push subscription', error);

        return PushOutcome.Failed;
    }
};

const isGoneError = (error: unknown): error is WebPushError => {
    return error instanceof WebPushError && error.statusCode === 410;
};

const isKeyMismatchError = (error: unknown): error is WebPushError => {
    if (!(error instanceof WebPushError)) {
        return false;
    }

    if (error.statusCode === 403) {
        return true;
    }

    return typeof error.body === 'string' && error.body.includes(PushStopReason.VapidKeyMismatch);
};

const sendToSubscription = async (subscription: PushSubscriptionRow, payload: PushPayload): Promise<PushOutcome> => {
    try {
        await sendNotification({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        }, JSON.stringify(payload), {
            TTL: PUSH_TTL_SECONDS,
            urgency: 'high'
        });

        return PushOutcome.Sent;
    } catch (error) {
        if (isGoneError(error)) {
            return pruneSubscription(subscription.endpoint);
        }

        if (isKeyMismatchError(error)) {
            return PushOutcome.Prunable;
        }

        console.error('Failed to send push notification', error);

        return PushOutcome.Failed;
    }
};

export const sendPushToSubscriptions = async (subscriptions: PushSubscriptionRow[], payload: PushPayload): Promise<PushSendResult> => {
    setVapidDetails(
        process.env.VAPID_SUBJECT ?? '',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
        process.env.VAPID_PRIVATE_KEY ?? ''
    );

    const pushOutcomes = await Promise.all(subscriptions.map((subscription) => {
        return sendToSubscription(subscription, payload);
    }));
    const pushOutcomesCount = countBy(pushOutcomes);
    const sent = pushOutcomesCount[PushOutcome.Sent] ?? 0;
    const goneRemoved = pushOutcomesCount[PushOutcome.Removed] ?? 0;
    const prunableEndpoints = pushOutcomes.flatMap((outcome, index) => {
        return outcome === PushOutcome.Prunable ? [subscriptions[index].endpoint] : [];
    });
    const isKeyRefusedBatch = prunableEndpoints.length > 0 && sent === 0;

    if (isKeyRefusedBatch) {
        console.warn('Kept key-refused push subscriptions because no send succeeded', {
            kept: prunableEndpoints.length
        });
    }

    const removalTargets = isKeyRefusedBatch ? [] : prunableEndpoints;
    const pruned = await Promise.all(removalTargets.map((endpoint) => {
        return pruneSubscription(endpoint);
    }));
    const mismatchRemoved = countBy(pruned)[PushOutcome.Removed] ?? 0;

    return {
        sent,
        removed: goneRemoved + mismatchRemoved
    };
};

export const sendPushToUser = async (userId: string, payload: PushPayload): Promise<PushSendResult> => {
    const subscriptions = await getPushSubscriptionsForUser(userId);

    return sendPushToSubscriptions(subscriptions, payload);
};
