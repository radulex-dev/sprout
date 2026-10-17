import * as z from 'zod';

// Constants
import { MAX_DAYS, MAX_MONTHS, MAX_TEXT_LENGTH } from './constants';
import { MAX_PHOTO_BYTES } from '@/helpers/image/constants';
import { MAX_SOIL_VOLUME_LITRES, MIN_SOIL_VOLUME_LITRES, POT_SIZES } from '@/helpers/pot/constants';

// Types
import { CareKind, type PlantInput } from '@/types';
import type { ContainerSize } from '@/helpers/pot/types';

export const CareKindSchema = z.enum(CareKind);

export const CareScheduleSchema = z.object({
    waterEveryDays: z.int().min(0).max(MAX_DAYS),
    fertilizeEveryDays: z.int().min(1).max(MAX_DAYS).optional(),
    repotEveryMonths: z.int().min(1).max(MAX_MONTHS).optional()
});

// Realm-agnostic: survives React Flight/Next serialization (File is a Blob).
const photoSchema = z.custom<Blob>((value) => {
    return typeof value === 'object'
        && value !== null
        && typeof (value as Blob).arrayBuffer === 'function'
        && typeof (value as Blob).size === 'number'
        && (value as Blob).size <= MAX_PHOTO_BYTES;
}, {
    message: `Photo must be a Blob no larger than ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`
});

const potDiameterSchema = z.number().refine((value) => {
    return POT_SIZES.some((size) => {
        return size.diameter === value;
    });
}, {
    message: 'Pot diameter must be one of the standard pot sizes.'
});

const soilVolumeLitresSchema = z.int().min(MIN_SOIL_VOLUME_LITRES).max(MAX_SOIL_VOLUME_LITRES);

const isSingleContainerSize = (size: ContainerSize): boolean => {
    return size.potDiameter === undefined || size.soilVolumeLitres === undefined;
};

const singleContainerSizeMessage = {
    message: 'A plant can have either a pot diameter or a soil volume, not both.'
};

export const LastCareDateSchema = z.int().nonnegative().refine((value) => {
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
    potDiameter: potDiameterSchema.optional(),
    soilVolumeLitres: soilVolumeLitresSchema.optional(),
    acquiredAt: z.int().nonnegative(),
    lastCare: LastCareSchema.optional()
}).refine(isSingleContainerSize, singleContainerSizeMessage);

/** Compile-time assertion that the schema output still matches the shared client contract. */
export const parsePlantInput = (value: unknown): PlantInput => {
    return PlantInputSchema.parse(value);
};

export const UpdatePlantSchema = z.object({
    nickname: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    care: CareScheduleSchema,
    potDiameter: potDiameterSchema.optional(),
    soilVolumeLitres: soilVolumeLitresSchema.optional()
}).refine(isSingleContainerSize, singleContainerSizeMessage);
export type UpdatePlantInput = z.infer<typeof UpdatePlantSchema>;

export const NotifiedAtSchema = z.int().nonnegative();
