import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import DatePicker from './index';

const props: React.ComponentProps<typeof DatePicker> = {
    label: 'Watered',
    value: '',
    onChange: vi.fn()
};

describe('DatePicker', () => {
    it('renders a date input associated with its visible label', () => {
        render(<DatePicker {...props} />);

        const input = screen.getByLabelText('Watered');

        expect(input).toHaveAttribute('type', 'date');
    });

    it('defaults the accessible name to the visible label', () => {
        render(<DatePicker {...props} />);

        expect(screen.getByLabelText('Watered')).toHaveAccessibleName('Watered');
    });

    it('lets an explicit aria-label override the default', () => {
        render(<DatePicker {...props} aria-label="Date last watered" />);

        const input = screen.getByLabelText('Date last watered');

        expect(input).toHaveAccessibleName('Date last watered');
    });

    it('renders the value it is given', () => {
        render(<DatePicker {...props} value="2026-09-06" />);

        expect(screen.getByLabelText('Watered')).toHaveValue('2026-09-06');
    });

    it('reports the picked date', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<DatePicker {...props} onChange={handleChange} />);

        await user.type(screen.getByLabelText('Watered'), '2026-09-06');

        expect(handleChange).toHaveBeenCalledWith('2026-09-06');
    });

    it('caps the input at the given max date', () => {
        render(<DatePicker {...props} max="2026-09-16" />);

        expect(screen.getByLabelText('Watered')).toHaveAttribute('max', '2026-09-16');
    });

    it('renders the hint below the input when provided', () => {
        render(<DatePicker {...props} hint="Leave blank for today." />);

        expect(screen.getByText('Leave blank for today.')).toBeInTheDocument();
    });

    it('describes the input with the hint', () => {
        render(<DatePicker {...props} hint="Leave blank for today." />);

        expect(screen.getByLabelText('Watered')).toHaveAccessibleDescription('Leave blank for today.');
    });

    it('wires the visible label to the control', () => {
        render(<DatePicker {...props} />);

        const input = screen.getByLabelText('Watered');

        expect(input).toHaveAccessibleName('Watered');
        expect(screen.getByText('Watered')).toHaveAttribute('for', input.id);
    });

    it('renders no hint when none is provided', () => {
        const { container } = render(<DatePicker {...props} />);

        expect(container.querySelector('[class*="hint"]')).toBeNull();
    });
});
