import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { MAX_FERTILIZE_DAYS, MAX_REPOT_MONTHS, MAX_WATER_AMOUNT_ML, MIN_FERTILIZE_DAYS, MIN_REPOT_MONTHS, MIN_WATER_AMOUNT_ML } from './constants';

// Helpers
import { mockSelectChain } from '@test/vitest/helpers/mockDb';
import { buildCarePrompt, normaliseAmountMl, normaliseCareProfile, normaliseFertilizeDays, normaliseRepotMonths, normaliseSpeciesKey, normaliseWaterDays, toCareSchedule } from './helpers';

// Services
import { AiCapReachedError, AiUnavailableError } from '@/services/server/ai';
import { getCareProfile } from './index';
import { CARE_PROFILE_JSON_SCHEMA, CareProfileSchema } from './schema';

// Database
import { aiCareProfile } from '@/lib/db/schema';

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

    describe('normaliseAmountMl', () => {
        it.each([{
            expected: MIN_WATER_AMOUNT_ML,
            input: 1
        }, {
            expected: 80,
            input: 80
        }, {
            expected: MAX_WATER_AMOUNT_ML,
            input: 99999
        }])('maps $input to $expected', ({ expected, input }) => {
            expect(normaliseAmountMl(input)).toBe(expected);
        });
    });

    describe('normaliseSpeciesKey', () => {
        it('lowercases and trims the species', () => {
            expect(normaliseSpeciesKey('  Monstera Deliciosa ')).toBe('monstera deliciosa');
        });
    });

    describe('normaliseCareProfile', () => {
        it('clamps every interval and drops the reasoning', () => {
            expect(normaliseCareProfile({
                waterSpring: 7,
                waterSummer: 40,
                waterAutumn: 10,
                waterWinter: 1,
                waterAmountMl: 99999,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0,
                confidence: CareProfileConfidence.Low,
                reasoning: 'because'
            })).toEqual({
                waterSpring: 7,
                waterSummer: 28,
                waterAutumn: 10,
                waterWinter: 2,
                waterAmountMl: MAX_WATER_AMOUNT_ML,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined,
                confidence: CareProfileConfidence.Low
            });
        });
    });

    describe('toCareSchedule', () => {
        it('maps the four quarters and the amount onto the schedule', () => {
            expect(toCareSchedule({
                waterSpring: 14,
                waterSummer: 7,
                waterAutumn: 10,
                waterWinter: 21,
                waterAmountMl: 80,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                confidence: CareProfileConfidence.High
            })).toEqual({
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
                waterAmountMl: 80,
                fertilizeEveryDays: undefined,
                repotEveryMonths: undefined,
                confidence: CareProfileConfidence.Medium
            })).toEqual({
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

    describe('buildCarePrompt', () => {
        it('builds a system message and a user message naming the species and the soil volume', () => {
            const [system, user] = buildCarePrompt('Monstera deliciosa', 800);

            expect(system.role).toBe('system');
            expect(user.role).toBe('user');
            expect(user.content).toContain('Monstera deliciosa');
            expect(user.content).toContain('800 ml');
        });

        it('stays inside the input budget', () => {
            const messages = buildCarePrompt('Monstera deliciosa', 800);

            expect(messages.reduce((total, message) => {
                return total + message.content.length;
            }, 0)).toBeLessThan(2000);
        });
    });
});

describe('CARE_PROFILE_JSON_SCHEMA', () => {
    it('requires exactly the properties the zod schema defines', () => {
        const keys = Object.keys(CareProfileSchema.shape);

        expect(CARE_PROFILE_JSON_SCHEMA.required).toEqual(keys);
        expect(Object.keys(CARE_PROFILE_JSON_SCHEMA.properties as object)).toEqual(keys);
    });

    it('forbids unknown properties', () => {
        expect(CARE_PROFILE_JSON_SCHEMA.additionalProperties).toBe(false);
    });
});

describe('getCareProfile', () => {
    beforeEach(() => {
        mockClaimAiUsage.mockReset();
        mockInsert.mockReset();
        mockIsAiConfigured.mockReset();
        mockIsAiConfigured.mockReturnValue(true);
        mockRequestStructured.mockReset();
        mockSelect.mockReset();
    });

    it('returns the stored profile without claiming a unit or calling the model', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([{
            waterSpring: 14,
            waterSummer: 7,
            waterAutumn: 10,
            waterWinter: 21,
            waterAmountMl: 80,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            confidence: CareProfileConfidence.High
        }]));

        await expect(getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).resolves.toEqual({
            waterSpring: 14,
            waterSummer: 7,
            waterAutumn: 10,
            waterWinter: 21,
            waterAmountMl: 80,
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
            waterAmountMl: 80,
            fertilizeEveryDays: 0,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.Medium
        }]));

        const profile = await getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        });

        expect(profile.fertilizeEveryDays).toBeUndefined();
        expect(profile.repotEveryMonths).toBeUndefined();
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
            waterAmountMl: 99999,
            fertilizeEveryDays: 30,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.High,
            reasoning: 'because'
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await expect(getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).resolves.toEqual({
            waterSpring: 9,
            waterSummer: 28,
            waterAutumn: 12,
            waterWinter: 2,
            waterAmountMl: MAX_WATER_AMOUNT_ML,
            fertilizeEveryDays: 30,
            repotEveryMonths: undefined,
            confidence: CareProfileConfidence.High
        });

        expect(mockClaimAiUsage).toHaveBeenCalledWith('user-1');
        expect(values).toHaveBeenCalledWith({
            speciesKey: 'monstera deliciosa',
            soilVolumeMl: 800,
            waterSpring: 9,
            waterSummer: 28,
            waterAutumn: 12,
            waterWinter: 2,
            waterAmountMl: MAX_WATER_AMOUNT_ML,
            fertilizeEveryDays: 30,
            repotEveryMonths: undefined,
            confidence: CareProfileConfidence.High,
            model: '',
            createdAt: expect.any(Number)
        });
    });

    it('keys an unknown soil volume as zero and prompts with the standard pot', async () => {
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
            waterAmountMl: 80,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            confidence: CareProfileConfidence.High,
            reasoning: 'because'
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        });

        expect(mockRequestStructured).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({
            content: expect.stringContaining('800 ml')
        })]), CARE_PROFILE_JSON_SCHEMA, CareProfileSchema);
        expect(values).toHaveBeenCalledWith(expect.objectContaining({
            soilVolumeMl: 0
        }));
        expect(onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
            set: expect.objectContaining({
                soilVolumeMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            })
        }));
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
            waterAmountMl: 80,
            fertilizeEveryDays: 0,
            repotEveryMonths: 0,
            confidence: CareProfileConfidence.High,
            reasoning: 'because'
        });
        mockInsert.mockReturnValueOnce({
            values
        });

        await getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        });

        expect(onConflictDoUpdate).toHaveBeenCalledWith({
            target: [aiCareProfile.speciesKey, aiCareProfile.soilVolumeMl],
            set: {
                speciesKey: 'monstera deliciosa',
                soilVolumeMl: 800,
                waterSpring: 7,
                waterSummer: 7,
                waterAutumn: 7,
                waterWinter: 7,
                waterAmountMl: 80,
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

        await expect(getCareProfile({
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

        await expect(getCareProfile({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 800
        })).rejects.toBeInstanceOf(AiCapReachedError);

        expect(mockRequestStructured).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();
    });
});
