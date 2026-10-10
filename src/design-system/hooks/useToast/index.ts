import { useCallback } from 'react';
import { Toast } from '@base-ui/react/toast';

// Constants
import { DEFAULT_TOAST_VARIANT, TOAST_TIMEOUT_INDEFINITE } from '@/design-system/Toast/constants';

// Types
import { type ToastOptions } from './types';

export const useToast = (): ((options: ToastOptions) => void) => {
    const manager = Toast.useToastManager();

    return useCallback((options: ToastOptions): void => {
        manager.add({
            type: options.variant ?? DEFAULT_TOAST_VARIANT,
            title: options.title,
            description: options.description,
            timeout: options.timeout ?? TOAST_TIMEOUT_INDEFINITE
        });
    }, [manager]);
};
