import { NextResponse } from 'next/server';
import { groupBy } from 'lodash-es';
import { sendNotification, setVapidDetails, WebPushError } from 'web-push';

// Constants
import { CARE_META, DAY_MS } from '@/helpers/care/constants';
import { PUSH_TTL_SECONDS } from '@/services/server/push/constants';

// Helpers
import { dueTasks } from '@/helpers/care';

// Services
import { listPlants, recordNotified } from '@/services/server/plants';
import { removePushSubscription } from '@/services/server/push';

// Database
import { getAllPushSubscriptions } from '@/lib/db/queries';

export const GET = async (request: Request) => {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');

    if (!secret || authorization !== `Bearer ${secret}`) {
        return new NextResponse('Unauthorized', {
            status: 401
        });
    }

    setVapidDetails(
        process.env.VAPID_SUBJECT ?? '',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
        process.env.VAPID_PRIVATE_KEY ?? ''
    );

    const now = Date.now();
    const subscriptions = await getAllPushSubscriptions();
    const subscriptionsByUser = groupBy(subscriptions, (subscription) => {
        return subscription.userId;
    });
    const users = Object.keys(subscriptionsByUser).length;
    let notifications = 0;
    let removed = 0;

    for (const [userId, userSubscriptions] of Object.entries(subscriptionsByUser)) {
        const plants = await listPlants(userId);
        const pendingTasks = dueTasks(plants, now).filter((task) => {
            const last = task.plant.lastNotified[task.kind] ?? 0;

            return now - last >= DAY_MS;
        });

        for (const task of pendingTasks) {
            const meta = CARE_META[task.kind];
            const name = task.plant.nickname || task.plant.commonName || task.plant.species;
            const payload = {
                title: `Time to ${meta.label.toLowerCase()} ${name}`,
                body: task.daysUntil < 0
                    ? `${name} is ${-task.daysUntil} day${task.daysUntil === -1 ? '' : 's'} overdue for ${meta.label.toLowerCase()}ing.`
                    : `${name} is due for ${meta.label.toLowerCase()}ing today.`,
                tag: `sprout-${task.plant.id}-${task.kind}`,
                url: '/'
            };

            for (const subscription of userSubscriptions) {
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
                    notifications += 1;
                } catch (error) {
                    if (error instanceof WebPushError && error.statusCode === 410) {
                        await removePushSubscription(subscription.endpoint);
                        removed += 1;
                    } else {
                        console.error('Failed to send push notification', error);
                    }
                }
            }

            await recordNotified(userId, task.plant.id, task.kind, now);
        }
    }

    return NextResponse.json({
        users,
        notifications,
        removed
    });
};
