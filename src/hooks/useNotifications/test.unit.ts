import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hooks
import { useNotifications } from './index';

// Services
import { hasPushSubscription, isNotificationsSupported, isRemindersOptedOut, requestNotificationPermission, setRemindersEnabled } from '@/services/notifications';

vi.mock('@/services/notifications', () => {
    return {
        hasPushSubscription: vi.fn(),
        isNotificationsSupported: vi.fn(),
        isRemindersOptedOut: vi.fn(),
        requestNotificationPermission: vi.fn(),
        setRemindersEnabled: vi.fn()
    };
});

describe('useNotifications', () => {
    beforeEach(() => {
        vi.stubGlobal('Notification', {
            permission: 'granted'
        });
        vi.mocked(isNotificationsSupported).mockReturnValue(true);
        vi.mocked(isRemindersOptedOut).mockReturnValue(false);
        vi.mocked(hasPushSubscription).mockResolvedValue(false);
    });

    it('reports the subscription and opt-out state on mount', async () => {
        vi.mocked(hasPushSubscription).mockResolvedValue(true);

        const { result } = renderHook(() => {
            return useNotifications();
        });

        await waitFor(() => {
            expect(result.current.isSupported).toBe(true);
            expect(result.current.isSubscribed).toBe(true);
        });
        expect(result.current.isOptedOut).toBe(false);
    });

    it('requests permission and enables when the toggle turns on under a default permission', async () => {
        vi.stubGlobal('Notification', {
            permission: 'default'
        });
        vi.mocked(requestNotificationPermission).mockResolvedValue('granted');

        const { result } = renderHook(() => {
            return useNotifications();
        });

        await act(async () => {
            await result.current.setRemindersEnabled(true);
        });

        expect(vi.mocked(requestNotificationPermission)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(setRemindersEnabled)).toHaveBeenCalledWith(true);
    });

    it('does not enable when the permission request is refused', async () => {
        vi.stubGlobal('Notification', {
            permission: 'default'
        });
        vi.mocked(requestNotificationPermission).mockResolvedValue('denied');

        const { result } = renderHook(() => {
            return useNotifications();
        });

        await act(async () => {
            await result.current.setRemindersEnabled(true);
        });

        expect(vi.mocked(setRemindersEnabled)).not.toHaveBeenCalled();
    });

    it('disables without requesting permission', async () => {
        const { result } = renderHook(() => {
            return useNotifications();
        });

        await act(async () => {
            await result.current.setRemindersEnabled(false);
        });

        expect(vi.mocked(requestNotificationPermission)).not.toHaveBeenCalled();
        expect(vi.mocked(setRemindersEnabled)).toHaveBeenCalledWith(false);
    });
});
