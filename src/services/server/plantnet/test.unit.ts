import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { ERROR_BAD_IMAGE, ERROR_BAD_KEY, ERROR_NO_IMAGE, ERROR_NO_KEY, ERROR_NOT_RECOGNISED, ERROR_UNAVAILABLE, ERROR_UNREACHABLE } from './constants';

// Helpers
import type { CareReference } from '@/helpers/care/types';

// Services
import { identifySpecies, PlantNetError } from './index';

// Types
import { CareSource } from '@/types';

const mockLoadCareReference = vi.hoisted(() => {
    return vi.fn<() => Promise<CareReference>>();
});

vi.mock('@/services/server/care-reference', () => {
    return {
        loadCareReference: mockLoadCareReference
    };
});

const API_KEY = 'env-test-key';

const careReference: CareReference = {
    alias: {
        'dracaena trifasciata': 'sansevieria'
    },
    family: {
        urticaceae: {
            waterEveryDays: 6,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        }
    },
    genus: {
        dracaena: {
            waterEveryDays: 10,
            fertilizeEveryDays: 30,
            repotEveryMonths: 30
        },
        monstera: {
            waterEveryDays: 5,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        },
        sansevieria: {
            waterEveryDays: 21,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        }
    }
};

const imageForm = (): FormData => {
    const form = new FormData();
    form.append('images', new File(['leaf'], 'plant.jpg', {
        type: 'image/jpeg'
    }));

    return form;
};

const emptyForm = (): FormData => {
    return new FormData();
};

const mockResponse = (body: unknown, status: number): Response => {
    const isOk = status >= 200 && status < 300;

    return {
        ok: isOk,
        status,
        json: () => {
            return Promise.resolve(body);
        }
    } as unknown as Response;
};

const capturePlantNetError = async (promise: Promise<unknown>): Promise<PlantNetError> => {
    try {
        await promise;
    } catch (error) {
        if (error instanceof PlantNetError) {
            return error;
        }

        throw error;
    }

    throw new Error('Expected identifySpecies to reject.');
};

describe('identifySpecies', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        vi.stubEnv('PLANTNET_API_KEY', API_KEY);
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
        mockLoadCareReference.mockResolvedValue(careReference);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('rejects with 400 when no image is provided', async () => {
        const error = await capturePlantNetError(identifySpecies(emptyForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_NO_IMAGE);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects with 400 when no key is configured', async () => {
        vi.stubEnv('PLANTNET_API_KEY', '');

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_NO_KEY);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maps a 401 to a bad-key 400', async () => {
        fetchMock.mockResolvedValue(mockResponse({}, 401));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_BAD_KEY);
    });

    it('maps a 404 to a not-recognised 400', async () => {
        fetchMock.mockResolvedValue(mockResponse({}, 404));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_NOT_RECOGNISED);
    });

    it('maps any other HTTP failure to a 502', async () => {
        fetchMock.mockResolvedValue(mockResponse({}, 500));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(502);
        expect(error.message).toBe(ERROR_UNAVAILABLE);
    });

    it('logs the upstream message when a 502 has a body', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'upstream boom'
        }, 500));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(502);
        expect(error.message).toBe(ERROR_UNAVAILABLE);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith('PlantNet request failed', 500, 'upstream boom');
    });

    it('throws friendly copy and logs the PlantNet detail when it rejects the image', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Unsupported file type for image[0] (jpeg or png)'
        }, 400));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_BAD_IMAGE);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith('PlantNet request failed', 400, 'Unsupported file type for image[0] (jpeg or png)');
    });

    it('falls back to a generic message when a 400 has no body', async () => {
        fetchMock.mockResolvedValue(mockResponse({}, 400));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(400);
        expect(error.message).toBe(ERROR_BAD_IMAGE);
    });

    it('maps a network throw to a 502 unreachable error', async () => {
        fetchMock.mockRejectedValue(new Error('socket hang up'));

        const error = await capturePlantNetError(identifySpecies(imageForm()));

        expect(error.httpStatus).toBe(502);
        expect(error.message).toBe(ERROR_UNREACHABLE);
    });

    it('maps PlantNet results to IdentifyResult with resolved care', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            results: [{
                species: {
                    scientificNameWithoutAuthor: 'Monstera deliciosa',
                    genus: {
                        scientificNameWithoutAuthor: 'Monstera'
                    },
                    family: {
                        scientificNameWithoutAuthor: 'Araceae'
                    },
                    commonNames: ['Swiss cheese plant']
                },
                score: 0.93
            }, {
                species: undefined,
                score: undefined
            }]
        }, 200));

        const results = await identifySpecies(imageForm());
        const [identified, unknown] = results;

        expect(mockLoadCareReference).toHaveBeenCalledTimes(1);
        expect(results).toHaveLength(2);
        expect(identified).toEqual({
            species: 'Monstera deliciosa',
            commonName: 'Swiss cheese plant',
            confidence: 0.93,
            defaultCare: {
                waterEveryDays: 5,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            careSource: CareSource.Genus
        });
        expect(unknown).toEqual({
            species: 'Unknown species',
            commonName: '',
            confidence: 0,
            defaultCare: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            careSource: CareSource.None
        });
    });

    it('resolves the current botanical name through its genus alias', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            results: [{
                species: {
                    scientificNameWithoutAuthor: 'Dracaena trifasciata',
                    genus: {
                        scientificNameWithoutAuthor: 'Dracaena'
                    },
                    family: {
                        scientificNameWithoutAuthor: 'Asparagaceae'
                    },
                    commonNames: ['Snake plant']
                },
                score: 0.88
            }]
        }, 200));

        const [identified] = await identifySpecies(imageForm());

        expect(identified.defaultCare).toEqual({
            waterEveryDays: 21,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        });
        expect(identified.careSource).toBe(CareSource.Genus);
    });

    it('falls back to the family care when the genus is not in the table', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            results: [{
                species: {
                    scientificNameWithoutAuthor: 'Soleirolia soleirolii',
                    genus: {
                        scientificNameWithoutAuthor: 'Soleirolia'
                    },
                    family: {
                        scientificNameWithoutAuthor: 'Urticaceae'
                    }
                },
                score: 0.71
            }]
        }, 200));

        const [identified] = await identifySpecies(imageForm());

        expect(identified.defaultCare).toEqual({
            waterEveryDays: 6,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        });
        expect(identified.careSource).toBe(CareSource.Family);
    });

    it('warns with the identification when no care data matches', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            results: [{
                species: {
                    scientificNameWithoutAuthor: 'Ficus unknownia',
                    genus: {
                        scientificNameWithoutAuthor: 'Unknownia'
                    },
                    family: {
                        scientificNameWithoutAuthor: 'Unknownaceae'
                    }
                },
                score: 0.42
            }]
        }, 200));

        const [identified] = await identifySpecies(imageForm());

        expect(identified.careSource).toBe(CareSource.None);
        expect(vi.mocked(console.warn)).toHaveBeenCalledWith('No care data for identified plant', {
            family: 'Unknownaceae',
            genus: 'Unknownia',
            species: 'Ficus unknownia'
        });
    });

    it('does not warn when the genus resolves', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            results: [{
                species: {
                    scientificNameWithoutAuthor: 'Monstera deliciosa',
                    genus: {
                        scientificNameWithoutAuthor: 'Monstera'
                    },
                    family: {
                        scientificNameWithoutAuthor: 'Araceae'
                    }
                },
                score: 0.93
            }]
        }, 200));

        const [identified] = await identifySpecies(imageForm());

        expect(identified.careSource).toBe(CareSource.Genus);
        expect(vi.mocked(console.warn)).not.toHaveBeenCalled();
    });

    it('returns an empty list when PlantNet omits results', async () => {
        fetchMock.mockResolvedValue(mockResponse({}, 200));

        const results = await identifySpecies(imageForm());

        expect(results).toEqual([]);
    });
});
