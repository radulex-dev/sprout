import 'server-only';
import { and, eq, sql } from 'drizzle-orm';

// Constants
import { STANDARD_POT_ML, UNKNOWN_SOIL_VOLUME_ML } from './constants';

// Helpers
import { buildCarePrompt, normaliseCareProfile, normaliseSpeciesKey, toCareProfile } from './helpers';

// Services
import { AiCapReachedError, AiUnavailableError, claimAiUsage, isAiConfigured, readAiEnvironment, requestStructured } from '@/services/server/ai';
import { CARE_PROFILE_JSON_SCHEMA, CareProfileSchema } from './schema';

// Database
import { database } from '@/lib/db';
import { aiCareProfile } from '@/lib/db/schema';

// Types
import type { CareProfile, CareProfileRequest } from './types';

const readCachedProfile = async (speciesKey: string, soilVolumeMl: number): Promise<CareProfile | undefined> => {
    const rows = await database
        .select()
        .from(aiCareProfile)
        .where(and(eq(aiCareProfile.speciesKey, speciesKey), eq(aiCareProfile.soilVolumeMl, soilVolumeMl)));
    const row = rows.at(0);

    if (!row) {
        return;
    }

    return toCareProfile(row);
};

const writeCareProfile = async (speciesKey: string, soilVolumeMl: number, profile: CareProfile): Promise<void> => {
    const values = {
        speciesKey,
        soilVolumeMl,
        waterSpring: profile.waterSpring,
        waterSummer: profile.waterSummer,
        waterAutumn: profile.waterAutumn,
        waterWinter: profile.waterWinter,
        waterAmountMl: profile.waterAmountMl,
        fertilizeEveryDays: profile.fertilizeEveryDays,
        repotEveryMonths: profile.repotEveryMonths,
        confidence: profile.confidence,
        model: readAiEnvironment().model,
        createdAt: Date.now()
    };

    await database
        .insert(aiCareProfile)
        .values(values)
        .onConflictDoUpdate({
            target: [aiCareProfile.speciesKey, aiCareProfile.soilVolumeMl],
            set: {
                ...values,
                fertilizeEveryDays: profile.fertilizeEveryDays ?? sql`null`,
                repotEveryMonths: profile.repotEveryMonths ?? sql`null`
            }
        });
};

export const getCareProfile = async (request: CareProfileRequest): Promise<CareProfile> => {
    const { userId, species, soilVolumeMl } = request;
    const speciesKey = normaliseSpeciesKey(species);
    const cacheVolume = soilVolumeMl ?? UNKNOWN_SOIL_VOLUME_ML;
    const cached = await readCachedProfile(speciesKey, cacheVolume);

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
        buildCarePrompt(species, soilVolumeMl ?? STANDARD_POT_ML),
        CARE_PROFILE_JSON_SCHEMA,
        CareProfileSchema
    );
    const profile = normaliseCareProfile(payload);

    await writeCareProfile(speciesKey, cacheVolume, profile);

    return profile;
};
