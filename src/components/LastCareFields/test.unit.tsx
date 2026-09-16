import userEvent from '@testing-library/user-event';
import { getLocalTimeZone, today } from '@internationalized/date';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import LastCareFields from './index';

// Types
import { CareKind, type LastCareDates } from '@/types';

const NO_DATES: LastCareDates = {};

const LABELS = ['Watered', 'Fertilised', 'Repotted'];

describe('LastCareFields', () => {
    it('renders a labelled date input per care kind', () => {
        const handleChange = vi.fn();

        render(<LastCareFields value={NO_DATES} onChange={handleChange} />);

        const inputs = LABELS.map((label) => {
            return screen.getByLabelText(label);
        });

        expect(inputs).toHaveLength(3);

        for (const input of inputs) {
            expect(input).toHaveAttribute('type', 'date');
        }
    });

    it('reports the picked date without touching the other kinds', async () => {
        const handleChange = vi.fn();
        const dates: LastCareDates = {
            [CareKind.Fertilize]: '2024-01-01'
        };
        const user = userEvent.setup();

        render(<LastCareFields value={dates} onChange={handleChange} />);

        await user.type(screen.getByLabelText('Watered'), '2024-02-02');

        expect(handleChange).toHaveBeenCalledWith({
            [CareKind.Fertilize]: '2024-01-01',
            [CareKind.Water]: '2024-02-02'
        });
    });

    it('caps every date input at today', () => {
        const handleChange = vi.fn();
        const maxDate = today(getLocalTimeZone()).toString();

        render(<LastCareFields value={NO_DATES} onChange={handleChange} />);

        for (const label of LABELS) {
            expect(screen.getByLabelText(label)).toHaveAttribute('max', maxDate);
        }
    });

    it('renders the hint once when provided', () => {
        const handleChange = vi.fn();

        render(<LastCareFields value={NO_DATES} onChange={handleChange} hint="Today is assumed." />);

        expect(screen.getByText('Today is assumed.')).toBeInTheDocument();
    });
});
