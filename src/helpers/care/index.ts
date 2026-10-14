import { fromAbsolute, fromDate, getLocalTimeZone, parseDate, toCalendarDate } from '@internationalized/date';

// Constants
import { CARE_META, CARE_NOTIFICATION_TAG, DAY_MS, DAYS_PER_MONTH, MAX_LISTED_PLANTS } from './constants';

// Types
import { CareKind, type LastCareDates, type Plant } from '@/types';
import type { CareNotification, CareTask } from './types';

const intervalMs = (plant: Plant, kind: CareKind): number => {
    const care = plant.care;

    if (kind === CareKind.Water) {
        return care.waterEveryDays * DAY_MS;
    }

    if (kind === CareKind.Fertilize) {
        return (care.fertilizeEveryDays ?? 0) * DAY_MS;
    }

    return (care.repotEveryMonths ?? 0) * DAYS_PER_MONTH * DAY_MS;
};

export const nextDue = (plant: Plant, kind: CareKind): number | undefined => {
    const interval = intervalMs(plant, kind);

    if (interval <= 0) {
        return;
    }

    return (plant.lastCare[kind] ?? plant.acquiredAt) + interval;
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

export const resolveLastCare = (dates: LastCareDates): Partial<Record<CareKind, number>> => {
    const timeZone = getLocalTimeZone();

    return [CareKind.Water, CareKind.Fertilize, CareKind.Repot].reduce<Partial<Record<CareKind, number>>>((resolved, kind) => {
        const value = dates[kind];

        if (!value) {
            return resolved;
        }

        return {
            ...resolved,
            [kind]: parseDate(value).toDate(timeZone).getTime()
        };
    }, {});
};

export const toDateValue = (timestamp: number | undefined): string | undefined => {
    if (timestamp === undefined) {
        return;
    }

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

export const plantDisplayName = (plant: Plant): string => {
    return plant.nickname || plant.commonName || plant.species;
};

const buildOneTaskCareNotification = (task: CareTask): CareNotification => {
    const meta = CARE_META[task.kind];
    const name = plantDisplayName(task.plant);

    return {
        title: `Time to ${meta.label.toLowerCase()} ${name}`,
        body: task.daysUntil < 0
            ? `${name} is ${-task.daysUntil} day${task.daysUntil === -1 ? '' : 's'} overdue for ${meta.gerund}.`
            : `${name} is due for ${meta.gerund} today.`,
        tag: CARE_NOTIFICATION_TAG
    };
};

const buildLessThanMaxTasksCareNotification = (tasks: CareTask[], title: string): CareNotification => {
    const kindsByPlantId = tasks.reduce<Map<string, string[]>>((accumulator, task) => {
        const kinds = accumulator.get(task.plant.id) ?? [];

        kinds.push(CARE_META[task.kind].label.toLowerCase());
        accumulator.set(task.plant.id, kinds);

        return accumulator;
    }, new Map());

    const parts = [...kindsByPlantId].reduce<string[]>((accumulator, [plantId, kinds]) => {
        const plantTask = tasks.find((task) => {
            return task.plant.id === plantId;
        });

        return [...accumulator, `${plantTask ? plantDisplayName(plantTask.plant) : ''}: ${kinds.join(', ')}`];
    }, []);

    return {
        title,
        body: parts.join(' · '),
        tag: CARE_NOTIFICATION_TAG
    };
};

const buildMoreThanMaxTasksCareNotification = (tasks: CareTask[], title: string): CareNotification => {
    const countParts = [CareKind.Water, CareKind.Fertilize, CareKind.Repot].reduce<string[]>((accumulator, kind) => {
        const count = tasks.filter((task) => {
            return task.kind === kind;
        }).length;

        if (count === 0) {
            return accumulator;
        }

        return [...accumulator, `${CARE_META[kind].label}: ${count}`];
    }, []);

    return {
        title,
        body: countParts.join(' · '),
        tag: CARE_NOTIFICATION_TAG
    };
};

export const buildCareNotification = (tasks: CareTask[]): CareNotification => {
    const [first] = tasks;

    if (tasks.length === 1) {
        return buildOneTaskCareNotification(first);
    }

    const plantCount = new Set(tasks.map((task) => {
        return task.plant.id;
    })).size;
    const title = plantCount === 1
        ? `${plantDisplayName(first.plant)} needs care today`
        : `${plantCount} plants need care today`;

    return plantCount > MAX_LISTED_PLANTS
        ? buildMoreThanMaxTasksCareNotification(tasks, title)
        : buildLessThanMaxTasksCareNotification(tasks, title);
};
