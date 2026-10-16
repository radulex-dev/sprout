import { afterEach, describe, expect, it, vi } from 'vitest';

// Constants
import { CARE_CHECK_INTERVAL_MS, REMINDERS_OPTED_OUT_KEY } from './constants';
import { CARE_NOTIFICATION_TAG } from '@/helpers/care/constants';

// Helpers
import { decodeVapidPublicKey } from '@/helpers/push';
import { stubServiceWorker, unstubServiceWorker } from '@test/vitest/helpers/mockServiceWorker';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

// Services
import { checkAndNotify, ensurePushSubscription, hasPushSubscription, isRemindersOptedOut, requestNotificationPermission, setRemindersEnabled, setRemindersOptedOut, startCareWatcher } from './index';

// Database
import { recordNotified } from '@/lib/db/actions';

// Types
import { CareKind } from '@/types';

vi.mock('@/lib/db/actions', () => {
    return {
        recordNotified: vi.fn()
    };
});

describe('notifications service', () => {
    afterEach(() => {
        unstubServiceWorker();
        localStorage.removeItem(REMINDERS_OPTED_OUT_KEY);
    });

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

    it.each([{
        applicationServerKey: 'AQIDBA',
        permission: 'granted',
        supported: false
    }, {
        applicationServerKey: '',
        permission: 'granted',
        supported: true
    }, {
        applicationServerKey: 'AQIDBA',
        permission: 'denied',
        supported: true
    }])('ensurePushSubscription returns early when the key is "$applicationServerKey", permission is "$permission" and support is $supported', async ({ applicationServerKey, permission, supported }) => {
        const fetchMock = vi.fn();
        const getSubscription = vi.fn();

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', applicationServerKey);
        vi.stubGlobal('fetch', fetchMock);

        if (supported) {
            stubServiceWorker({
                getSubscription
            } as unknown as PushManager);
        }

        vi.stubGlobal('Notification', {
            permission
        });

        await ensurePushSubscription();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(getSubscription).not.toHaveBeenCalled();
    });

    it('ensurePushSubscription returns when the registration has no push manager', async () => {
        const fetchMock = vi.fn();

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        await ensurePushSubscription();

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ensurePushSubscription logs when reading the subscription fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        stubServiceWorker({
            getSubscription: vi.fn().mockRejectedValue(new Error('worker unavailable'))
        } as unknown as PushManager);

        await ensurePushSubscription();

        expect(console.error).toHaveBeenCalledWith('Failed to register the push subscription', expect.any(Error));
    });

    it('isRemindersOptedOut returns false when reading localStorage throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        expect(isRemindersOptedOut()).toBe(false);
    });

    it('setRemindersOptedOut logs when writing localStorage throws', () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota exceeded');
        });

        setRemindersOptedOut(true);

        expect(console.error).toHaveBeenCalledWith('Failed to persist the reminders opt-out flag', expect.any(Error));
    });

    it('setRemindersEnabled persists the flag without a service worker', async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal('fetch', fetchMock);

        await setRemindersEnabled(false);

        expect(isRemindersOptedOut()).toBe(true);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('setRemindersEnabled enables reminders without a service worker', async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal('fetch', fetchMock);
        setRemindersOptedOut(true);

        await setRemindersEnabled(true);

        expect(localStorage.getItem(REMINDERS_OPTED_OUT_KEY)).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('setRemindersEnabled skips the subscription POST until permission is granted', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });
        const subscribe = vi.fn();

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue({
                endpoint: 'https://push.example/existing'
            }),
            subscribe
        } as unknown as PushManager);
        vi.stubGlobal('Notification', {
            permission: 'default'
        });

        await setRemindersEnabled(true);

        expect(subscribe).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
                endpoint: 'https://push.example/existing',
                active: true
            })
        }));
    });

    it('setRemindersEnabled skips the PATCH when the device has no subscription', async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(undefined)
        } as unknown as PushManager);

        await setRemindersEnabled(false);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('setRemindersEnabled logs when the preference cannot be persisted', async () => {
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        stubServiceWorker({
            getSubscription: vi.fn().mockRejectedValue(new Error('worker unavailable'))
        } as unknown as PushManager);

        await setRemindersEnabled(false);

        expect(console.error).toHaveBeenCalledWith('Failed to persist the reminders preference', expect.any(Error));
    });

    it('hasPushSubscription returns false without notification support', async () => {
        await expect(hasPushSubscription()).resolves.toBe(false);
    });

    it('hasPushSubscription returns true when a subscription exists', async () => {
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue({
                endpoint: 'https://push.example/existing'
            })
        } as unknown as PushManager);

        await expect(hasPushSubscription()).resolves.toBe(true);
    });

    it('hasPushSubscription returns false when there is no subscription', async () => {
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(localStorage.getItem('missing-push-subscription'))
        } as unknown as PushManager);

        await expect(hasPushSubscription()).resolves.toBe(false);
    });

    it('hasPushSubscription returns false when reading the subscription fails', async () => {
        stubServiceWorker({
            getSubscription: vi.fn().mockRejectedValue(new Error('worker unavailable'))
        } as unknown as PushManager);

        await expect(hasPushSubscription()).resolves.toBe(false);
    });

    it('requestNotificationPermission returns denied without notification support', async () => {
        await expect(requestNotificationPermission()).resolves.toBe('denied');
    });

    it('requestNotificationPermission registers a push subscription when permission is granted', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true
        });
        const requestPermission = vi.fn().mockResolvedValue('granted');

        vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQIDBA');
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn().mockResolvedValue(undefined),
            subscribe: vi.fn().mockResolvedValue({
                endpoint: 'https://push.example/replacement'
            })
        } as unknown as PushManager);
        vi.stubGlobal('Notification', {
            permission: 'granted',
            requestPermission
        });

        await expect(requestNotificationPermission()).resolves.toBe('granted');

        expect(requestPermission).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('requestNotificationPermission leaves push unregistered when permission is denied', async () => {
        const fetchMock = vi.fn();
        const requestPermission = vi.fn().mockResolvedValue('denied');

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription: vi.fn()
        } as unknown as PushManager);
        vi.stubGlobal('Notification', {
            permission: 'denied',
            requestPermission
        });

        await expect(requestNotificationPermission()).resolves.toBe('denied');

        expect(requestPermission).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('checkAndNotify returns 0 without notification support', async () => {
        const fetchMock = vi.fn();

        vi.stubGlobal('fetch', fetchMock);

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('checkAndNotify returns 0 when notification permission is not granted', async () => {
        const fetchMock = vi.fn();
        const getSubscription = vi.fn();

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker({
            getSubscription
        } as unknown as PushManager);
        vi.stubGlobal('Notification', {
            permission: 'default'
        });

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('checkAndNotify returns 0 when the plants request fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false
        });

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(vi.mocked(recordNotified)).not.toHaveBeenCalled();
    });

    it('checkAndNotify returns 0 when the plants request rejects', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(vi.mocked(recordNotified)).not.toHaveBeenCalled();
    });

    it('checkAndNotify sends one combined notification and records every due task', async () => {
        const showNotification = vi.fn().mockResolvedValue(undefined);
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([makePlant()])
        });

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        const registration = await navigator.serviceWorker.ready;

        Object.assign(registration, {
            showNotification
        });

        await expect(checkAndNotify()).resolves.toBe(3);

        expect(fetchMock).toHaveBeenCalledWith('/api/plants', {
            cache: 'no-store'
        });
        expect(showNotification).toHaveBeenCalledTimes(1);
        expect(showNotification).toHaveBeenCalledWith('Monstera deliciosa needs care today', {
            body: 'Monstera deliciosa: water (set a pot size), fertilise, repot',
            tag: CARE_NOTIFICATION_TAG,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
        expect(vi.mocked(recordNotified)).toHaveBeenCalledTimes(3);
        expect(vi.mocked(recordNotified)).toHaveBeenCalledWith('plant-1', CareKind.Water, expect.any(Number));
    });

    it('checkAndNotify returns 0 when every due task was already notified today', async () => {
        vi.useFakeTimers({
            toFake: ['Date']
        });

        const now = Date.now();
        const showNotification = vi.fn();
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([makePlant({
                lastNotified: {
                    [CareKind.Water]: now,
                    [CareKind.Fertilize]: now,
                    [CareKind.Repot]: now
                }
            })])
        });

        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        const registration = await navigator.serviceWorker.ready;

        Object.assign(registration, {
            showNotification
        });

        await expect(checkAndNotify()).resolves.toBe(0);

        expect(showNotification).not.toHaveBeenCalled();
        expect(vi.mocked(recordNotified)).not.toHaveBeenCalled();
    });

    it('startCareWatcher checks on start, on focus and hourly, and stops after cleanup', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([])
        });

        vi.useFakeTimers();
        vi.stubGlobal('fetch', fetchMock);
        stubServiceWorker(undefined as unknown as PushManager);

        const stop = startCareWatcher();

        await vi.advanceTimersByTimeAsync(0);

        expect(fetchMock).toHaveBeenCalledTimes(1);

        globalThis.dispatchEvent(new Event('focus'));

        await vi.advanceTimersByTimeAsync(0);

        expect(fetchMock).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(CARE_CHECK_INTERVAL_MS);

        expect(fetchMock).toHaveBeenCalledTimes(3);

        stop();

        globalThis.dispatchEvent(new Event('focus'));

        await vi.advanceTimersByTimeAsync(CARE_CHECK_INTERVAL_MS);

        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});
