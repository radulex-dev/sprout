import { NextResponse } from 'next/server';

// Constants
import { PUSH_TEST_PAYLOAD } from '@/services/server/push/constants';

// Services
import { sendPushToUser } from '@/services/server/push';

// Database
import { getPushSubscriptionsForUser } from '@/lib/db/queries';

// Auth
import { requireUser } from '@/lib/auth/session';

export const POST = async () => {
    const session = await requireUser();
    const subscriptions = await getPushSubscriptionsForUser(session.user.id);

    if (subscriptions.length === 0) {
        return NextResponse.json({
            error: 'No push subscription is registered for this device.'
        }, {
            status: 409
        });
    }

    const result = await sendPushToUser(session.user.id, PUSH_TEST_PAYLOAD);

    if (result.sent === 0) {
        return NextResponse.json({
            error: 'The push service rejected the message.'
        }, {
            status: 502
        });
    }

    return NextResponse.json(result);
};
