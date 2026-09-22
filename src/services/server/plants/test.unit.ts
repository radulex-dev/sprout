import { describe, expect, it } from 'vitest';

// Constants
import { PLANT_ID_SCHEMA } from '@/lib/db/constants';

// Services
import { CareKindSchema, CareScheduleSchema, LastCareSchema, NotifiedAtSchema, PlantInputSchema, UpdatePlantSchema } from './schema';

// Types
import { CareKind } from '@/types';

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
