import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareScheduleFields from './index';

const props: React.ComponentProps<typeof CareScheduleFields> = {
    value: {
        waterEveryDaysSpring: 7,
        waterEveryDaysSummer: 7,
        waterEveryDaysAutumn: 7,
        waterEveryDaysWinter: 7,
        waterAmountMl: 0,
        fertilizeEveryDays: 30,
        repotEveryMonths: 18
    },
    onChange: vi.fn()
};

describe('<CareScheduleFields />', () => {
    it.each([{
        label: 'Spring'
    }, {
        label: 'Summer'
    }, {
        label: 'Autumn'
    }, {
        label: 'Winter'
    }])('does not offer never for the $label water interval', async ({ label }) => {
        const user = userEvent.setup();

        render(<CareScheduleFields {...props} />);

        await user.click(screen.getByRole('combobox', {
            name: label
        }));

        expect(await screen.findByRole('option', {
            name: '2 days'
        })).toBeInTheDocument();
        expect(screen.queryByRole('option', {
            name: 'never'
        })).not.toBeInTheDocument();
    });

    it.each([{
        label: 'Spring',
        iconClassName: 'lucide-sprout'
    }, {
        label: 'Summer',
        iconClassName: 'lucide-sun'
    }, {
        label: 'Autumn',
        iconClassName: 'lucide-tree-deciduous'
    }, {
        label: 'Winter',
        iconClassName: 'lucide-snowflake'
    }])('renders a distinct $iconClassName glyph on the $label water row', ({ label, iconClassName }) => {
        render(<CareScheduleFields {...props} />);

        expect(screen.getByText(label).querySelector('svg')).toHaveClass(iconClassName);
    });
});
