import { afterEach, describe, expect, it, vi } from 'vitest';

// Helpers
import { decodeVapidPublicKey } from '@/helpers/push';

// Services
import { ensurePushSubscription } from './index';

vi.mock('@/lib/db/actions', () => {
    return {
        recordNotified: vi.fn()
    };
});

const stubServiceWorker = (pushManager: PushManager) => {
    vi.stubGlobal('Notification', {
        permission: 'granted'
    });

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        configurable: true,
        value: {
            ready: Promise.resolve({
                pushManager
            })
        }
    });
};

afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'serviceWorker');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('ensurePushSubscription', () => {
    it('subscribes when there is no existing subscription', async () => {
        const replacement = {
            endpoint: 'https://push.example/replacement'
        };
        const subscribe = vi.fn().mockResolvedValue(replacement);
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(undefined),
            subscribe
        } as unknown as PushManager);

        await ensurePushSubscription();

        expect(subscribe).toHaveBeenCalledTimes(1);

        const [[options]] = subscribe.mock.calls as [[PushSubscriptionOptionsInit]];
        expect(options.userVisibleOnly).toBe(true);
        expect([...(options.applicationServerKey as Uint8Array)]).toEqual([...decodeVapidPublicKey('AQIDBA')]);
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(replacement)
        }));
    });

    it('re-posts an existing subscription whose key matches without unsubscribing', async () => {
        const unsubscribe = vi.fn().mockResolvedValue(true);
        const subscribe = vi.fn();
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });
        const existing = {
            endpoint: 'https://push.example/existing',
            options: {
                applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer
            },
            unsubscribe
        };

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing),
            subscribe
        } as unknown as PushManager);

        await ensurePushSubscription();

        expect(unsubscribe).not.toHaveBeenCalled();
        expect(subscribe).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(existing)
        }));
    });

    it('unsubscribes and replaces an existing subscription whose key does not match', async () => {
        const unsubscribe = vi.fn().mockResolvedValue(true);
        const replacement = {
            endpoint: 'https://push.example/replacement'
        };
        const subscribe = vi.fn().mockResolvedValue(replacement);
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });
        const existing = {
            endpoint: 'https://push.example/stale',
            options: {
                applicationServerKey: new Uint8Array([9, 9, 9, 9]).buffer
            },
            unsubscribe
        };

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing),
            subscribe
        } as unknown as PushManager);

        await ensurePushSubscription();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(subscribe).toHaveBeenCalledTimes(1);
        expect(unsubscribe.mock.invocationCallOrder.at(0) ?? 0).toBeLessThan(subscribe.mock.invocationCallOrder.at(0) ?? 0);

        const [[options]] = subscribe.mock.calls as [[PushSubscriptionOptionsInit]];
        expect([...(options.applicationServerKey as Uint8Array)]).toEqual([...decodeVapidPublicKey('AQIDBA')]);
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(replacement)
        }));
    });

    it.each([{
        applicationServerKey: undefined,
        byteLength: 0
    }, {
        applicationServerKey: new Uint8Array([1, 2]).buffer,
        byteLength: 2
    }])('replaces a subscription whose applicationServerKey is $byteLength bytes long', async ({ applicationServerKey }) => {
        const unsubscribe = vi.fn().mockResolvedValue(true);
        const subscribe = vi.fn().mockResolvedValue({
            endpoint: 'https://push.example/replacement'
        });
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });
        const existing = {
            endpoint: 'https://push.example/stale',
            options: {
                applicationServerKey
            },
            unsubscribe
        };

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing),
            subscribe
        } as unknown as PushManager);

        await ensurePushSubscription();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(subscribe).toHaveBeenCalledTimes(1);
    });
});
