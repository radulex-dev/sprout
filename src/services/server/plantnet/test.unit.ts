import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { MAX_PHOTO_BYTES } from '@/helpers/image/constants';
import { HttpStatus } from '@/lib/http/constants';
import { ERROR_BAD_IMAGE, ERROR_BAD_KEY, ERROR_IMAGE_TOO_LARGE, ERROR_NO_IMAGE, ERROR_NO_KEY, ERROR_NOT_RECOGNISED, ERROR_UNAVAILABLE, ERROR_UNREACHABLE } from './constants';

// Helpers
import type { CareReference } from '@/helpers/care/types';

// Services
import { identifySpecies, PlantNetError, readIdentifyForm } from './index';

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

describe('plantnet', () => {
    describe('identifySpecies', () => {
        let fetchMock: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);
            vi.stubEnv('PLANTNET_API_KEY', 'env-test-key');
            mockLoadCareReference.mockResolvedValue({
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
            });
        });

        it('rejects with 400 when no image is provided', async () => {
            const error = await capturePlantNetError(identifySpecies(new FormData()));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_NO_IMAGE);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('rejects with 400 when no key is configured', async () => {
            vi.stubEnv('PLANTNET_API_KEY', '');

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_NO_KEY);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('rejects with 413 when the image exceeds the photo size cap', async () => {
            const form = new FormData();
            form.append('images', new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.PayloadTooLarge);
            expect(error.message).toBe(ERROR_IMAGE_TOO_LARGE);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('maps a 401 to a bad-key 400', async () => {
            fetchMock.mockResolvedValue(mockResponse({}, 401));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_BAD_KEY);
        });

        it('maps a 404 to a not-recognised 400', async () => {
            fetchMock.mockResolvedValue(mockResponse({}, 404));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_NOT_RECOGNISED);
        });

        it('maps any other HTTP failure to a 502', async () => {
            fetchMock.mockResolvedValue(mockResponse({}, 500));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadGateway);
            expect(error.message).toBe(ERROR_UNAVAILABLE);
        });

        it('logs the upstream message when a 502 has a body', async () => {
            vi.spyOn(console, 'error').mockImplementation(vi.fn());

            fetchMock.mockResolvedValue(mockResponse({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'upstream boom'
            }, 500));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadGateway);
            expect(error.message).toBe(ERROR_UNAVAILABLE);
            expect(console.error).toHaveBeenCalledWith('PlantNet request failed', 500, 'upstream boom');
        });

        it('throws friendly copy and logs the PlantNet detail when it rejects the image', async () => {
            vi.spyOn(console, 'error').mockImplementation(vi.fn());

            fetchMock.mockResolvedValue(mockResponse({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Unsupported file type for image[0] (jpeg or png)'
            }, 400));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_BAD_IMAGE);
            expect(console.error).toHaveBeenCalledWith('PlantNet request failed', 400, 'Unsupported file type for image[0] (jpeg or png)');
        });

        it('falls back to a generic message when a 400 has no body', async () => {
            fetchMock.mockResolvedValue(mockResponse({}, 400));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadRequest);
            expect(error.message).toBe(ERROR_BAD_IMAGE);
        });

        it('maps a network throw to a 502 unreachable error', async () => {
            fetchMock.mockRejectedValue(new Error('socket hang up'));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const error = await capturePlantNetError(identifySpecies(form));

            expect(error.httpStatus).toBe(HttpStatus.BadGateway);
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

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const results = await identifySpecies(form);
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

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const [identified] = await identifySpecies(form);

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

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const [identified] = await identifySpecies(form);

            expect(identified.defaultCare).toEqual({
                waterEveryDays: 6,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            });
            expect(identified.careSource).toBe(CareSource.Family);
        });

        it('warns with the identification when no care data matches', async () => {
            vi.spyOn(console, 'warn').mockImplementation(vi.fn());

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

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const [identified] = await identifySpecies(form);

            expect(identified.careSource).toBe(CareSource.None);
            expect(console.warn).toHaveBeenCalledWith('No care data for identified plant', {
                family: 'Unknownaceae',
                genus: 'Unknownia',
                species: 'Ficus unknownia'
            });
        });

        it('does not warn when the genus resolves', async () => {
            vi.spyOn(console, 'warn').mockImplementation(vi.fn());

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

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const [identified] = await identifySpecies(form);

            expect(identified.careSource).toBe(CareSource.Genus);
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('returns an empty list when PlantNet omits results', async () => {
            fetchMock.mockResolvedValue(mockResponse({}, 200));

            const form = new FormData();
            form.append('images', new File(['leaf'], 'plant.jpg', {
                type: 'image/jpeg'
            }));

            const results = await identifySpecies(form);

            expect(results).toEqual([]);
        });
    });

    describe('readIdentifyForm', () => {
        it('parses a request body under the cap into a form', async () => {
            const boundary = 'sprout-test-boundary';
            const multipart = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="plant.jpg"\r\nContent-Type: image/jpeg\r\n\r\nleaf\r\n--${boundary}--\r\n`;

            const form = await readIdentifyForm(new Request('http://localhost/api/identify', {
                method: 'POST',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`
                },
                body: multipart
            }));
            const image = form.get('images') as File;

            expect(image.name).toBe('plant.jpg');
            expect(image.size).toBe(4);
        });

        it('rejects with 413 when a body without a content-length exceeds the cap', async () => {
            const chunk = new Uint8Array(1024 * 1024);
            let reads = 0;
            const request = {
                headers: {
                    get: () => {
                        return '';
                    }
                },
                body: {
                    getReader: () => {
                        return {
                            read: () => {
                                reads += 1;

                                if (reads > 6) {
                                    return Promise.resolve({
                                        done: true
                                    });
                                }

                                return Promise.resolve({
                                    done: false,
                                    value: chunk
                                });
                            },
                            cancel: () => {
                                return Promise.resolve();
                            }
                        };
                    }
                }
            } as unknown as Request;

            const error = await capturePlantNetError(readIdentifyForm(request));

            expect(error.httpStatus).toBe(HttpStatus.PayloadTooLarge);
            expect(error.message).toBe(ERROR_IMAGE_TOO_LARGE);
        });
    });
});
