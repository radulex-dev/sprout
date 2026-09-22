import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import CareStatValue from './index';

// Helpers
import { toDateValue } from '@/helpers/care';

// Mocks
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Types
import { CareKind } from '@/types';

const props: React.ComponentProps<typeof CareStatValue> = {
    plant: makePlant({
        care: {
            waterEveryDays: 7,
            fertilizeEveryDays: 0,
            repotEveryMonths: 0
        },
        lastCare: {
            [CareKind.Water]: NOW - 2 * DAY_MS,
            [CareKind.Fertilize]: NOW,
            [CareKind.Repot]: NOW
        }
    }),
    kind: CareKind.Water,
    now: NOW
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

        render(<CareStatValue {...props} plant={plant} />);

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

        render(<CareStatValue {...props} plant={plant} />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the overdue text for an overdue plant', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 7,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            },
            lastCare: {
                [CareKind.Water]: NOW - 10 * DAY_MS,
                [CareKind.Fertilize]: NOW,
                [CareKind.Repot]: NOW
            }
        });

        render(<CareStatValue {...props} plant={plant} />);

        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('renders the upcoming text for a future task', () => {
        render(<CareStatValue {...props} />);

        expect(screen.getByText('in 5 days')).toBeInTheDocument();
    });

    it('reveals the due date when the value is clicked', async () => {
        const user = userEvent.setup();

        render(<CareStatValue {...props} />);

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
