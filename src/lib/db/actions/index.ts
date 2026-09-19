'use server';

import { revalidatePath } from 'next/cache';

// Constants
import { ALL_PATH, PLANT_ID_SCHEMA } from '@/lib/db/constants';

// Services
import { createPlant as serviceCreatePlant, deletePlant as serviceDeletePlant, markCareDone as serviceMarkCareDone, recordNotified as serviceRecordNotified, updatePlant as serviceUpdatePlant } from '@/services/server/plants';
import { CareKindSchema, LastCareDateSchema, NotifiedAtSchema, parsePlantInput, UpdatePlantSchema, type UpdatePlantInput } from '@/services/server/plants/schema';

// Auth
import { requireUser } from '@/lib/auth/session';

// Types
import type { CareKind, PlantInput } from '@/types';

export const createPlant = async (input: PlantInput): Promise<string> => {
    const session = await requireUser();
    const parsed = parsePlantInput(input);
    const id = await serviceCreatePlant(session.user.id, parsed);

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
