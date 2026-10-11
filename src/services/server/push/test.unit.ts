import { describe, expect, it, vi, type Mock } from 'vitest';
import { sendNotification, WebPushError } from 'web-push';

// Mocks
import { NOW } from '@test/vitest/data/plant.mock';

// Services
import { sendPushToSubscriptions, sendPushToUser, setSubscriptionActive, subscribe } from './index';
import { PushPreferenceSchema } from './schema';

// Database
import { getActivePushSubscriptionsForUser } from '@/lib/db/queries';

// Types
import type { PushSubscriptionRow } from '@/lib/db/types';

const { mockDelete, mockInsert, mockUpdate } = vi.hoisted(() => {
    return {
        mockDelete: vi.fn(() => {
            return {
                where: vi.fn()
            };
        }),
        mockInsert: vi.fn(() => {
            return {
                values: vi.fn(() => {
                    return {
                        onConflictDoUpdate: vi.fn()
                    };
                })
            };
        }),
        mockUpdate: vi.fn(() => {
            return {
                set: vi.fn(() => {
                    return {
                        where: vi.fn()
                    };
                })
            };
        })
    };
});

vi.mock('web-push', () => {
    class WebPushError extends Error {
        statusCode: number;
        body?: string;

        constructor(message: string, statusCode: number, body?: string) {
            super(message);
            this.statusCode = statusCode;
            this.body = body;
        }
    }

    return {
        sendNotification: vi.fn(),
        setVapidDetails: vi.fn(),
        WebPushError
    };
});

vi.mock('@/lib/db', () => {
    return {
        database: {
            delete: mockDelete,
            insert: mockInsert,
            update: mockUpdate
        }
    };
});

vi.mock('@/lib/db/queries', () => {
    return {
        getActivePushSubscriptionsForUser: vi.fn(),
        getAllPushSubscriptions: vi.fn()
    };
});

const mockSend = vi.mocked(sendNotification) as unknown as Mock;
const mockGetSubscriptions = vi.mocked(getActivePushSubscriptionsForUser);

describe('push service', () => {
    it('sendPushToSubscriptions counts every successful send and removes nothing', async () => {
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockResolvedValue(undefined);

        const result = await sendPushToSubscriptions([subscriptionA, subscriptionB], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 2,
            removed: 0
        });
        expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('sendPushToSubscriptions prunes a 410 endpoint without counting it as sent', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', 410));

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 1
        });
    });

    it.each([{
        statusCode: 403,
        removed: 0
    }, {
        statusCode: 500,
        removed: 0
    }])('sendPushToSubscriptions keeps a $statusCode rejection unpruned when nothing in the batch sent (removed=$removed)', async ({ statusCode, removed }) => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', statusCode));

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed
        });
    });

    it('sendPushToSubscriptions leaves a non-410 failure uncounted and unpruned', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', 401));

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
    });

    it('sendPushToSubscriptions keeps a key-mismatch rejection unpruned when no send in the batch succeeded', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number, body: string) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', 400, '{"reason":"VapidPkHashMismatch"}'));

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('sendPushToSubscriptions prunes a key-mismatch rejection once another send in the same batch succeeded', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number, body?: string) => Error;
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValueOnce(new ErrorClass('Push rejected', 400, '{"reason":"VapidPkHashMismatch"}')).mockResolvedValueOnce(undefined);

        const result = await sendPushToSubscriptions([subscriptionA, subscriptionB], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 1,
            removed: 1
        });
        expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('sendPushToSubscriptions keeps a non-403/410 rejection whose body reports a different reason', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number, body: string) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', 400, '{"reason":"BadJwtToken"}'));

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('sendPushToSubscriptions tallies a successful send, a prune and a failure in one batch', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };
        const subscriptionC: PushSubscriptionRow = {
            id: 'id-https://push.example/c',
            userId: 'user-1',
            endpoint: 'https://push.example/c',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new ErrorClass('Push rejected', 410)).mockRejectedValueOnce(new ErrorClass('Push rejected', 401));

        const result = await sendPushToSubscriptions([subscriptionA, subscriptionB, subscriptionC], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 1,
            removed: 1
        });
    });

    it('sendPushToSubscriptions contains a failing prune rather than rejecting the whole batch', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockRejectedValue(new ErrorClass('Push rejected', 410));
        mockDelete.mockImplementationOnce(() => {
            throw new Error('database is down');
        });

        const result = await sendPushToSubscriptions([subscription], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
    });

    it('sendPushToSubscriptions sends to the surviving endpoints when one of several is gone', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend
            .mockRejectedValueOnce(new ErrorClass('Push rejected', 410))
            .mockResolvedValueOnce(undefined);

        const result = await sendPushToSubscriptions([subscriptionA, subscriptionB], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 1,
            removed: 1
        });
    });

    it('sendPushToSubscriptions reports nothing for a user with no subscriptions', async () => {
        const result = await sendPushToSubscriptions([], {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('sendPushToUser loads the user subscriptions and sends to them', async () => {
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW,
            active: true
        };

        mockSend.mockResolvedValue(undefined);
        mockGetSubscriptions.mockResolvedValue([subscription]);

        const result = await sendPushToUser('user-1', {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(mockGetSubscriptions).toHaveBeenCalledWith('user-1');
        expect(result).toEqual({
            sent: 1,
            removed: 0
        });
    });

    it('sendPushToUser reports sent 0 when the user has no subscription, so the caller can tell the truth', async () => {
        mockGetSubscriptions.mockResolvedValue([]);

        const result = await sendPushToUser('user-1', {
            title: 'Time to water Fern',
            body: 'Fern is due for watering today.',
            tag: 'sprout-plant-1-water',
            url: '/'
        });

        expect(result).toEqual({
            sent: 0,
            removed: 0
        });
    });

    it('subscribe upserts without touching active, so a re-POST preserves an opted-out device', async () => {
        const onConflictDoUpdate = vi.fn();
        const values = vi.fn(() => {
            return {
                onConflictDoUpdate
            };
        });
        mockInsert.mockImplementationOnce(() => {
            return {
                values
            };
        });

        await subscribe('user-1', {
            endpoint: 'https://push.example/a',
            keys: {
                p256dh: 'p256dh-value',
                auth: 'auth-value'
            }
        });

        expect(values).toHaveBeenCalledWith({
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: expect.any(Number)
        });
        expect(onConflictDoUpdate).toHaveBeenCalledWith({
            target: expect.anything(),
            set: {
                userId: 'user-1',
                p256dh: 'p256dh-value',
                auth: 'auth-value',
                createdAt: expect.any(Number)
            }
        });
    });

    it('subscribe does not set active in the conflict update', async () => {
        const onConflictDoUpdate = vi.fn();
        mockInsert.mockImplementationOnce(() => {
            return {
                values: vi.fn(() => {
                    return {
                        onConflictDoUpdate
                    };
                })
            };
        });

        await subscribe('user-1', {
            endpoint: 'https://push.example/a',
            keys: {
                p256dh: 'p256dh-value',
                auth: 'auth-value'
            }
        });

        expect(onConflictDoUpdate).toHaveBeenCalledOnce();
        const [call] = onConflictDoUpdate.mock.calls;
        const { set } = call.at(0);

        expect('active' in set).toBe(false);
    });

    it.each([{
        active: true
    }, {
        active: false
    }])('setSubscriptionActive updates $active scoped to the user and endpoint', async ({ active }) => {
        const where = vi.fn();
        const set = vi.fn(() => {
            return {
                where
            };
        });
        mockUpdate.mockImplementationOnce(() => {
            return {
                set
            };
        });

        await setSubscriptionActive('user-1', 'https://push.example/a', active);

        expect(set).toHaveBeenCalledWith({
            active
        });
        expect(where).toHaveBeenCalledOnce();
    });

    it('PushPreferenceSchema accepts a valid endpoint and a boolean active flag', () => {
        expect(PushPreferenceSchema.parse({
            endpoint: 'https://push.example/a',
            active: false
        })).toEqual({
            endpoint: 'https://push.example/a',
            active: false
        });
    });

    it.each([{
        endpoint: 'not-a-url',
        active: true
    }, {
        endpoint: 'https://push.example/a',
        active: 'yes'
    }])('PushPreferenceSchema rejects $endpoint / $active', ({ endpoint, active }) => {
        expect(PushPreferenceSchema.safeParse({
            endpoint,
            active
        }).success).toBe(false);
    });
});
