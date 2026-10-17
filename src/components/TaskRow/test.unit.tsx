import type React from 'react';
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

describe('<TaskRow />', () => {
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

    it('offers no done action of its own', () => {
        render(<TaskRow {...props} />);

        expect(screen.queryByRole('button', {
            name: 'Done'
        })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('renders the watering amount on a water row for a sized plant', () => {
        const task: CareTask = {
            plant: makePlant({
                potDiameter: 12
            }),
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        };

        render(<TaskRow {...props} task={task} />);

        expect(screen.getByText('80 ml')).toBeInTheDocument();
    });

    it('renders no amount on a fertilise row even when the plant has a pot size', () => {
        const task: CareTask = {
            plant: makePlant({
                potDiameter: 12
            }),
            kind: CareKind.Fertilize,
            dueAt: NOW,
            daysUntil: 0
        };

        render(<TaskRow {...props} task={task} />);

        expect(screen.queryByText('80 ml')).not.toBeInTheDocument();
    });

    it('renders no amount on a water row for a plant with no pot size', () => {
        const task: CareTask = {
            plant: makePlant(),
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        };

        render(<TaskRow {...props} task={task} />);

        expect(screen.queryByText(/ml/)).not.toBeInTheDocument();
    });

    it('renders the litre-derived amount on a water row for a litre-sized plant', () => {
        const task: CareTask = {
            plant: makePlant({
                soilVolumeLitres: 12
            }),
            kind: CareKind.Water,
            dueAt: NOW,
            daysUntil: 0
        };

        render(<TaskRow {...props} task={task} />);

        expect(screen.getByText('1.2 L')).toBeInTheDocument();
    });
});
