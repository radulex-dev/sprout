import { getLocalTimeZone, parseDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

// Constants
import { DAY_MS, DAYS_PER_MONTH, FALLBACK_CARE } from './constants';

// Helpers
import { allTasks, buildCareNotification, dueTasks, formatDue, isNotificationHour, isNotifiedToday, nextDue, resolveLastCare, startOfToday, toDateValue } from './index';
import { resolveCare } from './resolve';

// Mocks
import { careReference } from '@test/vitest/data/care-reference.mock';
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Types
import { CareKind, CareSource } from '@/types';

const startOfLocalDay = (timestamp: number): number => {
    const date = new Date(timestamp);

    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const utcDate = (timestamp: number): string => {
    return new Date(timestamp).toISOString().slice(0, 10);
};

describe('nextDue', () => {
    it('returns undefined when a kind is never scheduled', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: NOW,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });

        expect(nextDue(plant, CareKind.Fertilize)).toBeUndefined();
        expect(nextDue(plant, CareKind.Repot)).toBeUndefined();
    });

    it('returns lastCare plus the day interval', () => {
        const last = NOW - 3 * DAY_MS;
        const plant = makePlant({
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: last,
                [CareKind.Fertilize]: last,
                [CareKind.Repot]: last
            }
        });

        expect(nextDue(plant, CareKind.Water)).toBe(last + 7 * DAY_MS);
    });

    it('returns lastCare plus the month interval', () => {
        const last = NOW - 40 * DAY_MS;
        const plant = makePlant({
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: 3
            },
            lastCare: {
                [CareKind.Water]: last,
                [CareKind.Fertilize]: last,
                [CareKind.Repot]: last
            }
        });

        expect(nextDue(plant, CareKind.Repot)).toBe(last + 3 * DAYS_PER_MONTH * DAY_MS);
    });

    it('bases a never-cared kind on the acquisition date', () => {
        const plant = {
            ...makePlant({
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: undefined,
                    repotEveryMonths: undefined
                }
            }),
            lastCare: {}
        };

        expect(nextDue(plant, CareKind.Water)).toBe(plant.acquiredAt + 7 * DAY_MS);
    });
});

describe('formatDue', () => {
    it.each([
        [-2, '2 days overdue'],
        [-1, '1 day overdue'],
        [0, 'due today'],
        [1, 'tomorrow'],
        [5, 'in 5 days'],
        [30, 'in ~1 month'],
        [45, 'in ~2 months']
    ])('formats %i as "%s"', (daysUntil, expected) => {
        expect(formatDue(daysUntil)).toBe(expected);
    });
});

describe('dueTasks', () => {
    it('includes an overdue task and excludes a future one', () => {
        const overdue = makePlant({
            id: 'plant-overdue',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: NOW - 10 * DAY_MS,
                [CareKind.Fertilize]: NOW - 10 * DAY_MS,
                [CareKind.Repot]: NOW - 10 * DAY_MS
            }
        });
        const future = makePlant({
            id: 'plant-future',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: NOW - DAY_MS,
                [CareKind.Fertilize]: NOW - DAY_MS,
                [CareKind.Repot]: NOW - DAY_MS
            }
        });

        const tasks = dueTasks([overdue, future], NOW);
        const [overdueTask] = tasks;

        expect(tasks).toHaveLength(1);
        expect(overdueTask.plant.id).toBe('plant-overdue');
        expect(overdueTask.kind).toBe(CareKind.Water);
    });

    it('is unaffected by the pot size', () => {
        const unsized = makePlant({
            care: {
                waterEveryDays: 7
            },
            lastCare: {
                [CareKind.Water]: NOW - 10 * DAY_MS
            }
        });
        const sized = makePlant({
            potDiameter: 10.5,
            care: {
                waterEveryDays: 7
            },
            lastCare: {
                [CareKind.Water]: NOW - 10 * DAY_MS
            }
        });

        expect(dueTasks([unsized], NOW)).toHaveLength(1);
        expect(dueTasks([sized], NOW)).toHaveLength(1);
    });
});

describe('isNotifiedToday', () => {
    it('is false when the kind has never been notified', () => {
        const plant = makePlant();

        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(false);
    });

    it('is true when notified earlier on the same UTC date', () => {
        const last = NOW - 2 * 60 * 60 * 1000;
        const plant = makePlant({
            lastNotified: {
                [CareKind.Water]: last
            }
        });

        expect(utcDate(last)).toBe(utcDate(NOW));
        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(true);
    });

    it('is false when the previous notification falls on an earlier UTC date, even 23h ago', () => {
        const last = NOW - 23 * 60 * 60 * 1000;
        const plant = makePlant({
            lastNotified: {
                [CareKind.Water]: last
            }
        });

        expect(utcDate(last)).not.toBe(utcDate(NOW));
        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(false);
    });

    it('is false one millisecond before the current UTC day starts', () => {
        const dayStart = Math.floor(NOW / DAY_MS) * DAY_MS;
        const plant = makePlant({
            lastNotified: {
                [CareKind.Water]: dayStart - 1
            }
        });

        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(false);
    });

    it('is true exactly at the start of the current UTC day', () => {
        const dayStart = Math.floor(NOW / DAY_MS) * DAY_MS;
        const plant = makePlant({
            lastNotified: {
                [CareKind.Water]: dayStart
            }
        });

        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(true);
    });

    it('tracks each kind independently', () => {
        const plant = makePlant({
            lastNotified: {
                [CareKind.Water]: NOW
            }
        });

        expect(isNotifiedToday(plant, CareKind.Fertilize, NOW)).toBe(false);
        expect(isNotifiedToday(plant, CareKind.Water, NOW)).toBe(true);
    });
});

describe('isNotificationHour', () => {
    it.each([{
        expected: true,
        iso: '2026-01-15T09:00:00Z'
    }, {
        expected: false,
        iso: '2026-01-15T08:00:00Z'
    }, {
        expected: true,
        iso: '2026-07-15T08:00:00Z'
    }, {
        expected: false,
        iso: '2026-07-15T09:00:00Z'
    }, {
        expected: false,
        iso: '2026-06-10T12:00:00Z'
    }])('reads $iso as the notification hour: $expected', ({ expected, iso }) => {
        expect(isNotificationHour(Date.parse(iso))).toBe(expected);
    });
});

describe('allTasks', () => {
    it('sorts tasks soonest first across plants', () => {
        const soon = makePlant({
            id: 'plant-soon',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: NOW - 6 * DAY_MS,
                [CareKind.Fertilize]: NOW - 6 * DAY_MS,
                [CareKind.Repot]: NOW - 6 * DAY_MS
            }
        });
        const later = makePlant({
            id: 'plant-later',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            },
            lastCare: {
                [CareKind.Water]: NOW - DAY_MS,
                [CareKind.Fertilize]: NOW - DAY_MS,
                [CareKind.Repot]: NOW - DAY_MS
            }
        });

        const tasks = allTasks([later, soon], NOW);
        const [first, second] = tasks;

        expect(tasks.map((task) => {
            return task.plant.id;
        })).toEqual(['plant-soon', 'plant-later']);
        expect(first.daysUntil).toBeLessThan(second.daysUntil);
    });
});

describe('resolveLastCare', () => {
    it('resolves no kinds when every date is missing', () => {
        expect(resolveLastCare({})).toEqual({});
    });

    it('resolves no kinds when every date is an empty string', () => {
        expect(resolveLastCare({
            [CareKind.Water]: '',
            [CareKind.Fertilize]: '',
            [CareKind.Repot]: ''
        })).toEqual({});
    });

    it('resolves a supplied date to local midnight and leaves the other kinds absent', () => {
        const resolved = resolveLastCare({
            [CareKind.Water]: '2023-08-15'
        });

        expect(resolved[CareKind.Water]).toBe(new Date(2023, 7, 15).getTime());
        expect(resolved).not.toHaveProperty(CareKind.Fertilize);
        expect(resolved).not.toHaveProperty(CareKind.Repot);
    });
});

describe('toDateValue', () => {
    it('renders the local day of a local-midnight instant', () => {
        expect(toDateValue(new Date(2026, 8, 6).getTime())).toBe('2026-09-06');
    });

    it('renders the same local day for a late-evening instant', () => {
        expect(toDateValue(new Date(2026, 8, 6, 21, 34).getTime())).toBe('2026-09-06');
    });

    it('round-trips a resolved last-care date', () => {
        const resolved = resolveLastCare({
            [CareKind.Water]: '2026-09-06'
        });
        const water = resolved[CareKind.Water];

        expect(water).toBeDefined();

        if (water !== undefined) {
            expect(toDateValue(water)).toBe('2026-09-06');
        }
    });
});

describe('parseDate', () => {
    it('returns the local midnight of a padded ISO date', () => {
        expect(parseDate('2026-09-01').toDate(getLocalTimeZone()).getTime()).toBe(new Date(2026, 8, 1).getTime());
    });

    it.each(['2026-9-1', '2026-02-30', '2026-13-45', ''])('throws for %j', (value) => {
        expect(() => {
            return parseDate(value);
        }).toThrow();
    });
});

describe('startOfToday', () => {
    it('returns the local midnight of the given instant', () => {
        expect(startOfToday(NOW)).toBe(startOfLocalDay(NOW));
    });

    it('resolves a late-evening instant to the same local day', () => {
        const evening = new Date(2026, 8, 6, 21, 34).getTime();

        expect(toDateValue(startOfToday(evening))).toBe('2026-09-06');
    });
});

describe('resolveCare', () => {
    it('resolves a genus case-insensitively', () => {
        const resolved = resolveCare(careReference, {
            species: 'Monstera deliciosa',
            genus: 'Monstera'
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 5,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        });
    });

    it('resolves the family case-insensitively when the genus is unknown', () => {
        const resolved = resolveCare(careReference, {
            genus: 'Soleirolia',
            family: 'Urticaceae'
        });

        expect(resolved.source).toBe(CareSource.Family);
        expect(resolved.care).toEqual({
            waterEveryDays: 6,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        });
    });

    it('prefers the genus over the family when both match', () => {
        const resolved = resolveCare(careReference, {
            genus: 'Monstera',
            family: 'Urticaceae'
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 5,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        });
    });

    it('falls back to FALLBACK_CARE when neither the genus nor the family is known', () => {
        const resolved = resolveCare(careReference, {
            species: 'Ficus unknownia',
            genus: 'Unknownia',
            family: 'Unknownaceae'
        });

        expect(resolved).toEqual({
            care: FALLBACK_CARE,
            source: CareSource.None
        });
    });

    it('falls back to FALLBACK_CARE for an empty lookup', () => {
        expect(resolveCare(careReference, {})).toEqual({
            care: FALLBACK_CARE,
            source: CareSource.None
        });
    });
});

describe('alias resolution', () => {
    it('resolves a genus alias to the reclassified genus entry', () => {
        const resolved = resolveCare(careReference, {
            species: 'Calathea orbifolia',
            genus: 'Calathea'
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 4,
            fertilizeEveryDays: 21,
            repotEveryMonths: 12
        });
    });

    it('resolves a species alias to the aliased genus entry', () => {
        const resolved = resolveCare(careReference, {
            species: 'Dracaena trifasciata',
            genus: 'Dracaena'
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 21,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        });
    });

    it('normalises case and surrounding whitespace before alias resolution', () => {
        const resolved = resolveCare(careReference, {
            species: '  DRACAENA TRIFASCIATA  ',
            genus: '  Dracaena  '
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 21,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        });
    });

    it('keeps Dracaena fragrans on the dracaena entry while aliasing Dracaena trifasciata', () => {
        const resolved = resolveCare(careReference, {
            species: 'Dracaena fragrans',
            genus: 'Dracaena'
        });

        expect(resolved.source).toBe(CareSource.Genus);
        expect(resolved.care).toEqual({
            waterEveryDays: 10,
            fertilizeEveryDays: 30,
            repotEveryMonths: 30
        });
    });
});

describe('buildCareNotification', () => {
    it('keeps the personal copy for a single task', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: 'Time to water Fern',
            body: 'Fern is due for watering today. Set a pot size for the amount.',
            tag: 'sprout-care-today'
        });
    });

    it('uses the fertilising gerund rather than a naive label suffix', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification.body).toBe('Fern is due for fertilising today.');
    });

    it('reports an overdue single task', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Repot,
            dueAt: NOW,
            daysUntil: -2
        }]);

        expect(notification.body).toBe('Fern is 2 days overdue for repotting.');
    });

    it('combines several tasks on one plant into a single notification', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: 'Fern needs care today',
            body: 'Fern: water (set a pot size), fertilise',
            tag: 'sprout-care-today'
        });
    });

    it('combines tasks across plants into a single notification', () => {
        const fern = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });
        const monstera = makePlant({
            id: 'plant-monstera',
            nickname: 'Monstera'
        });

        const notification = buildCareNotification([{
            plant: fern,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: monstera,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: '2 plants need care today',
            body: 'Fern: water (set a pot size) · Monstera: water (set a pot size)',
            tag: 'sprout-care-today'
        });
    });

    it('collapses to per-kind counts once more than three plants are due', () => {
        const fern = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });
        const monstera = makePlant({
            id: 'plant-monstera',
            nickname: 'Monstera'
        });
        const aloe = makePlant({
            id: 'plant-aloe',
            nickname: 'Aloe'
        });
        const ficus = makePlant({
            id: 'plant-ficus',
            nickname: 'Ficus'
        });

        const notification = buildCareNotification([{
            plant: fern,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: monstera,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: aloe,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: ficus,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: '4 plants need care today',
            body: 'Water: 3 · Fertilise: 1',
            tag: 'sprout-care-today'
        });
    });

    it('appends the watering amount to a sized single water task', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern',
            potDiameter: 12
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: 'Time to water Fern',
            body: 'Fern is due for watering today. Give it about 80 ml.',
            tag: 'sprout-care-today'
        });
    });

    it('keeps the overdue sentence and appends the watering amount', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern',
            potDiameter: 12
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: -2
        }]);

        expect(notification.body).toBe('Fern is 2 days overdue for watering. Give it about 80 ml.');
    });

    it('adds the watering amount to a sized water row in a plant listing', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern',
            potDiameter: 12
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification.body).toBe('Fern: water (about 80 ml), fertilise');
    });

    it('keeps the pot size nudge in an unsized water row of a plant listing', () => {
        const fern = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });
        const monstera = makePlant({
            id: 'plant-monstera',
            nickname: 'Monstera'
        });

        const notification = buildCareNotification([{
            plant: fern,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: monstera,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification.body).toBe('Fern: water (set a pot size) · Monstera: fertilise');
    });

    it('adds no pot size text to a listing whose plants have no water row', () => {
        const fern = makePlant({
            id: 'plant-fern',
            nickname: 'Fern'
        });
        const monstera = makePlant({
            id: 'plant-monstera',
            nickname: 'Monstera'
        });

        const notification = buildCareNotification([{
            plant: fern,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant: monstera,
            kind: CareKind.Repot,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification.body).toBe('Fern: fertilise · Monstera: repot');
    });

    it('appends the litre-derived amount to a litre-sized single water task', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern',
            soilVolumeLitres: 12
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification).toEqual({
            title: 'Time to water Fern',
            body: 'Fern is due for watering today. Give it about 1.2 L.',
            tag: 'sprout-care-today'
        });
    });

    it('adds the litre-derived amount to a litre-sized water row in a plant listing', () => {
        const plant = makePlant({
            id: 'plant-fern',
            nickname: 'Fern',
            soilVolumeLitres: 12
        });

        const notification = buildCareNotification([{
            plant,
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        }, {
            plant,
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        }]);

        expect(notification.body).toBe('Fern: water (about 1.2 L), fertilise');
    });
});
