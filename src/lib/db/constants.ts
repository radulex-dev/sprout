import * as z from 'zod';

export const PLANT_ID_SCHEMA = z.uuid();

export const ALL_PATH = '/';

export const DB_POOL_MAX = 10;
// pg defaults to 0, which queues a saturated pool's queries forever instead of failing.
export const DB_POOL_CONNECTION_TIMEOUT_MS = 5000;
export const DB_POOL_IDLE_TIMEOUT_MS = 30000;
