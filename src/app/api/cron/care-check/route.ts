import { NextResponse } from 'next/server';
import { groupBy } from 'lodash-es';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Helpers
import { buildCareNotification, dueTasks, isNotificationHour, isNotifiedToday } from '@/helpers/care';

// Services
import { listPlants, recordNotified } from '@/services/server/plants';
import { sendPushToSubscriptions } from '@/services/server/push';

// Database
import { getAllActivePushSubscriptions } from '@/lib/db/queries';

export const GET = async (request: Request) => {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');

    if (!secret || authorization !== `Bearer ${secret}`) {
        return new NextResponse('Unauthorized', {
            status: HttpStatus.Unauthorized
        });
    }

    const now = Date.now();
    const isForced = new URL(request.url).searchParams.get('force') === '1';

    if (!isForced && !isNotificationHour(now)) {
        return NextResponse.json({
            skipped: true
        });
    }

    const subscriptions = await getAllActivePushSubscriptions();
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

        if (pendingTasks.length === 0) {
            continue;
        }

        const payload = {
            ...buildCareNotification(pendingTasks),
            url: '/'
        };
        const result = await sendPushToSubscriptions(userSubscriptions, payload);

        notifications += result.sent;
        removed += result.removed;

        if (result.sent > 0) {
            await Promise.all(pendingTasks.map((task) => {
                return recordNotified(userId, task.plant.id, task.kind, now);
            }));
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
