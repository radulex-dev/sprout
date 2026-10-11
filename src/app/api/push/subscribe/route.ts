import { NextResponse } from 'next/server';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Services
import { setSubscriptionActive, subscribe, unsubscribe } from '@/services/server/push';
import { PushPreferenceSchema, PushSubscriptionInputSchema } from '@/services/server/push/schema';

// Auth
import { requireUser } from '@/lib/auth/session';

interface EndpointBody {
    endpoint?: unknown;
}

export const POST = async (request: Request) => {
    const session = await requireUser();
    const body = await request.json() as unknown;
    const parsed = PushSubscriptionInputSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({
            error: 'Invalid push subscription.'
        }, {
            status: HttpStatus.BadRequest
        });
    }

    await subscribe(session.user.id, parsed.data);

    return NextResponse.json({
        ok: true
    });
};

export const PATCH = async (request: Request) => {
    const session = await requireUser();
    const body = await request.json() as unknown;
    const parsed = PushPreferenceSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({
            error: 'Invalid push preference.'
        }, {
            status: HttpStatus.BadRequest
        });
    }

    await setSubscriptionActive(session.user.id, parsed.data.endpoint, parsed.data.active);

    return NextResponse.json({
        ok: true
    });
};

export const DELETE = async (request: Request) => {
    const session = await requireUser();
    const body = await request.json() as EndpointBody;
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : undefined;

    if (!endpoint) {
        return NextResponse.json({
            error: 'Invalid endpoint.'
        }, {
            status: HttpStatus.BadRequest
        });
    }

    await unsubscribe(session.user.id, endpoint);

    return NextResponse.json({
        ok: true
    });
};
