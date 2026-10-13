import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

// Components
import ToastProvider from '@/design-system/ToastProvider';
import IdentifyScreen from './index';

// Helpers
import { compressPhoto } from '@/helpers/image';
import { ERROR_UNREADABLE_IMAGE } from '@/helpers/image/constants';

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

vi.mock('@/helpers/image', () => {
    return {
        compressPhoto: vi.fn()
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

// Services
import { identifyPlant } from '@/services/identify';

// Database
import { createPlant } from '@/lib/db/actions';

// Types
import { CareSource } from '@/types';

const props: React.ComponentProps<typeof IdentifyScreen> = {
    emailVerified: true
};

describe('<IdentifyScreen />', () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn(() => {
            return 'blob:preview';
        });
        URL.revokeObjectURL = vi.fn();
    });

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

    it('identifies an uploaded photo and moves through the results into the form', async () => {
        const user = userEvent.setup();
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockResolvedValue([{
            careSource: CareSource.Genus,
            commonName: 'Snake Plant',
            confidence: 0.91,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 7
            },
            species: 'Dracaena trifasciata'
        }, {
            careSource: CareSource.Genus,
            commonName: 'ZZ Plant',
            confidence: 0.64,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 14
            },
            species: 'Zamioculcas zamiifolia'
        }]);

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));

        expect(await screen.findByText('Best matches')).toBeInTheDocument();
        expect(screen.getByText('Snake Plant')).toBeInTheDocument();
        expect(screen.getByText('ZZ Plant')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: /ZZ Plant/
        }));
        await user.click(screen.getByRole('button', {
            name: 'Continue'
        }));

        expect(screen.getByRole('textbox', {
            name: 'Nickname'
        })).toHaveValue('ZZ Plant');

        await user.click(screen.getByRole('button', {
            name: 'Back'
        }));

        expect(screen.getByText('Best matches')).toBeInTheDocument();
        expect(screen.queryByRole('textbox', {
            name: 'Nickname'
        })).not.toBeInTheDocument();
    });

    it('adds the plant and opens it', async () => {
        const user = userEvent.setup();
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockResolvedValue([{
            careSource: CareSource.Genus,
            commonName: 'Snake Plant',
            confidence: 0.91,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 7
            },
            species: 'Dracaena trifasciata'
        }]);
        vi.mocked(createPlant).mockResolvedValue('plant-42');

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Continue'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        expect(await screen.findByText('Plant added.')).toBeInTheDocument();
        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/plants/plant-42');
        });
    });

    it('keeps the form open and reports the failure when adding the plant fails', async () => {
        const user = userEvent.setup();
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockResolvedValue([{
            careSource: CareSource.Genus,
            commonName: 'Snake Plant',
            confidence: 0.91,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 7
            },
            species: 'Dracaena trifasciata'
        }]);
        vi.mocked(createPlant).mockRejectedValue(new Error('db down'));

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Continue'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        expect(await screen.findByText('Couldn\'t add your plant. Please try again.')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Failed to add plant', expect.any(Error));
        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('returns to capture and shows the failure message when identification fails', async () => {
        const user = userEvent.setup();
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockRejectedValue(new Error('Daily quota reached.'));

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));

        expect(await screen.findByText('Daily quota reached.')).toBeInTheDocument();
        expect(screen.queryByText('Best matches')).not.toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Identify plant'
        })).toBeInTheDocument();
    });

    it('falls back to a generic message when identification fails without an error', async () => {
        const user = userEvent.setup();
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockRejectedValue('offline');

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));

        expect(await screen.findByText('Identification failed.')).toBeInTheDocument();
    });

    it('reports an unreadable photo and keeps the capture flow', async () => {
        const user = userEvent.setup();
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.mocked(compressPhoto).mockRejectedValue(new Error(ERROR_UNREADABLE_IMAGE));

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));

        expect(await screen.findByText(ERROR_UNREADABLE_IMAGE)).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Failed to process photo', expect.any(Error));
        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Identify plant'
        })).not.toBeInTheDocument();
    });

    it('shows a toast when the camera cannot be opened', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Open camera'
        }));

        expect(await screen.findByText('Camera unavailable — you can upload a photo instead.')).toBeInTheDocument();
    });

    it('clears the photo and results when the capture is retaken', async () => {
        const user = userEvent.setup();
        vi.mocked(compressPhoto).mockResolvedValue(new Blob(['leaf']));
        vi.mocked(identifyPlant).mockResolvedValue([{
            careSource: CareSource.Genus,
            commonName: 'Snake Plant',
            confidence: 0.91,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 7
            },
            species: 'Dracaena trifasciata'
        }]);

        render(
            <ToastProvider>
                <IdentifyScreen {...props} />
            </ToastProvider>
        );

        await user.upload(screen.getByLabelText('Upload a photo of your plant'), new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Identify plant'
        }));
        await user.click(await screen.findByRole('button', {
            name: 'Retake'
        }));

        expect(screen.queryByText('Best matches')).not.toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
        expect(screen.getByText('Use the camera or upload a photo of the plant you want to identify.')).toBeInTheDocument();
    });
});
