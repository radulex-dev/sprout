import { NextResponse } from 'next/server';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Services
import { identifySpecies, PlantNetError, readIdentifyForm } from '@/services/server/plantnet';
import { captureEvent } from '@/services/server/posthog';
import { PostHogEvent } from '@/services/server/posthog/types';

// Auth
import { VERIFY_REQUIRED_MESSAGE } from '@/lib/auth/constants';
import { UnverifiedEmailError } from '@/lib/auth/errors';
import { requireVerifiedUser } from '@/lib/auth/session';

export const POST = async (request: Request) => {
    let userId: string;

    try {
        const session = await requireVerifiedUser();

        userId = session.user.id;
    } catch (error) {
        if (error instanceof UnverifiedEmailError) {
            return NextResponse.json({
                error: VERIFY_REQUIRED_MESSAGE,
                code: 'unverified'
            }, {
                status: HttpStatus.Forbidden
            });
        }

        throw error;
    }

    try {
        const form = await readIdentifyForm(request);
        const result = await identifySpecies(form);

        captureEvent(userId, PostHogEvent.PlantIdentified);

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof PlantNetError) {
            return NextResponse.json({
                error: error.message
            }, {
                status: error.httpStatus
            });
        }

        throw error;
    }
};
