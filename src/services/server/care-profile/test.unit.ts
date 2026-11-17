import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { MAX_FERTILIZE_DAYS, MAX_REPOT_MONTHS, MAX_WATER_AMOUNT_ML, MIN_FERTILIZE_DAYS, MIN_REPOT_MONTHS, MIN_WATER_AMOUNT_ML } from './constants';

// Helpers
import { mockSelectChain } from '@test/vitest/helpers/mockDb';
import { buildCareIntervalPrompt, buildWaterAmountPrompt, normaliseCareIntervals, normaliseFertilizeDays, normaliseRepotMonths, normaliseSpeciesKey, normaliseWaterDays, resolveWaterAmountMl, toCareSchedule } from './helpers';

// Services
import { AiCapReachedError, AiUnavailableError } from '@/services/server/ai';
import { getCareIntervals, getWaterAmount } from './index';
import { CARE_INTERVAL_JSON_SCHEMA, CareIntervalsSchema, WATER_AMOUNT_JSON_SCHEMA, WaterAmountSchema } from './schema';

// Database
import { aiCareInterval } from '@/lib/db/schema';

// Types
import { CareProfileConfidence } from '@/types';

const { mockClaimAiUsage, mockInsert, mockIsAiConfigured, mockRequestStructured, mockSelect } = vi.hoisted(() => {
    return {
        mockClaimAiUsage: vi.fn(),
        mockInsert: vi.fn(),
        mockIsAiConfigured: vi.fn(),
        mockRequestStructured: vi.fn(),
        mockSelect: vi.fn()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            insert: mockInsert,
            select: mockSelect
        }
    };
});

vi.mock('@/services/server/ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/server/ai')>();

    return {
        ...actual,
        claimAiUsage: mockClaimAiUsage,
        isAiConfigured: mockIsAiConfigured,
        requestStructured: mockRequestStructured
    };
});

describe('Helpers', () => {
    describe('normaliseWaterDays', () => {
        it.each([{
            expected: 2,
            input: 0
        }, {
            expected: 2,
            input: 1
        }, {
            expected: 3,
            input: 3
        }, {
            expected: 28,
            input: 29
        }, {
            expected: 9,
            input: 8
        }, {
            expected: 12,
            input: 11
        }, {
            expected: 14,
            input: 13
        }, {
            expected: 21,
            input: 20
        }])('maps $input to $expected', ({ expected, input }) => {
            expect(normaliseWaterDays(input)).toBe(expected);
        });
    });

    describe('normaliseFertilizeDays', () => {
        it.each([{
            expected: undefined,
            input: 0
        }, {
            expected: undefined,
            input: -5
        }, {
            expected: MIN_FERTILIZE_DAYS,
            input: 10
        }, {
            expected: 30,
            input: 30
        }, {
            expected: MAX_FERTILIZE_DAYS,
            input: 400
        }])('maps $input to $expected', ({ expected, input }) => {
            expect(normaliseFertilizeDays(input)).toBe(expected);
        });
    });

    describe('normaliseRepotMonths', () => {
        it.each([{
            expected: undefined,
            input: 0
        }, {
            expected: undefined,
            input: -2
        }, {
            expected: MIN_REPOT_MONTHS,
            input: 2
        }, {
            expected: 18,
            input: 18
        }, {
            expected: MAX_REPOT_MONTHS,
            input: 100
        }])('maps $input to $expected', ({ expected, input }) => {
            expect(normaliseRepotMonths(input)).toBe(expected);
        });
    });

    describe('resolveWaterAmountMl', () => {
        it.each([{
            expected: 120,
            soilVolumeMl: 1200,
            waterPercent: 10
        }, {
            expected: 1000,
            soilVolumeMl: 10000,
            waterPercent: 10
        }, {
            expected: 18,
            soilVolumeMl: 350,
            waterPercent: 5
        }, {
            expected: MAX_WATER_AMOUNT_ML,
            soilVolumeMl: 1000000,
            waterPercent: 30
        }, {
            expected: MIN_WATER_AMOUNT_ML,
            soilVolumeMl: 100,
            waterPercent: 5
        }])('resolves $soilVolumeMl ml at $waterPercent percent to $expected', ({ expected, soilVolumeMl, waterPercent }) => {
            expect(resolveWaterAmountMl(soilVolumeMl, waterPercent)).toBe(expected);
        });
    });

    describe('normaliseSpeciesKey', () => {
        it('lowercases and trims the species', () => {
            expect(normaliseSpeciesKey('  Monstera Deliciosa ')).toBe('monstera deliciosa');
        });
    });

    describe('normaliseCareIntervals', () => {
        it('clamps every interval and drops the reasoning', () => {
            expect(normaliseCareIntervals({
                waterSpring: 7,
                waterSummer: 40,
                waterAutumn: 10,
                waterWinter: 1,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0,
                confidence: CareProfileConfidence.Low,
                reasoning: 'because'
            })).toEqual({
                waterSpring: 7,
                waterSummer: 28,
                waterAutumn: 10,
                waterWinter: 2,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined,
                confidence: CareProfileConfidence.Low
            });
        });
    });

    describe('toCareSchedule', () => {
        it('maps the four quarters and the passed amount onto the schedule', () => {
            expect(toCareSchedule({
                waterSpring: 14,
                waterSummer: 7,
                waterAutumn: 10,
                waterWinter: 21,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                confidence: CareProfileConfidence.High
            }, 80)).toEqual({
                waterEveryDaysSpring: 14,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 10,
                waterEveryDaysWinter: 21,
                waterAmountMl: 80,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            });
        });

        it('keeps an absent fertilise and repot absent', () => {
            expect(toCareSchedule({
                waterSpring: 7,
                waterSummer: 7,
                waterAutumn: 7,
                waterWinter: 7,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined,
                confidence: CareProfileConfidence.Medium
            }, 80)).toEqual({
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 80,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined
            });
        });
    });

    describe('buildCareIntervalPrompt', () => {
        it('builds a system message and a user message naming the species', () => {
            const [system, user] = buildCareIntervalPrompt('Monstera deliciosa');

            expect(system.role).toBe('system');
            expect(user.role).toBe('user');
            expect(user.content).toContain('Monstera deliciosa');
        });

        it('stays inside the input budget', () => {
            const messages = buildCareIntervalPrompt('Monstera deliciosa');

            expect(messages.reduce((total, message) => {
                return total + message.content.length;
            }, 0)).toBeLessThan(2000);
        });
    });

    describe('buildWaterAmountPrompt', () => {
        it('builds a system message and a user message naming the species only', () => {
            const [system, user] = buildWaterAmountPrompt('Monstera deliciosa');

            expect(system.role).toBe('system');
            expect(user.role).toBe('user');
            expect(user.content).toBe('Species: Monstera deliciosa');
        });

        it('stays inside the input budget', () => {
            const messages = buildWaterAmountPrompt('Monstera deliciosa');

            expect(messages.reduce((total, message) => {
                return total + message.content.length;
            }, 0)).toBeLessThan(2000);
        });
    });
});

describe('CARE_INTERVAL_JSON_SCHEMA', () => {
    it('requires exactly the properties the zod schema defines', () => {
        const keys = Object.keys(CareIntervalsSchema.shape);

        expect(CARE_INTERVAL_JSON_SCHEMA.required).toEqual(keys);
        expect(Object.keys(CARE_INTERVAL_JSON_SCHEMA.properties as object)).toEqual(keys);
    });

    it('forbids unknown properties', () => {
        expect(CARE_INTERVAL_JSON_SCHEMA.additionalProperties).toBe(false);
    });
});

describe('WATER_AMOUNT_JSON_SCHEMA', () => {
    it('requires exactly the properties the zod schema defines', () => {
        const keys = Object.keys(WaterAmountSchema.shape);

        expect(WATER_AMOUNT_JSON_SCHEMA.required).toEqual(keys);
        expect(Object.keys(WATER_AMOUNT_JSON_SCHEMA.properties as object)).toEqual(keys);
    });

    it('forbids unknown properties', () => {
        expect(WATER_AMOUNT_JSON_SCHEMA.additionalProperties).toBe(false);
    });
});

describe('getCareIntervals', () => {
    beforeEach(() => {
        mockClaimAiUsage.mockReset();
        mockInsert.mockReset();
        mockIsAiConfigured.mockReset();
        mockIsAiConfigured.mockReturnValue(true);
        mockRequestStructured.mockReset();
        mockSelect.mockReset();
    });

    it('returns the stored intervals without claiming a unit or calling the model', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([{
            waterSpring: 14,
            waterSummer: 7,
            waterAutumn: 10,
            waterWinter: 21,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            confidence: CareProfileConfidence.High
        }]));

        await expect(getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            waterSpring: 14,
            waterSummer: 7,
            waterAutumn: 10,
            waterWinter: 21,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            confidence: CareProfileConfidence.High
        });

        expect(mockClaimAiUsage).not.toHaveBeenCalled();
        expect(mockRequestStructured).not.toHaveBeenCalled();
    });

    it('maps a stored zero fertilise and repot back to undefined', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([{
            waterSpring: 7,
            waterSummer: 7,
            waterAutumn: 7,
            waterWinter: 7,
            fertilizeEveryDays: 0,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.Medium
        }]));

        const intervals = await getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        });

        expect(intervals.fertilizeEveryDays).toBeUndefined();
        expect(intervals.repotEveryMonths).toBeUndefined();
    });

    it('claims a unit, calls the model and upserts on a miss', async () => {
        const values = vi.fn(() => {
            return {
                onConflictDoUpdate: vi.fn(() => {
                    return Promise.resolve();
                })
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(true);
        mockRequestStructured.mockResolvedValueOnce({
            waterSpring: 8,
            waterSummer: 40,
            waterAutumn: 11,
            waterWinter: 2,
            fertilizeEveryDays: 30,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.High,
            reasoning: 'because'
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await expect(getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            waterSpring: 9,
            waterSummer: 28,
            waterAutumn: 12,
            waterWinter: 2,
            fertilizeEveryDays: 30,
            repotEveryMonths: undefined,
            confidence: CareProfileConfidence.High
        });

        expect(mockClaimAiUsage).toHaveBeenCalledWith('user-1');
        expect(values).toHaveBeenCalledWith({
            speciesKey: 'monstera deliciosa',
            waterSpring: 9,
            waterSummer: 28,
            waterAutumn: 12,
            waterWinter: 2,
            fertilizeEveryDays: 30,
            repotEveryMonths: undefined,
            confidence: CareProfileConfidence.High,
            model: '',
            createdAt: expect.any(Number)
        });
    });

    it('clears a never fertilise and repot with an explicit null on the upsert', async () => {
        const onConflictDoUpdate = vi.fn(() => {
            return Promise.resolve();
        });
        const values = vi.fn(() => {
            return {
                onConflictDoUpdate
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(true);
        mockRequestStructured.mockResolvedValueOnce({
            waterSpring: 7,
            waterSummer: 7,
            waterAutumn: 7,
            waterWinter: 7,
            fertilizeEveryDays: 0,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.High,
            reasoning: 'because'
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        });

        expect(onConflictDoUpdate).toHaveBeenCalledWith({
            target: [aiCareInterval.speciesKey],
            set: {
                speciesKey: 'monstera deliciosa',
                waterSpring: 7,
                waterSummer: 7,
                waterAutumn: 7,
                waterWinter: 7,
                fertilizeEveryDays: sql`null`,
                repotEveryMonths: sql`null`,
                confidence: CareProfileConfidence.High,
                model: '',
                createdAt: expect.any(Number)
            }
        });
    });

    it('throws when AI is not configured without claiming a unit', async () => {
        mockIsAiConfigured.mockReturnValueOnce(false);
        mockSelect.mockReturnValueOnce(mockSelectChain([]));

        await expect(getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        })).rejects.toBeInstanceOf(AiUnavailableError);

        expect(mockClaimAiUsage).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('throws when the daily cap is reached and writes nothing', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(false);

        await expect(getCareIntervals({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        })).rejects.toBeInstanceOf(AiCapReachedError);

        expect(mockRequestStructured).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();
    });
});

describe('getWaterAmount', () => {
    beforeEach(() => {
        mockClaimAiUsage.mockReset();
        mockInsert.mockReset();
        mockIsAiConfigured.mockReset();
        mockIsAiConfigured.mockReturnValue(true);
        mockRequestStructured.mockReset();
        mockSelect.mockReset();
    });

    it('returns the stored amount without claiming a unit or calling the model', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([{
            waterAmountMl: 80
        }]));

        await expect(getWaterAmount({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).resolves.toBe(80);

        expect(mockClaimAiUsage).not.toHaveBeenCalled();
        expect(mockRequestStructured).not.toHaveBeenCalled();
    });

    it('claims a unit, calls the model and upserts on a miss', async () => {
        const values = vi.fn(() => {
            return {
                onConflictDoUpdate: vi.fn(() => {
                    return Promise.resolve();
                })
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(true);
        mockRequestStructured.mockResolvedValueOnce({
            waterPercent: 30
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await expect(getWaterAmount({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).resolves.toBe(240);

        expect(mockClaimAiUsage).toHaveBeenCalledWith('user-1');
        expect(values).toHaveBeenCalledWith({
            speciesKey: 'monstera deliciosa',
            soilVolumeMl: 800,
            waterAmountMl: 240,
            model: '',
            createdAt: expect.any(Number)
        });
    });

    it('keys an unknown soil volume as zero and computes from the standard pot', async () => {
        const onConflictDoUpdate = vi.fn(() => {
            return Promise.resolve();
        });
        const values = vi.fn(() => {
            return {
                onConflictDoUpdate
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(true);
        mockRequestStructured.mockResolvedValueOnce({
            waterPercent: 10
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await expect(getWaterAmount({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        })).resolves.toBe(80);

        expect(mockRequestStructured).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({
            content: 'Species: Monstera deliciosa'
        })]), WATER_AMOUNT_JSON_SCHEMA, WaterAmountSchema);
        expect(values).toHaveBeenCalledWith(expect.objectContaining({
            soilVolumeMl: 0
        }));
        expect(onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
            set: expect.objectContaining({
                soilVolumeMl: 0
            })
        }));
    });

    it('throws when AI is not configured without claiming a unit', async () => {
        mockIsAiConfigured.mockReturnValueOnce(false);
        mockSelect.mockReturnValueOnce(mockSelectChain([]));

        await expect(getWaterAmount({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).rejects.toBeInstanceOf(AiUnavailableError);

        expect(mockClaimAiUsage).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('throws when the daily cap is reached and writes nothing', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([]));
        mockClaimAiUsage.mockResolvedValueOnce(false);

        await expect(getWaterAmount({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).rejects.toBeInstanceOf(AiCapReachedError);

        expect(mockRequestStructured).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();
    });
});
