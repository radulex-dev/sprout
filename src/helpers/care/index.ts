import { fromAbsolute, fromDate, getLocalTimeZone, parseDate, toCalendarDate } from '@internationalized/date';

// Constants
import { DAY_MS, DAYS_PER_MONTH } from './constants';

// Types
import { CareKind, type LastCareDates, type Plant } from '@/types';
import type { CareTask } from './types';

// Constants
export { DAYS_PER_MONTH, DAY_MS, CARE_META, FALLBACK_CARE } from './constants';

// Types
export type { CareMeta, CareTask } from './types';

const intervalMs = (plant: Plant, kind: CareKind): number => {
    const care = plant.care;

    if (kind === CareKind.Water) {
        return care.waterEveryDays * DAY_MS;
    }

    if (kind === CareKind.Fertilize) {
        return care.fertilizeEveryDays * DAY_MS;
    }

    return care.repotEveryMonths * DAYS_PER_MONTH * DAY_MS;
};

export const nextDue = (plant: Plant, kind: CareKind): number | undefined => {
    const interval = intervalMs(plant, kind);

    if (interval <= 0) {
        return undefined;
    }

    return plant.lastCare[kind] + interval;
};

const tasksForPlant = (plant: Plant, now: number): CareTask[] => {
    const kinds = [CareKind.Water, CareKind.Fertilize, CareKind.Repot];

    return kinds.reduce<CareTask[]>((tasks, kind) => {
        const dueAt = nextDue(plant, kind);

        if (dueAt === undefined) {
            return tasks;
        }

        return [
            ...tasks,
            {
                plant,
                kind,
                dueAt,
                daysUntil: Math.ceil((dueAt - now) / DAY_MS)
            }];
    }, []);
};

export const allTasks = (plants: Plant[], now = Date.now()): CareTask[] => {
    const tasks = plants.flatMap((plant) => {
        return tasksForPlant(plant, now);
    });

    return tasks.toSorted((left, right) => {
        return left.dueAt - right.dueAt;
    });
};

export const dueTasks = (plants: Plant[], now = Date.now()): CareTask[] => {
    return allTasks(plants, now).filter((task) => {
        return task.dueAt <= now;
    });
};

const startOfLocalDay = (timestamp: number, timeZone: string): number => {
    return toCalendarDate(fromDate(new Date(timestamp), timeZone)).toDate(timeZone).getTime();
};

const localMidnightOf = (value: string | undefined, fallback: number, timeZone: string): number => {
    if (!value) {
        return fallback;
    }

    return parseDate(value).toDate(timeZone).getTime();
};

export const resolveLastCare = (dates: LastCareDates, now = Date.now()): Record<CareKind, number> => {
    const timeZone = getLocalTimeZone();
    const startOfToday = startOfLocalDay(now, timeZone);

    return {
        [CareKind.Water]: localMidnightOf(dates[CareKind.Water], startOfToday, timeZone),
        [CareKind.Fertilize]: localMidnightOf(dates[CareKind.Fertilize], startOfToday, timeZone),
        [CareKind.Repot]: localMidnightOf(dates[CareKind.Repot], startOfToday, timeZone)
    };
};

export const toDateValue = (timestamp: number): string => {
    return toCalendarDate(fromAbsolute(timestamp, getLocalTimeZone())).toString();
};

export const formatDue = (daysUntil: number): string => {
    if (daysUntil < -1) {
        return `${-daysUntil} days overdue`;
    }

    if (daysUntil === -1) {
        return '1 day overdue';
    }

    if (daysUntil <= 0) {
        return 'due today';
    }

    if (daysUntil === 1) {
        return 'tomorrow';
    }

    if (daysUntil < 30) {
        return `in ${daysUntil} days`;
    }

    const months = Math.round(daysUntil / 30);

    return months === 1 ? 'in ~1 month' : `in ~${months} months`;
};
