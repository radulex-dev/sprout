import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { sendNotification, WebPushError } from 'web-push';

// Mocks
import { NOW } from '@test/vitest/data/plant.mock';

// Services
import { sendPushToSubscriptions, sendPushToUser } from './index';

// Database
import { getPushSubscriptionsForUser } from '@/lib/db/queries';

// Types
import type { PushSubscriptionRow } from '@/lib/db/types';

const { mockDelete } = vi.hoisted(() => {
    return {
        mockDelete: vi.fn(() => {
            return {
                where: vi.fn()
            };
        })
    };
});

vi.mock('web-push', () => {
    class WebPushError extends Error {
        statusCode: number;

        constructor(message: string, statusCode: number) {
            super(message);
            this.statusCode = statusCode;
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
            delete: mockDelete
        }
    };
});

vi.mock('@/lib/db/queries', () => {
    return {
        getAllPushSubscriptions: vi.fn(),
        getPushSubscriptionsForUser: vi.fn()
    };
});

const mockSend = vi.mocked(sendNotification) as unknown as Mock;
const mockGetSubscriptions = vi.mocked(getPushSubscriptionsForUser);

describe('sendPushToSubscriptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('counts every successful send and removes nothing', async () => {
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('prunes a 410 endpoint without counting it as sent', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('leaves a non-410 failure uncounted and unpruned', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('tallies a successful send, a prune and a failure in one batch', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
        };
        const subscriptionC: PushSubscriptionRow = {
            id: 'id-https://push.example/c',
            userId: 'user-1',
            endpoint: 'https://push.example/c',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('contains a failing prune rather than rejecting the whole batch', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('sends to the surviving endpoints when one of several is gone', async () => {
        const ErrorClass = WebPushError as unknown as new (message: string, statusCode: number) => Error;
        const subscriptionA: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
        };
        const subscriptionB: PushSubscriptionRow = {
            id: 'id-https://push.example/b',
            userId: 'user-1',
            endpoint: 'https://push.example/b',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('reports nothing for a user with no subscriptions', async () => {
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
});

describe('sendPushToUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads the user subscriptions and sends to them', async () => {
        const subscription: PushSubscriptionRow = {
            id: 'id-https://push.example/a',
            userId: 'user-1',
            endpoint: 'https://push.example/a',
            p256dh: 'p256dh-value',
            auth: 'auth-value',
            createdAt: NOW
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

    it('reports sent 0 when the user has no subscription, so the caller can tell the truth', async () => {
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
});
