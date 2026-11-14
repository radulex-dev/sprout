import { clamp } from 'lodash-es';

// Constants
import { WATER_OPTIONS } from '@/helpers/care/constants';
import { CARE_PROMPT_MILLILITRES_UNIT, CARE_PROMPT_SOIL_VOLUME_LABEL, CARE_PROMPT_SPECIES_LABEL, CARE_PROMPT_SYSTEM, MAX_FERTILIZE_DAYS, MAX_REPOT_MONTHS, MAX_WATER_AMOUNT_ML, MAX_WATER_DAYS, MIN_FERTILIZE_DAYS, MIN_REPOT_MONTHS, MIN_WATER_AMOUNT_ML, MIN_WATER_DAYS } from './constants';

// Types
import type { AiMessage } from '@/services/server/ai/types';
import type { AiCareProfileRow } from '@/lib/db/types';
import type { CareSchedule } from '@/types';
import type { CareProfile, CareProfilePayload } from './types';

const snapToOption = (value: number, options: number[]): number => {
    return options.reduce((closest, option) => {
        const distance = Math.abs(option - value);
        const closestDistance = Math.abs(closest - value);

        return distance < closestDistance || (distance === closestDistance && option > closest) ? option : closest;
    });
};

export const normaliseWaterDays = (value: number): number => {
    return snapToOption(clamp(value, MIN_WATER_DAYS, MAX_WATER_DAYS), WATER_OPTIONS);
};

export const normaliseFertilizeDays = (value: number): number | undefined => {
    if (value <= 0) {
        return;
    }

    return clamp(value, MIN_FERTILIZE_DAYS, MAX_FERTILIZE_DAYS);
};

export const normaliseRepotMonths = (value: number): number | undefined => {
    if (value <= 0) {
        return;
    }

    return clamp(value, MIN_REPOT_MONTHS, MAX_REPOT_MONTHS);
};

export const normaliseAmountMl = (value: number): number => {
    return clamp(value, MIN_WATER_AMOUNT_ML, MAX_WATER_AMOUNT_ML);
};

export const normaliseSpeciesKey = (species: string): string => {
    return species.toLowerCase().trim();
};

export const normaliseCareProfile = (raw: CareProfilePayload): CareProfile => {
    return {
        waterSpring: normaliseWaterDays(raw.waterSpring),
        waterSummer: normaliseWaterDays(raw.waterSummer),
        waterAutumn: normaliseWaterDays(raw.waterAutumn),
        waterWinter: normaliseWaterDays(raw.waterWinter),
        waterAmountMl: normaliseAmountMl(raw.waterAmountMl),
        fertilizeEveryDays: normaliseFertilizeDays(raw.fertilizeEveryDays),
        repotEveryMonths: normaliseRepotMonths(raw.repotEveryMonths),
        confidence: raw.confidence
    };
};

export const toCareProfile = (row: AiCareProfileRow): CareProfile => {
    return {
        waterSpring: row.waterSpring,
        waterSummer: row.waterSummer,
        waterAutumn: row.waterAutumn,
        waterWinter: row.waterWinter,
        waterAmountMl: row.waterAmountMl,
        fertilizeEveryDays: normaliseFertilizeDays(row.fertilizeEveryDays ?? 0),
        repotEveryMonths: normaliseRepotMonths(row.repotEveryMonths ?? 0),
        confidence: row.confidence
    };
};

export const toCareSchedule = (profile: CareProfile): CareSchedule => {
    return {
        waterEveryDaysSpring: profile.waterSpring,
        waterEveryDaysSummer: profile.waterSummer,
        waterEveryDaysAutumn: profile.waterAutumn,
        waterEveryDaysWinter: profile.waterWinter,
        waterAmountMl: profile.waterAmountMl,
        fertilizeEveryDays: profile.fertilizeEveryDays,
        repotEveryMonths: profile.repotEveryMonths
    };
};

export const buildCarePrompt = (species: string, soilVolumeMl: number): AiMessage[] => {
    return [{
        role: 'system',
        content: CARE_PROMPT_SYSTEM
    }, {
        role: 'user',
        content: [
            `${CARE_PROMPT_SPECIES_LABEL}: ${species}`,
            `${CARE_PROMPT_SOIL_VOLUME_LABEL}: ${soilVolumeMl} ${CARE_PROMPT_MILLILITRES_UNIT}`
        ].join('\n')
    }];
};
