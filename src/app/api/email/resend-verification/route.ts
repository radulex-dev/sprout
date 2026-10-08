import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Services
import { claimVerificationSend } from '@/services/server/auth/verification';
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
            status: HttpStatus.Conflict
        });
    }

    if (!isEmailConfigured()) {
        return NextResponse.json({
            error: 'Email delivery is not configured on this server.'
        }, {
            status: HttpStatus.ServiceUnavailable
        });
    }

    const isWithinThrottle = !await claimVerificationSend(session.user.email);

    if (isWithinThrottle) {
        console.warn('Verification email suppressed by the per-address throttle.');

        return NextResponse.json({
            status: true
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
            status: HttpStatus.BadGateway
        });
    }

    return NextResponse.json({
        status: true
    });
};
