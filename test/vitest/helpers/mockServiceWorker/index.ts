import { vi } from 'vitest';

export const stubServiceWorker = (pushManager: PushManager): void => {
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

export const unstubServiceWorker = (): void => {
    Reflect.deleteProperty(globalThis.navigator, 'serviceWorker');
};
