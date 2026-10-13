import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Constants
import { BUILD_ID, SERVICE_WORKER_PATH } from './constants';

// Components
import SiteCore from './index';

// Services
import { ensurePushSubscription, startCareWatcher } from '@/services/notifications';

vi.mock('@/services/notifications', () => {
    return {
        ensurePushSubscription: vi.fn(),
        startCareWatcher: vi.fn()
    };
});

const props: Omit<React.ComponentProps<typeof SiteCore>, 'children'> = {};

afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('<SiteCore />', () => {
    it('registers the versioned service worker and re-establishes push in production', () => {
        vi.stubEnv('NODE_ENV', 'production');

        const register = vi.fn().mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {
                register
            }
        });

        render(<SiteCore {...props}><span>App content</span></SiteCore>);

        expect(register).toHaveBeenCalledWith(`${SERVICE_WORKER_PATH}?v=${BUILD_ID}`, {
            updateViaCache: 'none'
        });
        expect(ensurePushSubscription).toHaveBeenCalledTimes(1);
    });

    it('unregisters existing workers and purges caches outside production', async () => {
        const unregister = vi.fn().mockResolvedValue(true);
        const deleteCache = vi.fn().mockResolvedValue(true);

        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {
                getRegistrations: vi.fn().mockResolvedValue([{
                    unregister
                }, {
                    unregister
                }])
            }
        });
        vi.stubGlobal('caches', {
            keys: vi.fn().mockResolvedValue(['sprout-old', 'sprout-stale']),
            delete: deleteCache
        });

        render(<SiteCore {...props}><span>App content</span></SiteCore>);

        await waitFor(() => {
            expect(unregister).toHaveBeenCalledTimes(2);
        });

        expect(deleteCache).toHaveBeenCalledWith('sprout-old');
        expect(deleteCache).toHaveBeenCalledWith('sprout-stale');
        expect(ensurePushSubscription).not.toHaveBeenCalled();
    });

    it('renders its children and starts the care watcher without service worker support', () => {
        render(<SiteCore {...props}><span>App content</span></SiteCore>);

        expect(screen.getByText('App content')).toBeInTheDocument();
        expect(startCareWatcher).toHaveBeenCalledTimes(1);
        expect(ensurePushSubscription).not.toHaveBeenCalled();
    });
});
