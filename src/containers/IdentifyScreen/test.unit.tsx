import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

// Components
import ToastProvider from '@/design-system/ToastProvider';
import IdentifyScreen from './index';

// Mocks
const { pushMock } = vi.hoisted(() => {
    return {
        pushMock: vi.fn()
    };
});

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: pushMock,
                refresh: vi.fn()
            };
        }
    };
});

vi.mock('@/services/identify', () => {
    return {
        identifyPlant: vi.fn()
    };
});

vi.mock('@/lib/db/actions', () => {
    return {
        createPlant: vi.fn()
    };
});

const props: React.ComponentProps<typeof IdentifyScreen> = {
    emailVerified: true
};

describe('IdentifyScreen', () => {
    it('shows the capture flow and no verify notice for a verified user', () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
        expect(screen.queryByRole('link', {
            name: 'Go to Settings'
        })).toBeNull();
    });

    it('shows the persistent verify notice with a settings link for an unverified user', () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} emailVerified={false} />
            </ToastProvider>
        );

        expect(screen.getByText('Verify your email first')).toBeInTheDocument();
        expect(screen.getByRole('link', {
            name: 'Go to Settings'
        })).toBeInTheDocument();
        expect(screen.getByText(/on pause/)).toBeInTheDocument();
    });

    it('hides the capture flow for an unverified user', () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} emailVerified={false} />
            </ToastProvider>
        );

        expect(screen.queryByRole('button', {
            name: 'Open camera'
        })).toBeNull();
    });

    it('links the verify notice to /settings', () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} emailVerified={false} />
            </ToastProvider>
        );

        expect(screen.getByRole('link', {
            name: 'Go to Settings'
        })).toHaveAttribute('href', '/settings');
    });

    it('keeps the verify notice mounted across an effect flush', async () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} emailVerified={false} />
            </ToastProvider>
        );

        expect(screen.getByRole('link', {
            name: 'Go to Settings'
        })).toBeInTheDocument();

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByRole('link', {
            name: 'Go to Settings'
        })).toBeInTheDocument();
    });

    it('proves the capture bar and identify gate icons render', () => {
        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        expect(document.body.querySelector('svg')).not.toBeNull();
    });
});
