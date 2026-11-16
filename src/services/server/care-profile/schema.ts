import * as z from 'zod';

// Constants
import { MAX_FERTILIZE_DAYS, MAX_REPOT_MONTHS, MAX_WATER_AMOUNT_ML, MAX_WATER_DAYS, MIN_WATER_AMOUNT_ML, MIN_WATER_DAYS } from './constants';

// Types
import { CareProfileConfidence } from '@/types';

export const CareIntervalsSchema = z.object({
    waterSpring: z.int(),
    waterSummer: z.int(),
    waterAutumn: z.int(),
    waterWinter: z.int(),
    fertilizeEveryDays: z.int(),
    repotEveryMonths: z.int(),
    confidence: z.enum(CareProfileConfidence),
    reasoning: z.string().optional()
});

export const WaterAmountSchema = z.object({
    waterAmountMl: z.int()
});

export const CARE_INTERVAL_JSON_SCHEMA: Record<string, unknown> = {
    type: 'object',
    additionalProperties: false,
    properties: {
        waterSpring: {
            type: 'integer',
            minimum: MIN_WATER_DAYS,
            maximum: MAX_WATER_DAYS
        },
        waterSummer: {
            type: 'integer',
            minimum: MIN_WATER_DAYS,
            maximum: MAX_WATER_DAYS
        },
        waterAutumn: {
            type: 'integer',
            minimum: MIN_WATER_DAYS,
            maximum: MAX_WATER_DAYS
        },
        waterWinter: {
            type: 'integer',
            minimum: MIN_WATER_DAYS,
            maximum: MAX_WATER_DAYS
        },
        fertilizeEveryDays: {
            type: 'integer',
            minimum: 0,
            maximum: MAX_FERTILIZE_DAYS
        },
        repotEveryMonths: {
            type: 'integer',
            minimum: 0,
            maximum: MAX_REPOT_MONTHS
        },
        confidence: {
            type: 'string',
            enum: Object.values(CareProfileConfidence)
        },
        reasoning: {
            type: 'string'
        }
    },
    required: ['waterSpring', 'waterSummer', 'waterAutumn', 'waterWinter', 'fertilizeEveryDays', 'repotEveryMonths', 'confidence', 'reasoning']
};

export const WATER_AMOUNT_JSON_SCHEMA: Record<string, unknown> = {
    type: 'object',
    additionalProperties: false,
    properties: {
        waterAmountMl: {
            type: 'integer',
            minimum: MIN_WATER_AMOUNT_ML,
            maximum: MAX_WATER_AMOUNT_ML
        }
    },
    required: ['waterAmountMl']
};
