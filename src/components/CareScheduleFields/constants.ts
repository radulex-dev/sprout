import { Snowflake, Sprout, Sun, TreeDeciduous } from 'lucide-react';

// Types
import { CareSeason } from '@/types';
import type { SeasonMeta } from './types';

export const FREQUENCY_TITLE = 'Frequency';

export const NEVER_OPTION_VALUE = '0';
export const NEVER_OPTION_LABEL = 'never';

export const SEASON_META: Record<CareSeason, SeasonMeta> = {
    [CareSeason.Spring]: {
        icon: Sprout,
        label: 'Spring'
    },
    [CareSeason.Summer]: {
        icon: Sun,
        label: 'Summer'
    },
    [CareSeason.Autumn]: {
        icon: TreeDeciduous,
        label: 'Autumn'
    },
    [CareSeason.Winter]: {
        icon: Snowflake,
        label: 'Winter'
    }
};
