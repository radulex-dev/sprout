import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Services
import { isEmailConfigured } from '@/services/server/email';

// Auth
import { auth } from '@/lib/auth';
import { requireUser } from '@/lib/auth/session';

export const POST = async () => {
    const session = await requireUser();

    if (session.user.emailVerified) {
        return NextResponse.json({
            error: 'This address is already verified.'
        }, {
            status: 409
        });
    }

    if (!isEmailConfigured()) {
        return NextResponse.json({
            error: 'Email delivery is not configured on this server.'
        }, {
            status: 503
        });
    }

    try {
        await auth.api.sendVerificationEmail({
            body: {
                email: session.user.email
            },
            headers: await headers()
        });
    } catch (error) {
        console.error('Verification email could not be sent.', error);

        return NextResponse.json({
            error: 'The verification email could not be sent.'
        }, {
            status: 502
        });
    }

    return NextResponse.json({
        status: true
    });
};
