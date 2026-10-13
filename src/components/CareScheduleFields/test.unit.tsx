import userEvent from '@testing-library/user-event';
import type React from 'react';
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

describe('<CareScheduleFields />', () => {
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
