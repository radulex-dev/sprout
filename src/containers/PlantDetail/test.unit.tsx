import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import ToastProvider from '@/design-system/ToastProvider';
import PlantDetail from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

// Database
import { deletePlant, markCareDone, updatePlant } from '@/lib/db/actions';

// Types
import { CareKind } from '@/types';

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: vi.fn(),
                refresh: vi.fn()
            };
        }
    };
});

vi.mock('@/lib/db/actions', () => {
    return {
        deletePlant: vi.fn(),
        markCareDone: vi.fn(),
        updatePlant: vi.fn()
    };
});

const props: React.ComponentProps<typeof PlantDetail> = {
    plant: makePlant()
};

describe('<PlantDetail />', () => {
    beforeEach(() => {
        vi.mocked(deletePlant).mockResolvedValue(undefined);
        vi.mocked(markCareDone).mockResolvedValue(undefined);
        vi.mocked(updatePlant).mockResolvedValue(undefined);
    });

    it('shows a notice when logging care fails', async () => {
        const user = userEvent.setup();
        vi.mocked(markCareDone).mockRejectedValue(new Error('db down'));

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );
        await user.click(screen.getByRole('button', {
            name: 'Mark watered as done'
        }));

        expect(await screen.findByText('Couldn\'t log that care. Please try again.')).toBeInTheDocument();
    });

    it('shows a success toast after deleting the plant', async () => {
        const user = userEvent.setup();
        vi.mocked(deletePlant).mockResolvedValue(undefined);

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: /^Remove /
        }));
        await user.click(screen.getByRole('button', {
            name: 'Delete forever'
        }));

        expect(await screen.findByText('Plant deleted.')).toBeInTheDocument();
    });

    it('logs watering as done at the current day', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Mark watered as done'
        }));

        expect(vi.mocked(markCareDone)).toHaveBeenCalledWith('plant-1', CareKind.Water, expect.any(Number));
    });

    it('logs care at the day picked from the calendar', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: /^Last watered/
        }));
        await user.click(screen.getByRole('button', {
            name: /November 15, 2023/
        }));

        expect(vi.mocked(markCareDone)).toHaveBeenCalledWith('plant-1', CareKind.Water, new Date(2023, 10, 15).getTime());
    });

    it('shows a notice when a picked care date cannot be logged', async () => {
        const user = userEvent.setup();

        vi.mocked(markCareDone).mockRejectedValue(new Error('db down'));
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: /^Last watered/
        }));
        await user.click(screen.getByRole('button', {
            name: /November 15, 2023/
        }));

        expect(await screen.findByText('Couldn\'t log that care. Please try again.')).toBeInTheDocument();
    });

    it('saves the edited schedule and leaves edit mode', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Edit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Save changes'
        }));

        expect(vi.mocked(updatePlant)).toHaveBeenCalledWith('plant-1', {
            nickname: '',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 12
            },
            potDiameter: undefined
        });
        expect(await screen.findByText('Schedule saved.')).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Edit'
        })).toBeInTheDocument();
    });

    it('saves the chosen pot size without logging care', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Set pot size'
        }));
        await user.click(screen.getByRole('radio', {
            name: '12 cm pot'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Save changes'
        }));

        expect(vi.mocked(updatePlant)).toHaveBeenCalledWith('plant-1', {
            nickname: '',
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 30,
                repotEveryMonths: 12
            },
            potDiameter: 12
        });
        expect(vi.mocked(markCareDone)).not.toHaveBeenCalled();
    });

    it('shows a notice when the schedule cannot be saved', async () => {
        const user = userEvent.setup();

        vi.mocked(updatePlant).mockRejectedValue(new Error('db down'));
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Edit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Save changes'
        }));

        expect(await screen.findByText('Couldn\'t save the schedule. Please try again.')).toBeInTheDocument();
    });

    it('returns to the schedule summary when the edit is cancelled', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Edit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Cancel'
        }));

        expect(screen.getByRole('button', {
            name: 'Edit'
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Save changes'
        })).not.toBeInTheDocument();
    });

    it('shows a notice when the delete fails', async () => {
        const user = userEvent.setup();

        vi.mocked(deletePlant).mockRejectedValue(new Error('db down'));
        vi.spyOn(console, 'error').mockImplementation(vi.fn());

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: /^Remove /
        }));
        await user.click(screen.getByRole('button', {
            name: 'Delete forever'
        }));

        expect(await screen.findByText('Couldn\'t delete this plant. Please try again.')).toBeInTheDocument();
    });

    it('keeps the plant when the confirmation is dismissed', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: /^Remove /
        }));
        await user.click(screen.getByRole('button', {
            name: 'Keep plant'
        }));

        expect(vi.mocked(deletePlant)).not.toHaveBeenCalled();
        expect(screen.queryByText('Delete Monstera deliciosa?')).not.toBeInTheDocument();
    });

    it('shows the common name when it differs from the nickname', () => {
        const plant = makePlant({
            nickname: 'Fern',
            commonName: 'Boston fern'
        });

        render(
            <ToastProvider>
                <PlantDetail {...props} plant={plant} />
            </ToastProvider>
        );

        expect(screen.getByText('Boston fern')).toBeInTheDocument();
    });

    it('scrolls back to the size form when the prompt is tapped again', async () => {
        const user = userEvent.setup();
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');

        render(
            <ToastProvider>
                <PlantDetail {...props} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Set pot size'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Set pot size'
        }));

        expect(scrollIntoView).toHaveBeenCalledTimes(2);
    });
});
