import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import SelectField from './index';

const props: React.ComponentProps<typeof SelectField> = {
    label: 'Frequency',
    value: 'weekly',
    options: [{
        value: 'daily',
        label: 'Daily'
    }, {
        value: 'weekly',
        label: 'Weekly'
    }],
    onChange: vi.fn()
};

describe('<SelectField />', () => {
    it('renders the visible label', () => {
        render(<SelectField {...props} />);

        expect(screen.getByText('Frequency')).toBeInTheDocument();
    });

    it.each([{
        value: 'weekly',
        placeholder: 'Choose one',
        expected: 'Weekly'
    }, {
        value: '',
        placeholder: 'Choose one',
        expected: 'Choose one'
    }])('shows "$expected" as the control value', ({ value, placeholder, expected }) => {
        render(<SelectField {...props} value={value} placeholder={placeholder} />);

        expect(screen.getByRole('combobox')).toHaveTextContent(expected);
    });

    it('renders the hint when provided', () => {
        render(<SelectField {...props} hint="How often to water." />);

        expect(screen.getByText('How often to water.')).toBeInTheDocument();
    });

    it('disables the control when disabled', () => {
        render(<SelectField {...props} disabled />);

        expect(screen.getByRole('combobox')).toBeDisabled();
    });
});
