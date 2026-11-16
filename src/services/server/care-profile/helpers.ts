import { clamp } from 'lodash-es';

// Constants
import { WATER_OPTIONS } from '@/helpers/care/constants';
import { CARE_INTERVAL_PROMPT_SYSTEM, CARE_PROMPT_MILLILITRES_UNIT, CARE_PROMPT_SOIL_VOLUME_LABEL, CARE_PROMPT_SPECIES_LABEL, MAX_FERTILIZE_DAYS, MAX_REPOT_MONTHS, MAX_WATER_AMOUNT_ML, MAX_WATER_DAYS, MIN_FERTILIZE_DAYS, MIN_REPOT_MONTHS, MIN_WATER_AMOUNT_ML, MIN_WATER_DAYS, WATER_AMOUNT_PROMPT_SYSTEM } from './constants';

// Types
import type { AiMessage } from '@/services/server/ai/types';
import type { AiCareIntervalRow } from '@/lib/db/types';
import type { CareSchedule } from '@/types';
import type { CareIntervals, CareIntervalsPayload } from './types';

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

export const normaliseCareIntervals = (raw: CareIntervalsPayload): CareIntervals => {
    return {
        waterSpring: normaliseWaterDays(raw.waterSpring),
        waterSummer: normaliseWaterDays(raw.waterSummer),
        waterAutumn: normaliseWaterDays(raw.waterAutumn),
        waterWinter: normaliseWaterDays(raw.waterWinter),
        fertilizeEveryDays: normaliseFertilizeDays(raw.fertilizeEveryDays),
        repotEveryMonths: normaliseRepotMonths(raw.repotEveryMonths),
        confidence: raw.confidence
    };
};

export const toCareIntervals = (row: AiCareIntervalRow): CareIntervals => {
    return {
        waterSpring: row.waterSpring,
        waterSummer: row.waterSummer,
        waterAutumn: row.waterAutumn,
        waterWinter: row.waterWinter,
        fertilizeEveryDays: normaliseFertilizeDays(row.fertilizeEveryDays ?? 0),
        repotEveryMonths: normaliseRepotMonths(row.repotEveryMonths ?? 0),
        confidence: row.confidence
    };
};

export const toCareSchedule = (intervals: CareIntervals, waterAmountMl: number): CareSchedule => {
    return {
        waterEveryDaysSpring: intervals.waterSpring,
        waterEveryDaysSummer: intervals.waterSummer,
        waterEveryDaysAutumn: intervals.waterAutumn,
        waterEveryDaysWinter: intervals.waterWinter,
        waterAmountMl,
        fertilizeEveryDays: intervals.fertilizeEveryDays,
        repotEveryMonths: intervals.repotEveryMonths
    };
};

export const buildCareIntervalPrompt = (species: string): AiMessage[] => {
    return [{
        role: 'system',
        content: CARE_INTERVAL_PROMPT_SYSTEM
    }, {
        role: 'user',
        content: `${CARE_PROMPT_SPECIES_LABEL}: ${species}`
    }];
};

export const buildWaterAmountPrompt = (species: string, soilVolumeMl: number): AiMessage[] => {
    return [{
        role: 'system',
        content: WATER_AMOUNT_PROMPT_SYSTEM
    }, {
        role: 'user',
        content: [
            `${CARE_PROMPT_SPECIES_LABEL}: ${species}`,
            `${CARE_PROMPT_SOIL_VOLUME_LABEL}: ${soilVolumeMl} ${CARE_PROMPT_MILLILITRES_UNIT}`
        ].join('\n')
    }];
};
