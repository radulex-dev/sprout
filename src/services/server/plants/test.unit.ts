import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { PLANT_ID_SCHEMA } from '@/lib/db/constants';

// Helpers
import { mockDeleteChain, mockInsertChain, mockSelectChain } from '@test/vitest/helpers/mockDb';

// Mocks
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Services
import { createPlant, deletePlant, listPlants, markCareDone, readPlantPhoto, recordNotified, updatePlant } from './index';
import { CareKindSchema, CareScheduleSchema, LastCareSchema, NotifiedAtSchema, PlantInputSchema, UpdatePlantSchema } from './schema';

// Database
import { getPlantPhoto, getPlantsForUser } from '@/lib/db/queries';

// Types
import { CareKind } from '@/types';

const { mockDelete, mockInsert, mockSelect, mockUpdate } = vi.hoisted(() => {
    return {
        mockDelete: vi.fn(),
        mockInsert: vi.fn(),
        mockSelect: vi.fn(),
        mockUpdate: vi.fn()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            delete: mockDelete,
            insert: mockInsert,
            select: mockSelect,
            update: mockUpdate
        }
    };
});

vi.mock('@/lib/db/queries', () => {
    return {
        getPlantPhoto: vi.fn(),
        getPlantsForUser: vi.fn()
    };
});

const mockGetPlantPhoto = vi.mocked(getPlantPhoto);
const mockGetPlantsForUser = vi.mocked(getPlantsForUser);

describe('CareKindSchema', () => {
    it.each([CareKind.Water, CareKind.Fertilize, CareKind.Repot])('accepts %s', (kind) => {
        expect(CareKindSchema.parse(kind)).toBe(kind);
    });

    it('rejects an unknown kind', () => {
        expect(() => {
            return CareKindSchema.parse('sun');
        }).toThrow();
    });
});

describe('CareScheduleSchema', () => {
    it('accepts a valid schedule', () => {
        expect(CareScheduleSchema.parse({
            waterEveryDays: 7,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        })).toEqual({
            waterEveryDays: 7,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        });
    });

    it('accepts an omitted interval for the kinds that can be never', () => {
        expect(CareScheduleSchema.parse({
            waterEveryDays: 7
        })).toEqual({
            waterEveryDays: 7
        });
    });

    it('rejects a zero interval', () => {
        expect(() => {
            return CareScheduleSchema.parse({
                waterEveryDays: 7,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            });
        }).toThrow();
    });

    it('rejects a negative interval', () => {
        expect(() => {
            return CareScheduleSchema.parse({
                waterEveryDays: -1,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            });
        }).toThrow();
    });

    it('rejects a float interval', () => {
        expect(() => {
            return CareScheduleSchema.parse({
                waterEveryDays: 1.5,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            });
        }).toThrow();
    });

    it('rejects an interval over the day maximum', () => {
        expect(() => {
            return CareScheduleSchema.parse({
                waterEveryDays: 7,
                fertilizeEveryDays: 3651,
                repotEveryMonths: 18
            });
        }).toThrow();
    });

    it('rejects an interval over the month maximum', () => {
        expect(() => {
            return CareScheduleSchema.parse({
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 601
            });
        }).toThrow();
    });
});

describe('PlantInputSchema', () => {
    it('accepts a full valid object without a photo', () => {
        expect(PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        })).toEqual({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        });
    });

    it('accepts a Blob photo', () => {
        const parsed = PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000,
            photo: new Blob(['x'])
        });

        expect(parsed.photo).toBeInstanceOf(Blob);
    });

    it('trims the nickname', () => {
        const parsed = PlantInputSchema.parse({
            nickname: '  Fern  ',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        });

        expect(parsed.nickname).toBe('Fern');
    });

    it('rejects an empty nickname', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: '',
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000
            });
        }).toThrow();
    });

    it('rejects a whitespace-only nickname', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: ' '.repeat(3),
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000
            });
        }).toThrow();
    });

    it('rejects a missing species', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'Kitchen monstera',
                species: undefined,
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000
            });
        }).toThrow();
    });

    it('rejects text over the length maximum', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'a'.repeat(201),
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000
            });
        }).toThrow();
    });

    it('rejects a non-Blob photo', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'Kitchen monstera',
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000,
                photo: 'not-a-blob'
            });
        }).toThrow();
    });

    it('rejects a float acquiredAt', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'Kitchen monstera',
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1.5
            });
        }).toThrow();
    });

    it('rejects a negative acquiredAt', () => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'Kitchen monstera',
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: -1
            });
        }).toThrow();
    });

    it('strips unknown keys', () => {
        const parsed = PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000,
            extra: 'ignored'
        });

        expect(parsed).toEqual({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        });
        expect(parsed).not.toHaveProperty('extra');
    });

    it('accepts an omitted lastCare', () => {
        expect(PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        })).not.toHaveProperty('lastCare');
    });

    it('accepts a lastCare map', () => {
        const lastCare = {
            [CareKind.Water]: 1_700_000_000_000
        };

        expect(PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000,
            lastCare
        }).lastCare).toEqual(lastCare);
    });

    it.each([9, 10.5, 30])('accepts the pot diameter %s', (potDiameter) => {
        expect(PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000,
            potDiameter
        }).potDiameter).toBe(potDiameter);
    });

    it('accepts an omitted potDiameter', () => {
        expect(PlantInputSchema.parse({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        })).not.toHaveProperty('potDiameter');
    });

    it.each([0, 11, -9, NaN])('rejects the pot diameter %s', (potDiameter) => {
        expect(() => {
            return PlantInputSchema.parse({
                nickname: 'Kitchen monstera',
                species: 'Monstera deliciosa',
                commonName: 'Swiss cheese plant',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                },
                acquiredAt: 1_700_000_000_000,
                potDiameter
            });
        }).toThrow();
    });
});

describe('LastCareSchema', () => {
    it('accepts a full triple', () => {
        const lastCare = {
            [CareKind.Water]: 1_700_000_000_000,
            [CareKind.Fertilize]: 1_700_000_000_000,
            [CareKind.Repot]: 1_700_000_000_000
        };

        expect(LastCareSchema.parse(lastCare)).toEqual(lastCare);
    });

    it('accepts a partial map', () => {
        expect(LastCareSchema.parse({
            [CareKind.Water]: 1_700_000_000_000
        })).toEqual({
            [CareKind.Water]: 1_700_000_000_000
        });
    });

    it('accepts an empty object', () => {
        expect(LastCareSchema.parse({})).toEqual({});
    });

    it('rejects a future timestamp', () => {
        expect(() => {
            return LastCareSchema.parse({
                [CareKind.Water]: Date.now() + 1000
            });
        }).toThrow();
    });

    it('rejects a string timestamp', () => {
        expect(() => {
            return LastCareSchema.parse({
                [CareKind.Water]: '2023-11-14'
            });
        }).toThrow();
    });
});

describe('PLANT_ID_SCHEMA', () => {
    it('accepts a UUID', () => {
        expect(PLANT_ID_SCHEMA.parse('123e4567-e89b-42d3-a456-426614174000')).toBe('123e4567-e89b-42d3-a456-426614174000');
    });

    it('rejects a non-UUID id', () => {
        expect(() => {
            return PLANT_ID_SCHEMA.parse('plant-1');
        }).toThrow();
    });
});

describe('UpdatePlantSchema', () => {
    it('accepts a nickname and care schedule', () => {
        expect(UpdatePlantSchema.parse({
            nickname: 'Fern',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        })).toEqual({
            nickname: 'Fern',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });
    });

    it('rejects an empty nickname', () => {
        expect(() => {
            return UpdatePlantSchema.parse({
                nickname: '',
                care: {
                    waterEveryDays: 7,
                    fertilizeEveryDays: 30,
                    repotEveryMonths: 18
                }
            });
        }).toThrow();
    });
});

describe('NotifiedAtSchema', () => {
    it('accepts a non-negative integer', () => {
        expect(NotifiedAtSchema.parse(1_700_000_000_000)).toBe(1_700_000_000_000);
    });

    it('rejects a float', () => {
        expect(() => {
            return NotifiedAtSchema.parse(1.5);
        }).toThrow();
    });

    it('rejects a negative timestamp', () => {
        expect(() => {
            return NotifiedAtSchema.parse(-1);
        }).toThrow();
    });
});

describe('plant mutations', () => {
    beforeEach(() => {
        mockDelete.mockReset();
        mockInsert.mockReset();
        mockSelect.mockReset();
        mockUpdate.mockReset();
        mockGetPlantPhoto.mockReset();
        mockGetPlantsForUser.mockReset();
    });

    it('listPlants returns the plants loaded for the user', async () => {
        const plant = makePlant({
            nickname: 'Fern'
        });

        mockGetPlantsForUser.mockResolvedValue([plant]);

        await expect(listPlants('user-1')).resolves.toEqual([plant]);
        expect(mockGetPlantsForUser).toHaveBeenCalledWith('user-1');
    });

    it('readPlantPhoto returns the stored photo bytes', async () => {
        mockGetPlantPhoto.mockResolvedValue(Buffer.from('leaf'));

        await expect(readPlantPhoto('user-1', 'plant-1')).resolves.toEqual(Buffer.from('leaf'));
        expect(mockGetPlantPhoto).toHaveBeenCalledWith('user-1', 'plant-1');
    });

    it('createPlant stores the uploaded photo bytes, the given lastCare and the pot diameter', async () => {
        const insertChain = mockInsertChain();

        mockInsert.mockReturnValueOnce(insertChain);

        const id = await createPlant('user-1', {
            nickname: 'Fern',
            species: 'Nephrolepis exaltata',
            commonName: '',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: NOW,
            lastCare: {
                [CareKind.Water]: NOW
            },
            photo: new Blob(['leaf']),
            potDiameter: 10.5
        });

        expect(id).toBe('generated-id');
        expect(insertChain.values).toHaveBeenCalledWith({
            userId: 'user-1',
            nickname: 'Fern',
            species: 'Nephrolepis exaltata',
            commonName: '',
            acquiredAt: NOW,
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            lastCare: {
                [CareKind.Water]: NOW
            },
            lastNotified: {},
            notes: '',
            photo: Buffer.from('leaf'),
            potDiameter: 10.5
        });
    });

    it('createPlant stores an empty lastCare and no photo when both are omitted', async () => {
        const insertChain = mockInsertChain();

        mockInsert.mockReturnValueOnce(insertChain);

        await createPlant('user-1', {
            nickname: 'Fern',
            species: 'Nephrolepis exaltata',
            commonName: '',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: NOW
        });

        expect(insertChain.values).toHaveBeenCalledWith({
            userId: 'user-1',
            nickname: 'Fern',
            species: 'Nephrolepis exaltata',
            commonName: '',
            acquiredAt: NOW,
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            lastCare: {},
            lastNotified: {},
            notes: '',
            photo: undefined,
            potDiameter: undefined
        });
    });

    it('updatePlant writes the nickname and care scoped to the user', async () => {
        const where = vi.fn();
        const set = vi.fn(() => {
            return {
                where
            };
        });

        mockUpdate.mockReturnValueOnce({
            set
        });

        await updatePlant('user-1', 'plant-1', {
            nickname: 'Fern',
            care: {
                waterEveryDays: 5,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });

        expect(set).toHaveBeenCalledWith({
            nickname: 'Fern',
            care: {
                waterEveryDays: 5,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });
        expect(where).toHaveBeenCalledTimes(1);
    });

    it('markCareDone merges the kind into the stored lastCare', async () => {
        const where = vi.fn();
        const set = vi.fn(() => {
            return {
                where
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([{
            lastCare: {
                [CareKind.Water]: NOW - 1_000_000
            }
        }]));
        mockUpdate.mockReturnValueOnce({
            set
        });

        await markCareDone('user-1', 'plant-1', CareKind.Water);

        expect(set).toHaveBeenCalledWith({
            lastCare: {
                [CareKind.Water]: expect.any(Number)
            }
        });
        expect(where).toHaveBeenCalledTimes(1);
    });

    it('markCareDone skips the write when the plant row is missing', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([]));

        await markCareDone('user-1', 'plant-1', CareKind.Water);

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('recordNotified merges the kind into the stored lastNotified', async () => {
        const where = vi.fn();
        const set = vi.fn(() => {
            return {
                where
            };
        });

        mockSelect.mockReturnValueOnce(mockSelectChain([{
            lastNotified: {}
        }]));
        mockUpdate.mockReturnValueOnce({
            set
        });

        await recordNotified('user-1', 'plant-1', CareKind.Fertilize, NOW);

        expect(set).toHaveBeenCalledWith({
            lastNotified: {
                [CareKind.Fertilize]: NOW
            }
        });
        expect(where).toHaveBeenCalledTimes(1);
    });

    it('recordNotified skips the write when the plant row is missing', async () => {
        mockSelect.mockReturnValueOnce(mockSelectChain([]));

        await recordNotified('user-1', 'plant-1', CareKind.Fertilize, NOW);

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('deletePlant deletes the plant row', async () => {
        const removalChain = mockDeleteChain();

        mockDelete.mockReturnValueOnce(removalChain);

        await deletePlant('user-1', 'plant-1');

        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(removalChain.where).toHaveBeenCalledTimes(1);
    });
});
