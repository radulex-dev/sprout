import 'server-only';
import { and, eq, sql } from 'drizzle-orm';

// Constants
import { STANDARD_POT_ML, UNKNOWN_SOIL_VOLUME_ML } from './constants';

// Helpers
import { buildCareIntervalPrompt, buildWaterAmountPrompt, normaliseAmountMl, normaliseCareIntervals, normaliseSpeciesKey, toCareIntervals } from './helpers';

// Services
import { AiCapReachedError, AiUnavailableError, claimAiUsage, isAiConfigured, readAiEnvironment, requestStructured } from '@/services/server/ai';
import { CARE_INTERVAL_JSON_SCHEMA, CareIntervalsSchema, WATER_AMOUNT_JSON_SCHEMA, WaterAmountSchema } from './schema';

// Database
import { database } from '@/lib/db';
import { aiCareInterval, aiWaterAmount } from '@/lib/db/schema';

// Types
import type { CareIntervals, CareIntervalsRequest, WaterAmountRequest } from './types';

const readCachedIntervals = async (speciesKey: string): Promise<CareIntervals | undefined> => {
    const rows = await database
        .select()
        .from(aiCareInterval)
        .where(eq(aiCareInterval.speciesKey, speciesKey));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    return toCareIntervals(row);
};

const writeCareIntervals = async (speciesKey: string, intervals: CareIntervals): Promise<void> => {
    const values = {
        speciesKey,
        waterSpring: intervals.waterSpring,
        waterSummer: intervals.waterSummer,
        waterAutumn: intervals.waterAutumn,
        waterWinter: intervals.waterWinter,
        fertilizeEveryDays: intervals.fertilizeEveryDays,
        repotEveryMonths: intervals.repotEveryMonths,
        confidence: intervals.confidence,
        model: readAiEnvironment().model,
        createdAt: Date.now()
    };

    await database
        .insert(aiCareInterval)
        .values(values)
        .onConflictDoUpdate({
            target: [aiCareInterval.speciesKey],
            set: {
                ...values,
                fertilizeEveryDays: intervals.fertilizeEveryDays ?? sql`null`,
                repotEveryMonths: intervals.repotEveryMonths ?? sql`null`
            }
        });
};

export const getCareIntervals = async (request: CareIntervalsRequest): Promise<CareIntervals> => {
    const { userId, species } = request;
    const speciesKey = normaliseSpeciesKey(species);
    const cached = await readCachedIntervals(speciesKey);

    if (cached) {
        return cached;
    }

    if (!isAiConfigured()) {
        throw new AiUnavailableError();
    }

    if (!await claimAiUsage(userId)) {
        throw new AiCapReachedError();
    }

    const payload = await requestStructured(
        buildCareIntervalPrompt(species),
        CARE_INTERVAL_JSON_SCHEMA,
        CareIntervalsSchema
    );
    const intervals = normaliseCareIntervals(payload);

    await writeCareIntervals(speciesKey, intervals);

    return intervals;
};

const readCachedWaterAmount = async (speciesKey: string, soilVolumeMl: number): Promise<number | undefined> => {
    const rows = await database
        .select()
        .from(aiWaterAmount)
        .where(and(eq(aiWaterAmount.speciesKey, speciesKey), eq(aiWaterAmount.soilVolumeMl, soilVolumeMl)));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    return row.waterAmountMl;
};

const writeWaterAmount = async (speciesKey: string, soilVolumeMl: number, waterAmountMl: number): Promise<void> => {
    const values = {
        speciesKey,
        soilVolumeMl,
        waterAmountMl,
        model: readAiEnvironment().model,
        createdAt: Date.now()
    };

    await database
        .insert(aiWaterAmount)
        .values(values)
        .onConflictDoUpdate({
            target: [aiWaterAmount.speciesKey, aiWaterAmount.soilVolumeMl],
            set: values
        });
};

export const getWaterAmount = async (request: WaterAmountRequest): Promise<number> => {
    const { userId, species, soilVolumeMl } = request;
    const speciesKey = normaliseSpeciesKey(species);
    const cacheVolume = soilVolumeMl ?? UNKNOWN_SOIL_VOLUME_ML;
    const cached = await readCachedWaterAmount(speciesKey, cacheVolume);

    if (cached !== undefined) {
        return cached;
    }

    if (!isAiConfigured()) {
        throw new AiUnavailableError();
    }

    if (!await claimAiUsage(userId)) {
        throw new AiCapReachedError();
    }

    const payload = await requestStructured(
        buildWaterAmountPrompt(species, soilVolumeMl ?? STANDARD_POT_ML),
        WATER_AMOUNT_JSON_SCHEMA,
        WaterAmountSchema
    );
    const waterAmountMl = normaliseAmountMl(payload.waterAmountMl);

    await writeWaterAmount(speciesKey, cacheVolume, waterAmountMl);

    return waterAmountMl;
};
