import type * as z from 'zod';

// Services
import type { CareProfileSchema } from './schema';

// Types
import type { CareProfileConfidence } from '@/types';

export interface CareProfile {
    waterSpring: number;
    waterSummer: number;
    waterAutumn: number;
    waterWinter: number;
    waterAmountMl: number;
    fertilizeEveryDays?: number;
    repotEveryMonths?: number;
    confidence: CareProfileConfidence;
}

export interface CareProfileRequest {
    userId: string;
    species: string;
    soilVolumeMl?: number;
}

export type CareProfilePayload = z.infer<typeof CareProfileSchema>;
