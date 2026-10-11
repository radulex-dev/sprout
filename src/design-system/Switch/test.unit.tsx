import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import Switch from './index';

const props: React.ComponentProps<typeof Switch> = {
    isChecked: false,
    onCheckedChange: vi.fn()
};

describe('<Switch />', () => {
    it('names the switch from its label when one is given', () => {
        render(<Switch {...props} label="Care reminders" />);

        expect(screen.getByRole('switch', {
            name: 'Care reminders'
        })).toBeInTheDocument();
    });

    it('marks a checked switch as checked', () => {
        render(<Switch {...props} isChecked aria-label="Reminders" />);

        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('marks an unchecked switch as unchecked', () => {
        render(<Switch {...props} aria-label="Reminders" />);

        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it.each([{
        isChecked: false,
        expected: true
    }, {
        isChecked: true,
        expected: false
    }])('clicking with isChecked=$isChecked reports $expected', async ({ isChecked, expected }) => {
        const handleCheckedChange = vi.fn();
        const user = userEvent.setup();

        render(<Switch {...props} isChecked={isChecked} onCheckedChange={handleCheckedChange} aria-label="Reminders" />);

        await user.click(screen.getByRole('switch'));

        expect(handleCheckedChange).toHaveBeenCalledTimes(1);
        expect(handleCheckedChange).toHaveBeenCalledWith(expected);
    });

    it('disables the switch when disabled', () => {
        render(<Switch {...props} disabled aria-label="Reminders" />);

        expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
    });
});
