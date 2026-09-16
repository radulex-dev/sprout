import * as z from 'zod';

// Constants
import { MAX_DAYS, MAX_MONTHS, MAX_PHOTO_BYTES, MAX_TEXT_LENGTH } from './constants';

// Types
import { CareKind, type PlantInput } from '@/types';

export const CareKindSchema = z.enum(CareKind);

export const CareScheduleSchema = z.object({
    waterEveryDays: z.int().min(0).max(MAX_DAYS),
    fertilizeEveryDays: z.int().min(0).max(MAX_DAYS),
    repotEveryMonths: z.int().min(0).max(MAX_MONTHS)
});

// Realm-agnostic: survives React Flight/Next serialization (File is a Blob).
const photoSchema = z.custom<Blob>((value) => {
    return typeof value === 'object'
        && value !== null
        && typeof (value as Blob).arrayBuffer === 'function'
        && typeof (value as Blob).size === 'number'
        && (value as Blob).size <= MAX_PHOTO_BYTES;
}, {
    message: 'Photo must be a Blob no larger than 5 MB.'
});

const LastCareDateSchema = z.int().nonnegative().refine((value) => {
    return value <= Date.now();
}, {
    message: 'Last care cannot be in the future.'
});

export const LastCareSchema = z.partialRecord(CareKindSchema, LastCareDateSchema);

export const PlantInputSchema = z.object({
    nickname: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    species: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    commonName: z.string().trim().max(MAX_TEXT_LENGTH),
    care: CareScheduleSchema,
    photo: photoSchema.optional(),
    acquiredAt: z.int().nonnegative(),
    lastCare: LastCareSchema.optional()
});

/** Compile-time assertion that the schema output still matches the shared client contract. */
export const parsePlantInput = (value: unknown): PlantInput => {
    return PlantInputSchema.parse(value);
};

export const UpdatePlantSchema = z.object({
    nickname: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    care: CareScheduleSchema
});
export type UpdatePlantInput = z.infer<typeof UpdatePlantSchema>;

export const NotifiedAtSchema = z.int().nonnegative();
