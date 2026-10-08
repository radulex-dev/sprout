import { NextResponse } from 'next/server';

// Constants
import { HttpStatus } from '@/lib/http/constants';

// Services
import { identifySpecies, PlantNetError, readIdentifyForm } from '@/services/server/plantnet';

// Auth
import { VERIFY_REQUIRED_MESSAGE } from '@/lib/auth/constants';
import { UnverifiedEmailError } from '@/lib/auth/errors';
import { requireVerifiedUser } from '@/lib/auth/session';

export const POST = async (request: Request) => {
    try {
        await requireVerifiedUser();
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

        return NextResponse.json(await identifySpecies(form));
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
