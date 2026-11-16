import * as z from 'zod';

// Constants
import { MAX_SOIL_VOLUME_LITRES, ML_PER_LITRE } from '@/helpers/pot/constants';

export const PLANT_ID_SCHEMA = z.uuid();

export const MAX_SOIL_VOLUME_ML = MAX_SOIL_VOLUME_LITRES * ML_PER_LITRE;

export const LOAD_CARE_INTERVALS_SCHEMA = z.object({
    species: z.string().trim().min(1)
});

export const LOAD_WATER_AMOUNT_SCHEMA = z.object({
    species: z.string().trim().min(1),
    soilVolumeMl: z.int().min(1).max(MAX_SOIL_VOLUME_ML).optional()
});

export const ALL_PATH = '/';

export const DB_POOL_MAX = 10;
// pg defaults to 0, which queues a saturated pool's queries forever instead of failing.
export const DB_POOL_CONNECTION_TIMEOUT_MS = 5000;
export const DB_POOL_IDLE_TIMEOUT_MS = 30000;
