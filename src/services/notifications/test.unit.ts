import { afterEach, describe, expect, it, vi } from 'vitest';

// Helpers
import { decodeVapidPublicKey } from '@/helpers/push';
import { stubServiceWorker, unstubServiceWorker } from '@test/vitest/helpers/mockServiceWorker';

// Services
import { REMINDERS_OPTED_OUT_KEY } from './constants';
import { checkAndNotify, ensurePushSubscription, isRemindersOptedOut, setRemindersEnabled, setRemindersOptedOut } from './index';

// Database
import { recordNotified } from '@/lib/db/actions';

vi.mock('@/lib/db/actions', () => {
    return {
        recordNotified: vi.fn()
    };
});

afterEach(() => {
    unstubServiceWorker();
    localStorage.removeItem(REMINDERS_OPTED_OUT_KEY);
});

describe('notifications service', () => {
    it('ensurePushSubscription subscribes when there is no existing subscription', async () => {
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

    it('ensurePushSubscription re-posts an existing subscription whose key matches without unsubscribing', async () => {
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

    it('ensurePushSubscription unsubscribes and replaces an existing subscription whose key does not match', async () => {
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

    it('ensurePushSubscription does not re-post when unsubscribing a stale-key subscription is refused', async () => {
        const unsubscribe = vi.fn().mockResolvedValue(false);
        const subscribe = vi.fn();
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
        expect(subscribe).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([{
        applicationServerKey: undefined,
        byteLength: 0
    }, {
        applicationServerKey: new Uint8Array([1, 2]).buffer,
        byteLength: 2
    }])('ensurePushSubscription replaces a subscription whose applicationServerKey is $byteLength bytes long', async ({ applicationServerKey }) => {
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

    it('isRemindersOptedOut reads false when the flag is unset', () => {
        expect(isRemindersOptedOut()).toBe(false);
    });

    it('setRemindersOptedOut round-trips the opt-out flag through localStorage', () => {
        setRemindersOptedOut(true);

        expect(localStorage.getItem(REMINDERS_OPTED_OUT_KEY)).toBe('1');
        expect(isRemindersOptedOut()).toBe(true);

        setRemindersOptedOut(false);

        expect(localStorage.getItem(REMINDERS_OPTED_OUT_KEY)).toBeNull();
        expect(isRemindersOptedOut()).toBe(false);
    });

    it('checkAndNotify returns 0 without fetching or notifying while opted out', async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal('fetch', fetchMock);
        setRemindersOptedOut(true);

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(vi.mocked(recordNotified)).not.toHaveBeenCalled();
    });

    it('ensurePushSubscription PATCHes active:false after the POST when opted out', async () => {
        const existing = {
            endpoint: 'https://push.example/existing',
            options: {
                applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer
            }
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing)
        } as unknown as PushManager);
        setRemindersOptedOut(true);

        await ensurePushSubscription();

        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
                endpoint: 'https://push.example/existing',
                active: false
            })
        }));
    });

    it('setRemindersEnabled sets the opt-out flag and PATCHes active:false when disabling', async () => {
        const existing = {
            endpoint: 'https://push.example/existing',
            options: {
                applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer
            }
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing)
        } as unknown as PushManager);

        await setRemindersEnabled(false);

        expect(isRemindersOptedOut()).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
                endpoint: 'https://push.example/existing',
                active: false
            })
        }));
    });

    it('setRemindersEnabled clears the opt-out flag and PATCHes active:true when enabling', async () => {
        const existing = {
            endpoint: 'https://push.example/existing',
            options: {
                applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer
            }
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(existing)
        } as unknown as PushManager);
        setRemindersOptedOut(true);

        await setRemindersEnabled(true);

        expect(localStorage.getItem(REMINDERS_OPTED_OUT_KEY)).toBeNull();
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
                endpoint: 'https://push.example/existing',
                active: true
            })
        }));
    });
});
