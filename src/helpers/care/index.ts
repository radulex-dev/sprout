import { fromAbsolute, fromDate, getLocalTimeZone, parseDate, toCalendarDate } from '@internationalized/date';

// Constants
import { DAY_MS, DAYS_PER_MONTH } from './constants';

// Types
import { CareKind, type LastCareDates, type Plant } from '@/types';
import type { CareTask } from './types';

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

const utcDayIndex = (timestamp: number): number => {
    return Math.floor(timestamp / DAY_MS);
};

export const isNotifiedToday = (plant: Plant, kind: CareKind, now: number): boolean => {
    const last = plant.lastNotified[kind];

    return last !== undefined && utcDayIndex(last) === utcDayIndex(now);
};

const startOfLocalDay = (timestamp: number, timeZone: string): number => {
    return toCalendarDate(fromDate(new Date(timestamp), timeZone)).toDate(timeZone).getTime();
};

export const startOfToday = (now = Date.now()): number => {
    return startOfLocalDay(now, getLocalTimeZone());
};

const localMidnightOf = (value: string | undefined, fallback: number, timeZone: string): number => {
    if (!value) {
        return fallback;
    }

    return parseDate(value).toDate(timeZone).getTime();
};

export const resolveLastCare = (dates: LastCareDates, now = Date.now()): Record<CareKind, number> => {
    const timeZone = getLocalTimeZone();
    const startOfDay = startOfToday(now);

    return {
        [CareKind.Water]: localMidnightOf(dates[CareKind.Water], startOfDay, timeZone),
        [CareKind.Fertilize]: localMidnightOf(dates[CareKind.Fertilize], startOfDay, timeZone),
        [CareKind.Repot]: localMidnightOf(dates[CareKind.Repot], startOfDay, timeZone)
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
