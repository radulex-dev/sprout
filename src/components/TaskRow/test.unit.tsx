import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import TaskRow from './index';

// Types
import { CareKind } from '@/types';
import type { CareTask } from '@/helpers/care/types';

const makeTask = (daysUntil: number): CareTask => {
    return {
        plant: makePlant(),
        kind: CareKind.Water,
        dueAt: NOW + daysUntil * DAY_MS,
        daysUntil
    };
};

describe('TaskRow', () => {
    it('renders the task label, the plant name and the due state', () => {
        render(<TaskRow task={makeTask(-3)} onSelect={vi.fn()} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('selects the plant when the row is activated', async () => {
        const handleSelect = vi.fn();
        const user = userEvent.setup();

        render(<TaskRow task={makeTask(0)} onSelect={handleSelect} />);
        await user.click(screen.getByRole('button', {
            name: /Water/
        }));

        expect(handleSelect).toHaveBeenCalledWith('plant-1');
    });

    it('offers no done action of its own', () => {
        render(<TaskRow task={makeTask(0)} onSelect={vi.fn()} />);

        expect(screen.queryByRole('button', {
            name: 'Done'
        })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });
});
