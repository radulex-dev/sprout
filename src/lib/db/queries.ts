import { and, desc, eq, sql } from 'drizzle-orm';
import { cache } from 'react';

// Constants
import { PLANT_ID_SCHEMA } from './constants';

// Database
import { database } from '@/lib/db';
import { careReference, plants, pushSubscriptions } from '@/lib/db/schema';

// Types
import type { Plant } from '@/types';
import type { CareReferenceRow, PlantListRow, PushSubscriptionRow } from './types';

const plantColumns = {
    id: plants.id,
    userId: plants.userId,
    nickname: plants.nickname,
    species: plants.species,
    commonName: plants.commonName,
    hasPhoto: sql<boolean>`${plants.photo} is not null`,
    acquiredAt: plants.acquiredAt,
    care: plants.care,
    lastCare: plants.lastCare,
    lastNotified: plants.lastNotified,
    notes: plants.notes
};

const rowToPlant = (row: PlantListRow): Plant => {
    return {
        id: row.id,
        nickname: row.nickname,
        species: row.species,
        commonName: row.commonName,
        photo: row.hasPhoto ? `/plants/${row.id}/photo` : undefined,
        acquiredAt: row.acquiredAt,
        care: row.care,
        lastCare: row.lastCare,
        lastNotified: row.lastNotified,
        notes: row.notes
    };
};

export const getPlantsForUser = cache(async (userId: string): Promise<Plant[]> => {
    const rows = await database
        .select(plantColumns)
        .from(plants)
        .where(eq(plants.userId, userId))
        .orderBy(desc(plants.acquiredAt));

    return rows.map((row) => {
        return rowToPlant(row);
    });
});

export const getPlantForUser = cache(async (userId: string, id: string): Promise<Plant | undefined> => {
    if (!PLANT_ID_SCHEMA.safeParse(id).success) {
        return undefined;
    }

    const rows = await database
        .select(plantColumns)
        .from(plants)
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
    const row = rows.at(0);

    return row ? rowToPlant(row) : undefined;
});

export const getPlantPhoto = async (userId: string, id: string): Promise<Buffer | undefined> => {
    if (!PLANT_ID_SCHEMA.safeParse(id).success) {
        return undefined;
    }

    const rows = await database
        .select({
            photo: plants.photo
        })
        .from(plants)
        .where(and(eq(plants.id, id), eq(plants.userId, userId)));
    const row = rows.at(0);

    return row?.photo ?? undefined;
};

export const getCareReferenceRows = async (): Promise<CareReferenceRow[]> => {
    return database.select().from(careReference);
};

export const getAllPushSubscriptions = async (): Promise<PushSubscriptionRow[]> => {
    return database.select().from(pushSubscriptions);
};

export const getPushSubscriptionsForUser = async (userId: string): Promise<PushSubscriptionRow[]> => {
    return database.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
};
