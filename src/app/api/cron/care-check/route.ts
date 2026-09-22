import { NextResponse } from 'next/server';
import { groupBy } from 'lodash-es';

// Constants
import { CARE_META } from '@/helpers/care/constants';

// Helpers
import { dueTasks, isNotifiedToday } from '@/helpers/care';

// Services
import { listPlants, recordNotified } from '@/services/server/plants';
import { sendPushToSubscriptions } from '@/services/server/push';

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
            return !isNotifiedToday(task.plant, task.kind, now);
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
            const result = await sendPushToSubscriptions(userSubscriptions, payload);

            notifications += result.sent;
            removed += result.removed;

            if (result.sent > 0) {
                await recordNotified(userId, task.plant.id, task.kind, now);
            }
        }
    }

    if (users === 0) {
        console.warn('Care check found no push subscriptions');
    }

    if (removed > 0) {
        console.warn('Care check removed expired push subscriptions', {
            removed
        });
    }

    return NextResponse.json({
        users,
        notifications,
        removed
    });
};
