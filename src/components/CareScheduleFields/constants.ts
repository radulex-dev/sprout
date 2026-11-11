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

export const WATER_OPTIONS = [2, 3, 4, 5, 6, 7, 9, 10, 12, 14, 16, 18, 21, 28];
export const FERTILIZE_OPTIONS = [14, 21, 30, 45, 60, 90];
export const REPOT_OPTIONS = [6, 12, 18, 24, 30, 36];
