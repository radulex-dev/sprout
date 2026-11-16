import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';

// Mocks
import { VERIFIED_SESSION } from '@test/vitest/data/session.mock';

// Services
import { AiCapReachedError, AiRequestError, AiUnavailableError } from '@/services/server/ai';
import { getCareIntervals, getWaterAmount } from '@/services/server/care-profile';
import { createPlant as serviceCreatePlant, deletePlant as serviceDeletePlant, markCareDone as serviceMarkCareDone, recordNotified as serviceRecordNotified, updatePlant as serviceUpdatePlant } from '@/services/server/plants';

// Database
import { createPlant, deletePlant, loadCareIntervals, loadWaterAmount, markCareDone, recordNotified, updatePlant } from './index';

// Auth
import { UnverifiedEmailError } from '@/lib/auth/errors';
import { requireUser, requireVerifiedUser } from '@/lib/auth/session';

// Types
import { CareProfileStatus } from './types';
import { CareKind, CareProfileConfidence } from '@/types';

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

vi.mock('@/services/server/care-profile', () => {
    return {
        getCareIntervals: vi.fn(),
        getWaterAmount: vi.fn()
    };
});

vi.mock('@/lib/auth/session', () => {
    return {
        requireUser: vi.fn(),
        requireVerifiedUser: vi.fn()
    };
});

vi.mock('next/cache', () => {
    return {
        revalidatePath: vi.fn()
    };
});

beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(VERIFIED_SESSION);
    vi.mocked(requireVerifiedUser).mockResolvedValue(VERIFIED_SESSION);
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
                waterEveryDaysSpring: 29,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000
        })).rejects.toThrow();

        expect(serviceCreatePlant).not.toHaveBeenCalled();
    });

    it('rejects an unverified session before calling the service', async () => {
        vi.mocked(requireVerifiedUser).mockRejectedValue(new UnverifiedEmailError());

        await expect(createPlant({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000
        })).rejects.toBeInstanceOf(UnverifiedEmailError);

        expect(requireVerifiedUser).toHaveBeenCalledTimes(1);
        expect(serviceCreatePlant).not.toHaveBeenCalled();
    });

    it('validates, delegates, revalidates, and returns the id', async () => {
        const id = await createPlant({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000
        });

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', {
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000
        });
        expect(id).toBe('plant-1');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('forwards lastCare timestamps to the service', async () => {
        const lastCare = {
            [CareKind.Water]: 1699000000000,
            [CareKind.Fertilize]: 1699000000000
        };

        await createPlant({
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000,
            lastCare
        });

        expect(serviceCreatePlant).toHaveBeenCalledWith('user-1', {
            nickname: 'Kitchen monstera',
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            acquiredAt: 1700000000000,
            lastCare
        });
    });
});

describe('updatePlant', () => {
    it('rejects an invalid id before calling the service', async () => {
        await expect(updatePlant('not-a-uuid', {
            nickname: 'Fern',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
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
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });

        expect(serviceUpdatePlant).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', {
            nickname: 'Fern',
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
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
        await markCareDone('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1699000000000);

        expect(serviceMarkCareDone).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1699000000000);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it.each([
        9999999999999,
        1699000000000.5,
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
        await recordNotified('123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1700000000000);

        expect(serviceRecordNotified).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174000', CareKind.Water, 1700000000000);
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

describe('loadCareIntervals', () => {
    beforeEach(() => {
        vi.mocked(getCareIntervals).mockResolvedValue({
            waterSpring: 7,
            waterSummer: 7,
            waterAutumn: 7,
            waterWinter: 7,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            confidence: CareProfileConfidence.High
        });
    });

    it('maps the intervals to a schedule with a zero amount and forwards the trimmed species', async () => {
        const result = await loadCareIntervals({
            species: '  Monstera deliciosa  '
        });

        expect(getCareIntervals).toHaveBeenCalledWith({
            userId: 'user-1',
            species: 'Monstera deliciosa'
        });
        expect(result).toEqual({
            status: CareProfileStatus.Ok,
            care: {
                waterEveryDaysSpring: 7,
                waterEveryDaysSummer: 7,
                waterEveryDaysAutumn: 7,
                waterEveryDaysWinter: 7,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });
        expect(result).not.toHaveProperty('error');
    });

    it('rejects malformed input before calling the service', async () => {
        await expect(loadCareIntervals({
            species: ' '.repeat(3)
        })).rejects.toThrow();

        expect(getCareIntervals).not.toHaveBeenCalled();
    });

    it('propagates a redirect from the guard', async () => {
        vi.mocked(requireVerifiedUser).mockRejectedValue(new Error('NEXT_REDIRECT'));

        await expect(loadCareIntervals({
            species: 'Monstera deliciosa'
        })).rejects.toThrow('NEXT_REDIRECT');

        expect(getCareIntervals).not.toHaveBeenCalled();
    });

    it('answers capped without a message when the daily limit is reached', async () => {
        vi.mocked(getCareIntervals).mockRejectedValue(new AiCapReachedError());

        await expect(loadCareIntervals({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Capped
        });
    });

    it('answers unavailable when the provider is not configured', async () => {
        vi.mocked(getCareIntervals).mockRejectedValue(new AiUnavailableError());

        await expect(loadCareIntervals({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Unavailable
        });
    });

    it('answers unavailable and warns when the request fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

        vi.mocked(getCareIntervals).mockRejectedValue(new AiRequestError('AI request failed.', 502));

        await expect(loadCareIntervals({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Unavailable
        });
        expect(warn).toHaveBeenCalledWith('Care intervals request failed', 502);
    });
});

describe('loadWaterAmount', () => {
    beforeEach(() => {
        vi.mocked(getWaterAmount).mockResolvedValue(80);
    });

    it('returns the amount and forwards the trimmed species and soil volume', async () => {
        const result = await loadWaterAmount({
            species: '  Monstera deliciosa  ',
            soilVolumeMl: 1500
        });

        expect(getWaterAmount).toHaveBeenCalledWith({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: 1500
        });
        expect(result).toEqual({
            status: CareProfileStatus.Ok,
            waterAmountMl: 80
        });
        expect(result).not.toHaveProperty('error');
    });

    it('forwards an absent soil volume', async () => {
        await loadWaterAmount({
            species: 'Monstera deliciosa'
        });

        expect(getWaterAmount).toHaveBeenCalledWith({
            userId: 'user-1',
            species: 'Monstera deliciosa',
            soilVolumeMl: undefined
        });
    });

    it('rejects malformed input before calling the service', async () => {
        await expect(loadWaterAmount({
            species: ' '.repeat(3)
        })).rejects.toThrow();

        expect(getWaterAmount).not.toHaveBeenCalled();
    });

    it.each([{
        soilVolumeMl: 0
    }, {
        soilVolumeMl: 1000001
    }])('rejects the soil volume $soilVolumeMl before calling the service', async ({ soilVolumeMl }) => {
        await expect(loadWaterAmount({
            species: 'Monstera deliciosa',
            soilVolumeMl
        })).rejects.toThrow();

        expect(getWaterAmount).not.toHaveBeenCalled();
    });

    it('propagates a redirect from the guard', async () => {
        vi.mocked(requireVerifiedUser).mockRejectedValue(new Error('NEXT_REDIRECT'));

        await expect(loadWaterAmount({
            species: 'Monstera deliciosa'
        })).rejects.toThrow('NEXT_REDIRECT');

        expect(getWaterAmount).not.toHaveBeenCalled();
    });

    it('answers capped without a message when the daily limit is reached', async () => {
        vi.mocked(getWaterAmount).mockRejectedValue(new AiCapReachedError());

        await expect(loadWaterAmount({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Capped
        });
    });

    it('answers unavailable when the provider is not configured', async () => {
        vi.mocked(getWaterAmount).mockRejectedValue(new AiUnavailableError());

        await expect(loadWaterAmount({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Unavailable
        });
    });

    it('answers unavailable and warns when the request fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

        vi.mocked(getWaterAmount).mockRejectedValue(new AiRequestError('AI request failed.', 502));

        await expect(loadWaterAmount({
            species: 'Monstera deliciosa'
        })).resolves.toEqual({
            status: CareProfileStatus.Unavailable
        });
        expect(warn).toHaveBeenCalledWith('Water amount request failed', 502);
    });
});
