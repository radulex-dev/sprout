import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';

// Services
import { createPlant as serviceCreatePlant, deletePlant as serviceDeletePlant, markCareDone as serviceMarkCareDone, recordNotified as serviceRecordNotified, updatePlant as serviceUpdatePlant } from '@/services/server/plants';

// Database
import { createPlant, deletePlant, markCareDone, recordNotified, updatePlant } from './index';

// Types
import { CareKind } from '@/types';

vi.mock('@/services/server/plants', () => {
    return {
        createPlant: vi.fn(),
        updatePlant: vi.fn(),
        markCareDone: vi.fn(),
        recordNotified: vi.fn(),
        deletePlant: vi.fn(),
        listPlants: vi.fn(),
        findPlant: vi.fn(),
        readPlantPhoto: vi.fn()
    };
});

vi.mock('@/lib/auth/session', () => {
    return {
        requireUser: () => {
            return Promise.resolve({
                user: {
                    id: 'user-1'
                }
            });
        }
    };
});

vi.mock('next/cache', () => {
    return {
        revalidatePath: vi.fn()
    };
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serviceCreatePlant).mockResolvedValue('plant-1');
    vi.mocked(serviceUpdatePlant).mockResolvedValue(undefined);
    vi.mocked(serviceMarkCareDone).mockResolvedValue(undefined);
    vi.mocked(serviceRecordNotified).mockResolvedValue(undefined);
    vi.mocked(serviceDeletePlant).mockResolvedValue(undefined);
});

describe('createPlant', () => {
    it('rejects malformed input before calling the service', async () => {
        await expect(createPlant({
            nickname: '',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1_700_000_000_000
        })).rejects.toThrow();

        expect(serviceCreatePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, revalidates, and returns the id', async () => {
        const id = await createPlant({
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

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', {
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
        expect(id).toBe('plant-1');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('forwards lastCare timestamps to the service', async () => {
        const lastCare = {
            [CareKind.Water]: 1_699_000_000_000,
            [CareKind.Fertilize]: 1_699_000_000_000
        };

        await createPlant({
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
        });

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', {
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
        });
    });
});

describe('updatePlant', () => {
    it('rejects an invalid id before calling the service', async () => {
        await expect(updatePlant('not-a-uuid', {
            nickname: 'Fern',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        })).rejects.toThrow();

        expect(serviceUpdatePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await updatePlant('123e4567-e89b-42d3-a456-426614174000', {
            nickname: 'Fern',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });

        expect(serviceUpdatePlant).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', {
            nickname: 'Fern',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
});

describe('markCareDone', () => {
    it('rejects an invalid kind before calling the service', async () => {
        await expect(markCareDone('123e4567-e89b-42d3-a456-426614174000', 'sun' as unknown as CareKind)).rejects.toThrow();

        expect(serviceMarkCareDone).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await markCareDone('123e4567-e89b-42d3-a456-426614174000', CareKind.Water);

        expect(serviceMarkCareDone).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', CareKind.Water);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('omits at so the service applies its own default', async () => {
        await markCareDone('123e4567-e89b-42d3-a456-426614174000', CareKind.Water);

        expect(vi.mocked(serviceMarkCareDone).mock.calls.at(0)).toHaveLength(3);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('forwards an explicit at timestamp to the service', async () => {
        await markCareDone('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1_699_000_000_000);

        expect(serviceMarkCareDone).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1_699_000_000_000);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it.each([
        9_999_999_999_999,
        1_699_000_000_000.5,
        -1
    ])('rejects the timestamp %s before calling the service', async (at) => {
        await expect(markCareDone('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, at)).rejects.toThrow();

        expect(serviceMarkCareDone).not.toHaveBeenCalled();
    });
});

describe('recordNotified', () => {
    it('rejects a negative timestamp before calling the service', async () => {
        await expect(recordNotified('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, -1)).rejects.toThrow();

        expect(serviceRecordNotified).not.toHaveBeenCalled();
    });

    it('validates and delegates without revalidating', async () => {
        await recordNotified('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1_700_000_000_000);

        expect(serviceRecordNotified).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1_700_000_000_000);
        expect(revalidatePath).not.toHaveBeenCalled();
    });
});

describe('deletePlant', () => {
    it('rejects an invalid id before calling the service', async () => {
        await expect(deletePlant('not-a-uuid')).rejects.toThrow();

        expect(serviceDeletePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await deletePlant('123e4567-e89b-42d3-a456-426614174000');

        expect(serviceDeletePlant).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
});
