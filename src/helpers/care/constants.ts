import { Droplets, Flower2, Leaf } from 'lucide-react';

// Types
import { CareKind, CareSeason, type CareSchedule } from '@/types';
import type { CareMeta } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DAYS_PER_MONTH = 30;

export const CARE_NOTIFICATION_TAG = 'sprout-care-today';
export const NOTIFICATION_TIME_ZONE = 'Europe/Amsterdam';
export const NOTIFICATION_HOUR = 10;

export const MAX_LISTED_PLANTS = 3;

export const POT_SIZE_NUDGE_SENTENCE = 'Set a pot size for the amount.';
export const POT_SIZE_NUDGE_SLOT = 'set a pot size';

export const CARE_META: Record<CareKind, CareMeta> = {
    [CareKind.Water]: {
        label: 'Water',
        verb: 'watered',
        gerund: 'watering',
        icon: Droplets
    },
    [CareKind.Fertilize]: {
        label: 'Fertilise',
        verb: 'fertilised',
        gerund: 'fertilising',
        icon: Leaf
    },
    [CareKind.Repot]: {
        label: 'Repot',
        verb: 'repotted',
        gerund: 'repotting',
        icon: Flower2
    }
};

export const WATER_SEASON_FIELDS: Record<CareSeason, keyof Pick<CareSchedule, 'waterEveryDaysSpring' | 'waterEveryDaysSummer' | 'waterEveryDaysAutumn' | 'waterEveryDaysWinter'>> = {
    [CareSeason.Spring]: 'waterEveryDaysSpring',
    [CareSeason.Summer]: 'waterEveryDaysSummer',
    [CareSeason.Autumn]: 'waterEveryDaysAutumn',
    [CareSeason.Winter]: 'waterEveryDaysWinter'
};

export const FALLBACK_CARE: CareSchedule = {
    waterEveryDaysSpring: 7,
    waterEveryDaysSummer: 7,
    waterEveryDaysAutumn: 7,
    waterEveryDaysWinter: 7,
    waterAmountMl: 0,
    fertilizeEveryDays: 30,
    repotEveryMonths: 18
};
