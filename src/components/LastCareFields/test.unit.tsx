import type React from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import LastCareFields from './index';

const props: React.ComponentProps<typeof LastCareFields> = {
    value: {},
    onChange: vi.fn()
};

describe('<LastCareFields />', () => {
    it('renders a labelled date input per care kind', () => {
        render(<LastCareFields {...props} />);

        expect(screen.getByLabelText('Watered')).toHaveAttribute('type', 'date');
        expect(screen.getByLabelText('Fertilised')).toHaveAttribute('type', 'date');
        expect(screen.getByLabelText('Repotted')).toHaveAttribute('type', 'date');
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
