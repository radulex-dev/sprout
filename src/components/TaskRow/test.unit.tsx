import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import TaskRow from './index';

// Mocks
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Types
import { CareKind } from '@/types';
import type { CareTask } from '@/helpers/care/types';

const props: React.ComponentProps<typeof TaskRow> = {
    task: {
        plant: makePlant(),
        kind: CareKind.Water,
        dueAt: NOW,
        daysUntil: 0
    },
    onSelect: vi.fn()
};

describe('TaskRow', () => {
    it('renders the task label, the plant name and the due state', () => {
        const task: CareTask = {
            plant: makePlant(),
            kind: CareKind.Water,
            dueAt: NOW - 3 * DAY_MS,
            daysUntil: -3
        };

        render(<TaskRow {...props} task={task} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('selects the plant when the row is activated', async () => {
        const handleSelect = vi.fn();
        const user = userEvent.setup();

        render(<TaskRow {...props} onSelect={handleSelect} />);
        await user.click(screen.getByRole('button', {
            name: /Water/
        }));

        expect(handleSelect).toHaveBeenCalledWith('plant-1');
    });

    it('offers no done action of its own', () => {
        render(<TaskRow {...props} />);

        expect(screen.queryByRole('button', {
            name: 'Done'
        })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });
});
