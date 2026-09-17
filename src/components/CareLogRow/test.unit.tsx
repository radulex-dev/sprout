import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Components
import CareLogRow from './index';

// Types
import { CareKind } from '@/types';

const LAST_WATERED = new Date(2026, 6, 6).getTime();
const TEN_DAYS_LATER = new Date(2026, 6, 16).getTime();

const LAST_CARE = {
    [CareKind.Water]: LAST_WATERED,
    [CareKind.Fertilize]: LAST_WATERED,
    [CareKind.Repot]: LAST_WATERED
};

describe('CareLogRow', () => {
    it('renders the care label and the done button', () => {
        const plant = makePlant();
        const handleDone = vi.fn();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={NOW} onDone={handleDone} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Last: today')).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Watered today'
        })).toBeInTheDocument();
    });

    it('calls onDone with the care kind when the button is clicked', async () => {
        const plant = makePlant();
        const handleDone = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={NOW} onDone={handleDone} />);
        await user.click(screen.getByRole('button', {
            name: 'Watered today'
        }));

        expect(handleDone).toHaveBeenCalledWith(CareKind.Water);
    });

    it('reveals the stored care date when the relative-time line is clicked', async () => {
        const plant = makePlant({
            lastCare: LAST_CARE
        });
        const handleDone = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} />);

        const trigger = screen.getByRole('button', {
            name: 'Last: 10 days ago'
        });

        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('dialog', {
            name: 'Last: 10 days ago'
        })).toHaveTextContent('2026-07-06');
    });

    it('closes the date popup on Escape', async () => {
        const plant = makePlant({
            lastCare: LAST_CARE
        });
        const handleDone = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} />);
        await user.click(screen.getByRole('button', {
            name: 'Last: 10 days ago'
        }));
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
