import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Constants
import { SELECT_DATE_TEXT } from '@/design-system/DateSelect/constants';

// Components
import CareLogRow from './index';

// Types
import { CareKind } from '@/types';

const LAST_WATERED = new Date(2026, 6, 6).getTime();
const TEN_DAYS_LATER = new Date(2026, 6, 16).getTime();
const SELECT_DATE_NAME = `Last watered: ${SELECT_DATE_TEXT}`;

const LAST_CARE = {
    [CareKind.Water]: LAST_WATERED,
    [CareKind.Fertilize]: LAST_WATERED,
    [CareKind.Repot]: LAST_WATERED
};

describe('CareLogRow', () => {
    it('renders the care label, the relative line and the select-date button', () => {
        const plant = makePlant();
        const handleDone = vi.fn();
        const handleSetDate = vi.fn();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={NOW} onDone={handleDone} onSetDate={handleSetDate} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Last: today')).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: SELECT_DATE_NAME
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Watered today'
        })).toHaveTextContent('Watered today');
    });

    it('calls onDone with the care kind when the button is clicked', async () => {
        const plant = makePlant();
        const handleDone = vi.fn();
        const handleSetDate = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={NOW} onDone={handleDone} onSetDate={handleSetDate} />);
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
        const handleSetDate = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} onSetDate={handleSetDate} />);

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
        const handleSetDate = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} onSetDate={handleSetDate} />);
        await user.click(screen.getByRole('button', {
            name: 'Last: 10 days ago'
        }));
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('reports the picked day with the care kind', async () => {
        const plant = makePlant({
            lastCare: LAST_CARE
        });
        const handleDone = vi.fn();
        const handleSetDate = vi.fn();
        const user = userEvent.setup();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} onSetDate={handleSetDate} />);
        await user.click(screen.getByRole('button', {
            name: SELECT_DATE_NAME
        }));
        await user.click(screen.getByRole('button', {
            name: 'July 2, 2026'
        }));

        expect(handleSetDate).toHaveBeenCalledWith(CareKind.Water, '2026-07-02');
    });

    it('reads today when the stored care lands a moment ahead of the clock', () => {
        const plant = makePlant({
            lastCare: {
                ...LAST_CARE,
                [CareKind.Water]: TEN_DAYS_LATER + 1
            }
        });
        const handleDone = vi.fn();
        const handleSetDate = vi.fn();

        render(<CareLogRow plant={plant} label={CareKind.Water} now={TEN_DAYS_LATER} onDone={handleDone} onSetDate={handleSetDate} />);

        expect(screen.getByText('Last: today')).toBeInTheDocument();
    });
});
