import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareScheduleFields from './index';

const props: React.ComponentProps<typeof CareScheduleFields> = {
    value: {
        waterEveryDays: 7,
        fertilizeEveryDays: 30,
        repotEveryMonths: 18
    },
    onChange: vi.fn()
};

describe('CareScheduleFields', () => {
    it.each([{
        label: 'Fertilise',
        care: {
            waterEveryDays: 7,
            fertilizeEveryDays: undefined,
            repotEveryMonths: 18
        }
    }, {
        label: 'Repot',
        care: {
            waterEveryDays: 7,
            fertilizeEveryDays: 30,
            repotEveryMonths: undefined
        }
    }])('clears $label when never is chosen', async ({ label, care }) => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<CareScheduleFields {...props} onChange={handleChange} />);

        await user.click(screen.getByRole('combobox', {
            name: label
        }));
        await user.click(await screen.findByRole('option', {
            name: 'never'
        }));

        expect(handleChange).toHaveBeenCalledWith(care);
    });

    it('does not offer never for water', async () => {
        const user = userEvent.setup();

        render(<CareScheduleFields {...props} />);

        await user.click(screen.getByRole('combobox', {
            name: 'Water'
        }));

        expect(screen.queryByRole('option', {
            name: 'never'
        })).not.toBeInTheDocument();
    });
});
