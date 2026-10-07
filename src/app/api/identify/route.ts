import { NextResponse } from 'next/server';

// Services
import { identifySpecies, PlantNetError } from '@/services/server/plantnet';

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
                status: 403
            });
        }

        throw error;
    }

    const form = await request.formData();

    try {
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
