// Types
import { CareKind, type Plant } from '@/types';

export const NOW = 1700000000000;

const DEFAULT_CARE = {
    waterEveryDaysSpring: 7,
    waterEveryDaysSummer: 7,
    waterEveryDaysAutumn: 7,
    waterEveryDaysWinter: 7,
    waterAmountMl: 0,
    fertilizeEveryDays: 30,
    repotEveryMonths: 12
};

const DEFAULT_LAST_CARE = {
    [CareKind.Water]: NOW,
    [CareKind.Fertilize]: NOW,
    [CareKind.Repot]: NOW
};

const DEFAULT_LAST_NOTIFIED: Partial<Record<CareKind, number>> = {};

export const makePlant = (overrides: Partial<Plant> = {}): Plant => {
    const plant: Plant = {
        id: 'plant-1',
        nickname: '',
        species: 'Monstera deliciosa',
        commonName: '',
        acquiredAt: NOW,
        notes: '',
        ...overrides,
        care: {
            ...DEFAULT_CARE,
            ...overrides.care
        },
        lastCare: {
            ...DEFAULT_LAST_CARE,
            ...overrides.lastCare
        },
        lastNotified: {
            ...DEFAULT_LAST_NOTIFIED,
            ...overrides.lastNotified
        }
    };

    return plant;
};
