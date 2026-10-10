import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Constants
import { TOAST_TIMEOUT_INDEFINITE, ToastVariant } from '@/design-system/Toast/constants';

// Hooks
import { useToast } from './index';

const { addMock } = vi.hoisted(() => {
    return {
        addMock: vi.fn()
    };
});

vi.mock('@base-ui/react/toast', () => {
    return {
        Toast: {
            useToastManager: () => {
                return {
                    add: addMock
                };
            }
        }
    };
});

describe('useToast', () => {
    it('defaults the variant to info and the timeout to indefinite', () => {
        const { result } = renderHook(() => {
            return useToast();
        });

        act(() => {
            result.current({
                title: 'Plant saved'
            });
        });

        expect(addMock).toHaveBeenCalledWith({
            type: ToastVariant.Info,
            title: 'Plant saved',
            description: undefined,
            timeout: TOAST_TIMEOUT_INDEFINITE
        });
    });

    it('passes the variant, description and timeout through', () => {
        const { result } = renderHook(() => {
            return useToast();
        });

        act(() => {
            result.current({
                variant: ToastVariant.Error,
                title: 'Could not save',
                description: 'Please try again.',
                timeout: 5000
            });
        });

        expect(addMock).toHaveBeenCalledWith({
            type: ToastVariant.Error,
            title: 'Could not save',
            description: 'Please try again.',
            timeout: 5000
        });
    });
});
