import type React from 'react';
import userEvent from '@testing-library/user-event';
import { getLocalTimeZone, today } from '@internationalized/date';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import LastCareFields from './index';

// Types
import { CareKind, type LastCareDates } from '@/types';

const props: React.ComponentProps<typeof LastCareFields> = {
    value: {},
    onChange: vi.fn()
};

describe('LastCareFields', () => {
    it('renders a labelled date input per care kind', () => {
        render(<LastCareFields {...props} />);

        expect(screen.getByLabelText('Watered')).toHaveAttribute('type', 'date');
        expect(screen.getByLabelText('Fertilised')).toHaveAttribute('type', 'date');
        expect(screen.getByLabelText('Repotted')).toHaveAttribute('type', 'date');
    });

    it('reports the picked date without touching the other kinds', async () => {
        const handleChange = vi.fn();
        const dates: LastCareDates = {
            [CareKind.Fertilize]: '2024-01-01'
        };
        const user = userEvent.setup();

        render(<LastCareFields {...props} value={dates} onChange={handleChange} />);

        await user.type(screen.getByLabelText('Watered'), '2024-02-02');

        expect(handleChange).toHaveBeenCalledWith({
            [CareKind.Fertilize]: '2024-01-01',
            [CareKind.Water]: '2024-02-02'
        });
    });

    it('caps every date input at today', () => {
        const maxDate = today(getLocalTimeZone()).toString();

        render(<LastCareFields {...props} />);

        expect(screen.getByLabelText('Watered')).toHaveAttribute('max', maxDate);
        expect(screen.getByLabelText('Fertilised')).toHaveAttribute('max', maxDate);
        expect(screen.getByLabelText('Repotted')).toHaveAttribute('max', maxDate);
    });

    it('renders the hint once when provided', () => {
        render(<LastCareFields {...props} hint="Today is assumed." />);

        expect(screen.getByText('Today is assumed.')).toBeInTheDocument();
    });
});
