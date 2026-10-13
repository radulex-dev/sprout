import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Hooks
import { useInstall } from './index';

// Services
import { getInstallPlatform, isPhoneBrowser, isStandalone } from '@/services/install';
import { InstallPlatform } from '@/services/install/types';

const installHandler = vi.hoisted(() => {
    return {
        addListener: vi.fn<(listener: (canInstall: boolean) => void) => void>(),
        install: vi.fn<() => Promise<void>>(),
        removeListener: vi.fn<(listener: (canInstall: boolean) => void) => void>()
    };
});

vi.mock('@/services/install', () => {
    return {
        getInstallPlatform: vi.fn(),
        isPhoneBrowser: vi.fn(),
        isStandalone: vi.fn()
    };
});

vi.mock('pwa-install-handler', () => {
    return {
        pwaInstallHandler: installHandler
    };
});

describe('useInstall', () => {
    it('reports the standalone, phone and platform state on mount', () => {
        vi.mocked(isStandalone).mockReturnValue(true);
        vi.mocked(isPhoneBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        const { result } = renderHook(() => {
            return useInstall();
        });

        expect(result.current.isStandalone).toBe(true);
        expect(result.current.isPhone).toBe(true);
        expect(result.current.platform).toBe(InstallPlatform.Ios);
        expect(result.current.canPrompt).toBe(false);
    });

    it('reports whether the install prompt is available', () => {
        const { result } = renderHook(() => {
            return useInstall();
        });
        const handleCanInstallChange = installHandler.addListener.mock.calls.at(0)?.at(0);

        act(() => {
            handleCanInstallChange?.(true);
        });

        expect(result.current.canPrompt).toBe(true);

        act(() => {
            handleCanInstallChange?.(false);
        });

        expect(result.current.canPrompt).toBe(false);
    });

    it('installs through the prompt handler', async () => {
        const { result } = renderHook(() => {
            return useInstall();
        });

        await act(async () => {
            await result.current.promptInstall();
        });

        expect(installHandler.install.mock.calls).toHaveLength(1);
    });

    it('stops listening when it unmounts', () => {
        const { unmount } = renderHook(() => {
            return useInstall();
        });

        unmount();

        expect(installHandler.addListener.mock.calls).toHaveLength(1);
        expect(installHandler.removeListener.mock.calls).toEqual(installHandler.addListener.mock.calls);
    });
});
