import type * as z from 'zod';

// Services
import type { CareIntervalsSchema, WaterAmountSchema } from './schema';

// Types
import type { CareProfileConfidence } from '@/types';

export interface CareIntervals {
    waterSpring: number;
    waterSummer: number;
    waterAutumn: number;
    waterWinter: number;
    fertilizeEveryDays?: number;
    repotEveryMonths?: number;
    confidence: CareProfileConfidence;
}

export interface CareIntervalsRequest {
    userId: string;
    species: string;
}

export interface WaterAmountRequest {
    userId: string;
    species: string;
    soilVolumeMl?: number;
}

export type CareIntervalsPayload = z.infer<typeof CareIntervalsSchema>;
export type WaterAmountPayload = z.infer<typeof WaterAmountSchema>;
