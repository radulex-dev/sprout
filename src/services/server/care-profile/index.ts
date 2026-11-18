import 'server-only';
import { eq, sql } from 'drizzle-orm';

// Helpers
import { buildCareIntervalPrompt, buildWaterAmountPrompt, normaliseCareIntervals, normaliseSpeciesKey, toCareIntervals } from './helpers';

// Services
import { AiCapReachedError, AiUnavailableError, claimAiUsage, isAiConfigured, readAiEnvironment, requestStructured } from '@/services/server/ai';
import { CARE_INTERVAL_JSON_SCHEMA, CareIntervalsSchema, WATER_AMOUNT_JSON_SCHEMA, WaterAmountSchema } from './schema';

// Database
import { database } from '@/lib/db';
import { aiCareInterval, aiWaterAmount } from '@/lib/db/schema';

// Types
import type { CareIntervals, CareIntervalsRequest, WaterPercentRequest } from './types';

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

const readCachedWaterPercent = async (speciesKey: string): Promise<number | undefined> => {
    const rows = await database
        .select()
        .from(aiWaterAmount)
        .where(eq(aiWaterAmount.speciesKey, speciesKey));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    return row.waterPercent;
};

const writeCachedWaterPercent = async (speciesKey: string, waterPercent: number): Promise<void> => {
    const values = {
        speciesKey,
        waterPercent,
        model: readAiEnvironment().model,
        createdAt: Date.now()
    };

    await database
        .insert(aiWaterAmount)
        .values(values)
        .onConflictDoUpdate({
            target: [aiWaterAmount.speciesKey],
            set: values
        });
};

export const getWaterPercent = async (request: WaterPercentRequest): Promise<number> => {
    const { userId, species } = request;
    const speciesKey = normaliseSpeciesKey(species);
    const cached = await readCachedWaterPercent(speciesKey);

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
        buildWaterAmountPrompt(species),
        WATER_AMOUNT_JSON_SCHEMA,
        WaterAmountSchema
    );

    await writeCachedWaterPercent(speciesKey, payload.waterPercent);

    return payload.waterPercent;
};
