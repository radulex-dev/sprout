import { getLocalTimeZone, parseDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';

// Constants
import { DAY_MS, DAYS_PER_MONTH, FALLBACK_CARE } from './constants';

// Helpers
import { allTasks, dueTasks, formatDue, isNotifiedToday, nextDue, resolveLastCare, startOfToday, toDateValue } from './index';
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
    it('returns undefined when the interval is zero', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 0,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            },
            lastCare: {
                [CareKind.Water]: NOW,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });

        expect(nextDue(plant, CareKind.Water)).toBeUndefined();
        expect(nextDue(plant, CareKind.Fertilize)).toBeUndefined();
        expect(nextDue(plant, CareKind.Repot)).toBeUndefined();
    });

    it('returns lastCare plus the day interval', () => {
        const last = NOW - 3 * DAY_MS;
        const plant = makePlant({
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
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
                waterEveryDays: 0,
                fertilizeEveryDays: 0,
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
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
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
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
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

describe('allTasks', () => {
    it('sorts tasks soonest first across plants', () => {
        const soon = makePlant({
            id: 'plant-soon',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
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
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
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
    it('defaults every kind to the start of today when all dates are blank', () => {
        const resolved = resolveLastCare({}, NOW);

        expect(resolved).toEqual({
            [CareKind.Water]: startOfLocalDay(NOW),
            [CareKind.Fertilize]: startOfLocalDay(NOW),
            [CareKind.Repot]: startOfLocalDay(NOW)
        });
    });

    it('treats an empty string like a missing date', () => {
        const resolved = resolveLastCare({
            [CareKind.Water]: '',
            [CareKind.Fertilize]: '',
            [CareKind.Repot]: ''
        }, NOW);

        expect(resolved).toEqual({
            [CareKind.Water]: startOfLocalDay(NOW),
            [CareKind.Fertilize]: startOfLocalDay(NOW),
            [CareKind.Repot]: startOfLocalDay(NOW)
        });
    });

    it('honours a supplied date for its own kind without affecting the others', () => {
        const resolved = resolveLastCare({
            [CareKind.Water]: '2023-08-15'
        }, NOW);

        expect(resolved[CareKind.Water]).toBe(new Date(2023, 7, 15).getTime());
        expect(resolved[CareKind.Fertilize]).toBe(startOfLocalDay(NOW));
        expect(resolved[CareKind.Repot]).toBe(startOfLocalDay(NOW));
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
        }, NOW);

        expect(toDateValue(resolved[CareKind.Water])).toBe('2026-09-06');
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
