'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Constants
import { ALL_PATH, LOAD_CARE_INTERVALS_SCHEMA, LOAD_WATER_AMOUNT_SCHEMA, PLANT_ID_SCHEMA } from '@/lib/db/constants';
import { RESET_PREFILL_COOKIE } from '@/lib/auth/constants';

// Services
import { AiCapReachedError, AiRequestError, AiUnavailableError } from '@/services/server/ai';
import { getCareIntervals, getWaterAmount } from '@/services/server/care-profile';
import { toCareSchedule } from '@/services/server/care-profile/helpers';
import { createPlant as serviceCreatePlant, deletePlant as serviceDeletePlant, markCareDone as serviceMarkCareDone, recordNotified as serviceRecordNotified, updatePlant as serviceUpdatePlant } from '@/services/server/plants';
import { CareKindSchema, LastCareDateSchema, NotifiedAtSchema, parsePlantInput, UpdatePlantSchema, type UpdatePlantInput } from '@/services/server/plants/schema';
import { captureEvent } from '@/services/server/posthog';
import { PostHogEvent } from '@/services/server/posthog/types';

// Auth
import { requireUser, requireVerifiedUser } from '@/lib/auth/session';

// Types
import { CareProfileStatus, type LoadCareIntervalsRequest, type LoadCareIntervalsResult, type LoadWaterAmountRequest, type LoadWaterAmountResult } from '@/lib/db/actions/types';
import type { CareKind, PlantInput } from '@/types';

export const createPlant = async (input: PlantInput): Promise<string> => {
    const session = await requireVerifiedUser();
    const parsed = parsePlantInput(input);
    const id = await serviceCreatePlant(session.user.id, parsed);

    captureEvent(session.user.id, PostHogEvent.PlantCreated);

    revalidatePath(ALL_PATH, 'layout');

    return id;
};

export const updatePlant = async (id: string, input: UpdatePlantInput): Promise<void> => {
    const session = await requireUser();
    const parsedId = PLANT_ID_SCHEMA.parse(id);

    const parsedInput = UpdatePlantSchema.parse(input);

    await serviceUpdatePlant(session.user.id, parsedId, parsedInput);

    revalidatePath(ALL_PATH, 'layout');
};

export const markCareDone = async (id: string, kind: CareKind, atDate?: number): Promise<void> => {
    const session = await requireUser();
    const parsedId = PLANT_ID_SCHEMA.parse(id);
    const parsedKind = CareKindSchema.parse(kind);
    const parsedAtDate = atDate === undefined ? undefined : LastCareDateSchema.parse(atDate);

    if (parsedAtDate === undefined) {
        await serviceMarkCareDone(session.user.id, parsedId, parsedKind);
    } else {
        await serviceMarkCareDone(session.user.id, parsedId, parsedKind, parsedAtDate);
    }

    revalidatePath(ALL_PATH, 'layout');
};

export const recordNotified = async (id: string, kind: CareKind, at: number): Promise<void> => {
    const session = await requireUser();
    const parsedId = PLANT_ID_SCHEMA.parse(id);
    const parsedKind = CareKindSchema.parse(kind);
    const parsedAt = NotifiedAtSchema.parse(at);

    await serviceRecordNotified(session.user.id, parsedId, parsedKind, parsedAt);
};

export const deletePlant = async (id: string): Promise<void> => {
    const session = await requireUser();
    const parsedId = PLANT_ID_SCHEMA.parse(id);

    await serviceDeletePlant(session.user.id, parsedId);

    revalidatePath(ALL_PATH, 'layout');
};

export const loadCareIntervals = async (input: LoadCareIntervalsRequest): Promise<LoadCareIntervalsResult> => {
    const session = await requireVerifiedUser();
    const parsed = LOAD_CARE_INTERVALS_SCHEMA.parse(input);

    try {
        const intervals = await getCareIntervals({
            userId: session.user.id,
            species: parsed.species
        });

        return {
            status: CareProfileStatus.Ok,
            care: toCareSchedule(intervals, 0)
        };
    } catch (reason) {
        if (reason instanceof AiCapReachedError) {
            return {
                status: CareProfileStatus.Capped
            };
        }

        if (reason instanceof AiUnavailableError) {
            return {
                status: CareProfileStatus.Unavailable
            };
        }

        if (reason instanceof AiRequestError) {
            console.warn('Care intervals request failed', reason.status);

            return {
                status: CareProfileStatus.Unavailable
            };
        }

        throw reason;
    }
};

export const loadWaterAmount = async (input: LoadWaterAmountRequest): Promise<LoadWaterAmountResult> => {
    const session = await requireVerifiedUser();
    const parsed = LOAD_WATER_AMOUNT_SCHEMA.parse(input);

    try {
        const waterAmountMl = await getWaterAmount({
            userId: session.user.id,
            species: parsed.species,
            soilVolumeMl: parsed.soilVolumeMl
        });

        return {
            status: CareProfileStatus.Ok,
            waterAmountMl
        };
    } catch (reason) {
        if (reason instanceof AiCapReachedError) {
            return {
                status: CareProfileStatus.Capped
            };
        }

        if (reason instanceof AiUnavailableError) {
            return {
                status: CareProfileStatus.Unavailable
            };
        }

        if (reason instanceof AiRequestError) {
            console.warn('Water amount request failed', reason.status);

            return {
                status: CareProfileStatus.Unavailable
            };
        }

        throw reason;
    }
};

export const rememberResetEmail = async (formData: FormData): Promise<void> => {
    const email = formData.get('email');

    if (typeof email === 'string' && email !== '') {
        const store = await cookies();

        store.set(RESET_PREFILL_COOKIE, encodeURIComponent(email), {
            httpOnly: true,
            sameSite: 'lax',
            path: '/forgot-password',
            maxAge: 120
        });
    }

    redirect('/forgot-password');
};
