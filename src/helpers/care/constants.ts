import { Droplets, Flower2, Leaf } from 'lucide-react';

// Types
import { CareKind, type CareSchedule } from '@/types';
import type { CareMeta } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DAYS_PER_MONTH = 30;

export const CARE_NOTIFICATION_TAG = 'sprout-care-today';

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

export const FALLBACK_CARE: CareSchedule = {
    waterEveryDays: 7,
    fertilizeEveryDays: 30,
    repotEveryMonths: 18
};
