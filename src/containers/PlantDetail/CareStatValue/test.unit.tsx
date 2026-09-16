import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import CareStatValue from './index';

// Helpers
import { toDateValue } from '@/helpers/care';

// Types
import { CareKind } from '@/types';

const WATER_ONLY = {
    waterEveryDays: 7,
    fertilizeEveryDays: 0,
    repotEveryMonths: 0
};

describe('CareStatValue', () => {
    it('renders an em dash when the interval is zero', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 0,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            }
        });

        render(<CareStatValue plant={plant} kind={CareKind.Water} now={NOW} />);

        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders no popup trigger when the interval is zero', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 0,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            }
        });

        render(<CareStatValue plant={plant} kind={CareKind.Water} now={NOW} />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the overdue text for an overdue plant', () => {
        const plant = makePlant({
            care: WATER_ONLY,
            lastCare: {
                [CareKind.Water]: NOW - 10 * DAY_MS,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });

        render(<CareStatValue plant={plant} kind={CareKind.Water} now={NOW} />);

        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('renders the upcoming text for a future task', () => {
        const plant = makePlant({
            care: WATER_ONLY,
            lastCare: {
                [CareKind.Water]: NOW - 2 * DAY_MS,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });

        render(<CareStatValue plant={plant} kind={CareKind.Water} now={NOW} />);

        expect(screen.getByText('in 5 days')).toBeInTheDocument();
    });

    it('reveals the due date when the value is clicked', async () => {
        const plant = makePlant({
            care: WATER_ONLY,
            lastCare: {
                [CareKind.Water]: NOW - 2 * DAY_MS,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });
        const user = userEvent.setup();

        render(<CareStatValue plant={plant} kind={CareKind.Water} now={NOW} />);

        const trigger = screen.getByRole('button', {
            name: 'in 5 days'
        });

        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('dialog', {
            name: 'in 5 days'
        })).toHaveTextContent(toDateValue(NOW + 5 * DAY_MS));
    });
});
