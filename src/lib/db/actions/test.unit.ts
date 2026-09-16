import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';

// Services
import { createPlant as serviceCreatePlant, deletePlant as serviceDeletePlant, markCareDone as serviceMarkCareDone, recordNotified as serviceRecordNotified, updatePlant as serviceUpdatePlant } from '@/services/server/plants';

// Database
import { createPlant, deletePlant, markCareDone, recordNotified, updatePlant } from './index';

// Types
import { CareKind, type PlantInput } from '@/types';

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

const VALID_CARE = {
    waterEveryDays: 7,
    fertilizeEveryDays: 30,
    repotEveryMonths: 18
};

const VALID_INPUT: PlantInput = {
    nickname: 'Kitchen monstera',
    species: 'Monstera deliciosa',
    commonName: 'Swiss cheese plant',
    care: VALID_CARE,
    acquiredAt: 1_700_000_000_000
};

const VALID_ID = '123e4567-e89b-42d3-a456-426614174000';

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
            ...VALID_INPUT,
            nickname: ''
        })).rejects.toThrow();

        expect(serviceCreatePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, revalidates, and returns the id', async () => {
        const id = await createPlant(VALID_INPUT);

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', VALID_INPUT);
        expect(id).toBe('plant-1');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('forwards lastCare timestamps to the service', async () => {
        const lastCare = {
            [CareKind.Water]: 1_699_000_000_000,
            [CareKind.Fertilize]: 1_699_000_000_000
        };

        await createPlant({
            ...VALID_INPUT,
            lastCare
        });

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', {
            ...VALID_INPUT,
            lastCare
        });
    });
});

describe('updatePlant', () => {
    it('rejects an invalid id before calling the service', async () => {
        await expect(updatePlant('not-a-uuid', {
            nickname: 'Fern',
            care: VALID_CARE
        })).rejects.toThrow();

        expect(serviceUpdatePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await updatePlant(VALID_ID, {
            nickname: 'Fern',
            care: VALID_CARE
        });

        expect(serviceUpdatePlant).toHaveBeenCalledWith('user-1', VALID_ID, {
            nickname: 'Fern',
            care: VALID_CARE
        });
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
});

describe('markCareDone', () => {
    it('rejects an invalid kind before calling the service', async () => {
        await expect(markCareDone(VALID_ID, 'sun' as unknown as CareKind)).rejects.toThrow();

        expect(serviceMarkCareDone).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await markCareDone(VALID_ID, CareKind.Water);

        expect(serviceMarkCareDone).toHaveBeenCalledWith('user-1', VALID_ID, CareKind.Water);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
});

describe('recordNotified', () => {
    it('rejects a negative timestamp before calling the service', async () => {
        await expect(recordNotified(VALID_ID, CareKind.Water, -1)).rejects.toThrow();

        expect(serviceRecordNotified).not.toHaveBeenCalled();
    });

    it('validates and delegates without revalidating', async () => {
        await recordNotified(VALID_ID, CareKind.Water, 1_700_000_000_000);

        expect(serviceRecordNotified).toHaveBeenCalledWith('user-1', VALID_ID, CareKind.Water, 1_700_000_000_000);
        expect(revalidatePath).not.toHaveBeenCalled();
    });
});

describe('deletePlant', () => {
    it('rejects an invalid id before calling the service', async () => {
        await expect(deletePlant('not-a-uuid')).rejects.toThrow();

        expect(serviceDeletePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, and revalidates', async () => {
        await deletePlant(VALID_ID);

        expect(serviceDeletePlant).toHaveBeenCalledWith('user-1', VALID_ID);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
});
