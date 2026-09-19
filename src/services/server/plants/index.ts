import { and, eq } from 'drizzle-orm';

// Services
import type { UpdatePlantInput } from './schema';

// Database
import { database } from '@/lib/db';
import { plants } from '@/lib/db/schema';
import { getPlantPhoto, getPlantsForUser } from '@/lib/db/queries';

// Types
import { CareKind, type Plant, type PlantInput } from '@/types';

export const listPlants = async (userId: string): Promise<Plant[]> => {
    return getPlantsForUser(userId);
};

export const readPlantPhoto = async (userId: string, id: string): Promise<Buffer | undefined> => {
    return getPlantPhoto(userId, id);
};

export const createPlant = async (userId: string, input: PlantInput): Promise<string> => {
    const now = Date.now();
    const photo = input.photo ? Buffer.from(await input.photo.arrayBuffer()) : undefined;
    const [row] = await database
        .insert(plants)
        .values({
            userId,
            nickname: input.nickname,
            species: input.species,
            commonName: input.commonName,
            acquiredAt: input.acquiredAt,
            care: input.care,
            lastCare: {
                [CareKind.Water]: input.lastCare?.[CareKind.Water] ?? now,
                [CareKind.Fertilize]: input.lastCare?.[CareKind.Fertilize] ?? now,
                [CareKind.Repot]: input.lastCare?.[CareKind.Repot] ?? now
            },
            lastNotified: {},
            notes: '',
            photo
        })
        .returning({
            id: plants.id
        });

    return row.id;
};

export const updatePlant = async (userId: string, id: string, input: UpdatePlantInput): Promise<void> => {
    await database
        .update(plants)
        .set({
            nickname: input.nickname,
            care: input.care
        })
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
};

export const markCareDone = async (userId: string, id: string, kind: CareKind, atDate: number = Date.now()): Promise<void> => {
    const rows = await database
        .select({
            lastCare: plants.lastCare
        })
        .from(plants)
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    await database
        .update(plants)
        .set({
            lastCare: {
                ...row.lastCare,
                [kind]: atDate
            }
        })
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
};

export const recordNotified = async (userId: string, id: string, kind: CareKind, at: number): Promise<void> => {
    const rows = await database
        .select({
            lastNotified: plants.lastNotified
        })
        .from(plants)
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    await database
        .update(plants)
        .set({
            lastNotified: {
                ...row.lastNotified,
                [kind]: at
            }
        })
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
};

export const deletePlant = async (userId: string, id: string): Promise<void> => {
    await database
        .delete(plants)
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
};
