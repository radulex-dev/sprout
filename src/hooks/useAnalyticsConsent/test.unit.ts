import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Constants
import { ANALYTICS_CONSENT_KEY } from './constants';

// Helpers
import { readConsent, writeConsent } from './helpers';

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

    it('reads a stored acceptance', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        expect(result.current.consent).toBe(true);
    });

    it('reads a stored refusal', () => {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, 'false');

        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        expect(result.current.consent).toBe(false);
    });

    it('records acceptance', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            result.current.accept();
        });

        expect(result.current.consent).toBe(true);
        expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('true');
    });

    it('records refusal', () => {
        const { result } = renderHook(() => {
            return useAnalyticsConsent();
        });

        act(() => {
            result.current.decline();
        });

        expect(result.current.consent).toBe(false);
        expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('false');
    });

    describe('Helpers', () => {
        it('treats a missing choice as undefined', () => {
            expect(readConsent()).toBeUndefined();
        });

        it('reads a stored acceptance', () => {
            localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');

            expect(readConsent()).toBe(true);
        });

        it('reads a stored refusal', () => {
            localStorage.setItem(ANALYTICS_CONSENT_KEY, 'false');

            expect(readConsent()).toBe(false);
        });

        it('treats an unknown stored value as not consented', () => {
            localStorage.setItem(ANALYTICS_CONSENT_KEY, 'garbage');

            expect(readConsent()).toBe(false);
        });

        it('writes acceptance as true', () => {
            writeConsent(true);

            expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('true');
        });

        it('writes refusal as false', () => {
            writeConsent(false);

            expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('false');
        });
    });
});
