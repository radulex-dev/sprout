import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

// Helpers
import { parseConsent, readConsent, writeConsent } from './helpers';

// Hooks
import { useAnalyticsConsent } from './index';

describe('useAnalyticsConsent', () => {
    it('reports no choice once loaded', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        expect(result.current.isLoaded).toBe(true);
        expect(result.current.consent).toBeUndefined();
    });

    it('reports no choice once loaded when storage is unreadable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        expect(result.current.isLoaded).toBe(true);
        expect(result.current.consent).toBeUndefined();
    });

    it.each([{
        expected: true,
        stored: 'true'
    }, {
        expected: false,
        stored: 'false'
    }])('reads a stored $stored value as $expected', ({ expected, stored }) => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, stored);

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        expect(result.current.consent).toBe(expected);
    });

    it.each([{
        action: 'accept' as const,
        expected: true,
        stored: 'true'
    }, {
        action: 'decline' as const,
        expected: false,
        stored: 'false'
    }])('records $action as $expected', ({ action, expected, stored }) => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            result.current[action]();
        });

        expect(result.current.consent).toBe(expected);
        expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe(stored);
    });

    it.each([{
        expected: true,
        newValue: 'true'
    }, {
        expected: false,
        newValue: 'false'
    }])('sets consent to $expected from a storage event carrying $newValue', ({ expected, newValue }) => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                newValue,
                storageArea: localStorage
            }));
        });

        expect(result.current.consent).toBe(expected);
    });

    it('resets consent when our key is removed', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                storageArea: localStorage
            }));
        });

        expect(result.current.consent).toBeUndefined();
    });

    it('resets consent when storage is cleared', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                storageArea: localStorage
            }));
        });

        expect(result.current.consent).toBeUndefined();
    });

    it('ignores storage events for other keys', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                key: 'sprout:something-else',
                newValue: 'true',
                storageArea: localStorage
            }));
        });

        expect(result.current.consent).toBeUndefined();
    });

    it('ignores storage events for sessionStorage', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                newValue: 'true',
                storageArea: globalThis.sessionStorage
            }));
        });

        expect(result.current.consent).toBeUndefined();
    });

    it('survives a storage event while storage is unreadable', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        act(() => {
            globalThis.dispatchEvent(new StorageEvent('storage', {
                key: ANALYTICS_CONSENT_KEY,
                newValue: 'true',
                storageArea: globalThis.sessionStorage
            }));
        });

        expect(result.current.consent).toBeUndefined();
    });

    it('removes the storage listener on unmount', () => {
        const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
        const { unmount } = renderHook(() => {
            return useAnalyticsConsent();
        });

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    describe('Helpers', () => {
        it.each([{
            expected: undefined,
            value: ''
        }, {
            expected: true,
            value: 'true'
        }, {
            expected: false,
            value: 'false'
        }, {
            expected: undefined,
            value: 'garbage'
        }])('parseConsent($value) returns $expected', ({ value, expected }) => {
            expect(parseConsent(value)).toBe(expected);
        });

        it('treats an absent stored value as undefined', () => {
            expect(parseConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY))).toBeUndefined();
        });

        it('treats a missing choice as undefined', () => {
            expect(readConsent()).toBeUndefined();
        });

        it('treats an unreadable choice as undefined', () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('storage unavailable');
            });

            expect(readConsent()).toBeUndefined();
        });

        it.each([{
            expected: true,
            stored: 'true'
        }, {
            expected: false,
            stored: 'false'
        }, {
            expected: undefined,
            stored: 'garbage'
        }])('reads a stored $stored value as $expected', ({ expected, stored }) => {
            localStorage.setItem(ANALYTICS_CONSENT_KEY, stored);

            expect(readConsent()).toBe(expected);
        });

        it.each([{
            expected: 'true',
            value: true
        }, {
            expected: 'false',
            value: false
        }])('writes $value as $expected', ({ expected, value }) => {
            writeConsent(value);

            expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe(expected);
        });

        it('logs when the choice cannot be persisted', () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('quota');
            });
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

            expect(() => {
                writeConsent(true);
            }).not.toThrow();
            expect(errorSpy).toHaveBeenCalled();
        });
    });
});
