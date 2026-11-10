import * as z from 'zod';
import { SQL } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { AI_DAILY_CALL_LIMIT_KEY, AI_SCHEMA_NAME, ERROR_CAP_REACHED, ERROR_INVALID_RESPONSE, ERROR_NOT_CONFIGURED, ERROR_REFUSED, ERROR_REQUEST_FAILED } from './constants';

// Helpers
import { buildDayBucket, isAiConfiguredEnvironment, resolveStructuredMode } from './helpers';

// Services
import { AiCapReachedError, AiRequestError, AiUnavailableError, claimAiUsage, isAiConfigured, requestStructured } from './index';

// Database
import { aiUsage } from '@/lib/db/schema';

// Types
import { StructuredMode } from './types';

const { mockInsert, usageStore } = vi.hoisted(() => {
    return {
        mockInsert: vi.fn(),
        usageStore: new Map<string, number>()
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            insert: mockInsert
        }
    };
});

const jsonResponse = (body: unknown, status = 200): Response => {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => {
            return Promise.resolve(body);
        }
    } as unknown as Response;
};

const captureError = async (promise: Promise<unknown>): Promise<unknown> => {
    try {
        await promise;
    } catch (caught) {
        return caught;
    }

    throw new TypeError('Expected requestStructured to reject.');
};

const readSentBody = (fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> => {
    const call = fetchMock.mock.calls.at(0) as [string, RequestInit] | undefined;

    if (!call) {
        throw new TypeError('Expected fetch to have been called.');
    }

    const [, requestInit] = call;
    const serialized = requestInit.body;

    if (typeof serialized !== 'string') {
        throw new TypeError('Expected a JSON string body.');
    }

    return JSON.parse(serialized) as Record<string, unknown>;
};

interface RecordedUsage {
    values: {
        userId: string;
        day: number;
        calls: number;
        createdAt: number;
    };
    conflict: {
        target: unknown[];
        set: {
            calls: SQL;
        };
        setWhere: SQL;
    };
}

const recordedUsage: RecordedUsage[] = [];

const readStatementLimit = (statement: SQL | undefined): number => {
    const numbers = (statement?.queryChunks ?? []).map(Number).filter((value) => {
        return Number.isFinite(value);
    });

    return numbers.at(-1) ?? 0;
};

const stubUsageStore = (): void => {
    usageStore.clear();
    recordedUsage.length = 0;
    mockInsert.mockReset();
    mockInsert.mockImplementation(() => {
        return {
            values: (values: RecordedUsage['values']) => {
                return {
                    onConflictDoUpdate: (conflict: RecordedUsage['conflict']) => {
                        recordedUsage.push({
                            values,
                            conflict
                        });

                        return {
                            returning: () => {
                                const key = `${values.userId}:${values.day}`;
                                const stored = usageStore.get(key) ?? 0;
                                const limit = readStatementLimit(conflict.setWhere);

                                if (stored >= limit) {
                                    return Promise.resolve([]);
                                }

                                const calls = stored + values.calls;

                                usageStore.set(key, calls);

                                return Promise.resolve([{
                                    calls
                                }]);
                            }
                        };
                    }
                };
            }
        };
    });
};

describe('ai', () => {
    beforeEach(() => {
        vi.stubEnv('AI_BASE_URL', 'https://ai.example.test/v1');
        vi.stubEnv('AI_MODEL', 'test-model');
        vi.stubEnv('AI_API_KEY', 'test-key');
        vi.stubEnv('AI_STRUCTURED_MODE', '');
    });

    describe('requestStructured', () => {
        it('throws AiUnavailableError and never calls fetch when unconfigured', async () => {
            const fetchMock = vi.fn();

            vi.stubEnv('AI_API_KEY', '');
            vi.stubGlobal('fetch', fetchMock);

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiUnavailableError);
            expect(error).toMatchObject({
                name: 'AiUnavailableError',
                message: ERROR_NOT_CONFIGURED
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('resolves the validated payload from a strict response', async () => {
            const fetchMock = vi.fn();
            const jsonSchema = {
                type: 'object',
                properties: {
                    answer: {
                        type: 'string'
                    }
                },
                required: ['answer'],
                additionalProperties: false
            };

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: '{"answer":"ok"}'
                    },
                    finish_reason: 'stop'
                }]
            }));

            const result = await requestStructured([{
                role: 'user',
                content: 'Answer.'
            }], jsonSchema, z.object({
                answer: z.string()
            }));

            expect(result).toEqual({
                answer: 'ok'
            });
            expect(fetchMock).toHaveBeenCalledWith('https://ai.example.test/v1/chat/completions', expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-key'
                })
            }));

            const body = readSentBody(fetchMock);

            expect(body.response_format).toEqual({
                type: 'json_schema',
                json_schema: {
                    name: AI_SCHEMA_NAME,
                    strict: true,
                    schema: jsonSchema
                }
            });
        });

        it('sends json_object when best effort is selected by argument', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: '{}'
                    },
                    finish_reason: 'stop'
                }]
            }));

            const result = await requestStructured([], {}, z.object({}), StructuredMode.BestEffort);

            expect(result).toEqual({});

            const body = readSentBody(fetchMock);

            expect(body.response_format).toEqual({
                type: 'json_object'
            });
        });

        it('sends json_object when best effort comes from the environment', async () => {
            const fetchMock = vi.fn();

            vi.stubEnv('AI_STRUCTURED_MODE', 'best-effort');
            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: '{}'
                    },
                    finish_reason: 'stop'
                }]
            }));

            await requestStructured([], {}, z.object({}));

            const body = readSentBody(fetchMock);

            expect(body.response_format).toEqual({
                type: 'json_object'
            });
        });

        it('throws AiRequestError carrying the status on a non-2xx response', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({}, 500));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                status: 500,
                message: ERROR_REQUEST_FAILED
            });
        });

        it('throws AiRequestError when the model refuses', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: ''
                    },
                    finish_reason: 'refusal'
                }]
            }));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_REFUSED
            });
        });

        it('throws AiRequestError when the content is empty', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: ''
                    },
                    finish_reason: 'stop'
                }]
            }));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_INVALID_RESPONSE
            });
        });

        it('throws AiRequestError when the envelope is malformed', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: []
            }));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_INVALID_RESPONSE
            });
        });

        it('throws AiRequestError when the content is not JSON', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: 'not json'
                    },
                    finish_reason: 'stop'
                }]
            }));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_INVALID_RESPONSE
            });
        });

        it('throws AiRequestError when the content fails the caller schema', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: '{"answer":42}'
                    },
                    finish_reason: 'stop'
                }]
            }));

            const error = await captureError(requestStructured([], {}, z.object({
                answer: z.string()
            })));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_INVALID_RESPONSE
            });
        });

        it('attaches an abort timeout signal to the fetch request', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockResolvedValue(jsonResponse({
                choices: [{
                    message: {
                        content: '{}'
                    },
                    finish_reason: 'stop'
                }]
            }));

            await requestStructured([], {}, z.object({}));

            expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                signal: expect.any(AbortSignal)
            }));
        });

        it('surfaces a timeout rejection as AiRequestError', async () => {
            const fetchMock = vi.fn();

            vi.stubGlobal('fetch', fetchMock);
            fetchMock.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_REQUEST_FAILED
            });
        });

        it('surfaces a network rejection as AiRequestError', async () => {
            vi.stubEnv('AI_BASE_URL', 'http://127.0.0.1:1');

            const error = await captureError(requestStructured([], {}, z.object({})));

            expect(error).toBeInstanceOf(AiRequestError);
            expect(error).toMatchObject({
                name: 'AiRequestError',
                message: ERROR_REQUEST_FAILED
            });
        });
    });

    describe('isAiConfigured', () => {
        it('re-reads the environment between calls', () => {
            expect(isAiConfigured()).toBe(true);

            vi.stubEnv('AI_API_KEY', '');

            expect(isAiConfigured()).toBe(false);
        });
    });

    describe('claimAiUsage', () => {
        beforeEach(() => {
            vi.useFakeTimers({
                now: 1700000000000
            });
            stubUsageStore();
        });

        it('claims the first call of the day', async () => {
            await expect(claimAiUsage('user-1')).resolves.toBe(true);
            expect(recordedUsage.at(-1)?.values).toEqual({
                userId: 'user-1',
                day: 19675,
                calls: 1,
                createdAt: 1700000000000
            });
        });

        it('allows the 40th call and rejects the 41st', async () => {
            usageStore.set('user-1:19675', 39);

            await expect(claimAiUsage('user-1')).resolves.toBe(true);

            usageStore.set('user-1:19675', 40);

            await expect(claimAiUsage('user-1')).resolves.toBe(false);
        });

        it('starts a fresh allowance one day later', async () => {
            usageStore.set('user-1:19675', 40);

            await expect(claimAiUsage('user-1')).resolves.toBe(false);

            vi.setSystemTime(1700000000000 + 86400000);

            await expect(claimAiUsage('user-1')).resolves.toBe(true);
            expect(recordedUsage.at(-1)?.values.day).toBe(19676);
        });

        it('holds the cap until the exact UTC day boundary', async () => {
            usageStore.set('user-1:19675', 40);

            vi.setSystemTime(1700006399999);

            await expect(claimAiUsage('user-1')).resolves.toBe(false);

            vi.setSystemTime(1700006400000);

            await expect(claimAiUsage('user-1')).resolves.toBe(true);
            expect(recordedUsage.at(-1)?.values.day).toBe(19676);
        });

        it('applies AI_DAILY_CALL_LIMIT=2 so the third call is rejected', async () => {
            vi.stubEnv(AI_DAILY_CALL_LIMIT_KEY, '2');

            await expect(claimAiUsage('user-1')).resolves.toBe(true);
            await expect(claimAiUsage('user-1')).resolves.toBe(true);
            await expect(claimAiUsage('user-1')).resolves.toBe(false);
        });

        it.each(['abc', '', '0', '-5', '2.5'])('falls back to the default limit for %s', async (raw) => {
            vi.stubEnv(AI_DAILY_CALL_LIMIT_KEY, raw);
            usageStore.set('user-1:19675', 39);

            await expect(claimAiUsage('user-1')).resolves.toBe(true);

            usageStore.set('user-1:19675', 40);

            await expect(claimAiUsage('user-1')).resolves.toBe(false);
        });

        it('re-reads the limit between calls instead of caching it', async () => {
            usageStore.set('user-1:19675', 40);

            await expect(claimAiUsage('user-1')).resolves.toBe(false);

            vi.stubEnv(AI_DAILY_CALL_LIMIT_KEY, '100');

            await expect(claimAiUsage('user-1')).resolves.toBe(true);
        });

        it('claims with one atomic statement carrying the guard', async () => {
            await claimAiUsage('user-1');

            const recorded = recordedUsage.at(0);

            expect(mockInsert).toHaveBeenCalledTimes(1);
            expect(mockInsert).toHaveBeenCalledWith(aiUsage);
            expect(recorded?.values).toEqual({
                userId: 'user-1',
                day: 19675,
                calls: 1,
                createdAt: 1700000000000
            });
            expect(recorded?.conflict.target).toEqual([aiUsage.userId, aiUsage.day]);

            const updateSql = recorded?.conflict.set.calls;

            expect(updateSql).toBeInstanceOf(SQL);
            expect(updateSql?.queryChunks.at(1)).toBe(aiUsage.calls);
            expect(updateSql?.queryChunks.at(-1)).toMatchObject({
                value: [' + 1']
            });

            const guardSql = recorded?.conflict.setWhere;

            expect(guardSql).toBeInstanceOf(SQL);
            expect(guardSql?.queryChunks.at(1)).toBe(aiUsage.calls);
            expect(readStatementLimit(guardSql)).toBe(40);
        });
    });

    describe('errors', () => {
        it('exports the cap error as a named Error', () => {
            const error = new AiCapReachedError();

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('AiCapReachedError');
            expect(error.message).toBe(ERROR_CAP_REACHED);
        });
    });

    describe('helpers', () => {
        describe('resolveStructuredMode', () => {
            it.each([{
                raw: undefined,
                expected: StructuredMode.Strict
            }, {
                raw: '',
                expected: StructuredMode.Strict
            }, {
                raw: 'strict',
                expected: StructuredMode.Strict
            }, {
                raw: 'best-effort',
                expected: StructuredMode.BestEffort
            }])('resolveStructuredMode($raw) yields $expected', ({ raw, expected }) => {
                expect(resolveStructuredMode(raw)).toBe(expected);
            });
        });

        describe('buildDayBucket', () => {
            it.each([{
                now: 0,
                expected: 0
            }, {
                now: 86399999,
                expected: 0
            }, {
                now: 86400000,
                expected: 1
            }])('buildDayBucket($now) yields $expected', ({ now, expected }) => {
                expect(buildDayBucket(now)).toBe(expected);
            });
        });

        describe('isAiConfiguredEnvironment', () => {
            it.each([{
                baseUrl: '',
                model: 'test-model',
                apiKey: 'test-key',
                expected: false
            }, {
                baseUrl: 'https://ai.example.test/v1',
                model: '',
                apiKey: 'test-key',
                expected: false
            }, {
                baseUrl: 'https://ai.example.test/v1',
                model: 'test-model',
                apiKey: '',
                expected: false
            }, {
                baseUrl: 'https://ai.example.test/v1',
                model: 'test-model',
                apiKey: 'test-key',
                expected: true
            }])('isAiConfiguredEnvironment($baseUrl, $model, $apiKey) yields $expected', ({ baseUrl, model, apiKey, expected }) => {
                expect(isAiConfiguredEnvironment({
                    baseUrl,
                    model,
                    apiKey,
                    mode: StructuredMode.Strict
                })).toBe(expected);
            });
        });
    });
});
