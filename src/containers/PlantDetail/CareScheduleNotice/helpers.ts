// Types
import type { CareSchedule } from '@/types';

export const formatWaterSchedule = (care: CareSchedule): string => {
    const { waterEveryDaysSpring, waterEveryDaysSummer, waterEveryDaysAutumn, waterEveryDaysWinter } = care;

    return `Spring ${waterEveryDaysSpring} · Summer ${waterEveryDaysSummer} · Autumn ${waterEveryDaysAutumn} · Winter ${waterEveryDaysWinter} days`;
};
