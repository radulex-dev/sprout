import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import PlantChips from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

// Types
import { CareKind } from '@/types';

const props: React.ComponentProps<typeof PlantChips> = {
    plant: makePlant()
};

describe('<PlantChips />', () => {
    it('renders an overdue chip for a task past its due date', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 2
            },
            lastCare: {
                [CareKind.Water]: now - 5 * DAY_MS,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            }
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });

    it('renders a due chip for a task due today', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 1
            },
            lastCare: {
                [CareKind.Water]: now - DAY_MS,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            }
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('due today')).toBeInTheDocument();
    });

    it('caps urgent chips at two tasks', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 2,
                fertilizeEveryDays: 30,
                repotEveryMonths: 1
            },
            lastCare: {
                [CareKind.Water]: now - 5 * DAY_MS,
                [CareKind.Fertilize]: now - 35 * DAY_MS,
                [CareKind.Repot]: now - 38 * DAY_MS
            }
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('8 days overdue')).toBeInTheDocument();
        expect(screen.getByText('5 days overdue')).toBeInTheDocument();
        expect(screen.queryByText('3 days overdue')).not.toBeInTheDocument();
    });

    it('renders the next care chip when nothing is urgent', () => {
        const now = Date.now();
        const plant = makePlant({
            lastCare: {
                [CareKind.Water]: now,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            }
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('in 7 days')).toBeInTheDocument();
    });

    it('renders the water amount flag when watering is due', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 2
            },
            lastCare: {
                [CareKind.Water]: now - 5 * DAY_MS,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            },
            potDiameter: 12
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('80 ml')).toBeInTheDocument();
    });

    it('renders no water amount flag when watering is not due', () => {
        const now = Date.now();
        const plant = makePlant({
            lastCare: {
                [CareKind.Water]: now,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            },
            potDiameter: 12
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.queryByText('80 ml')).not.toBeInTheDocument();
    });

    it('renders no water amount flag when the plant has no pot size', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 2
            },
            lastCare: {
                [CareKind.Water]: now - 5 * DAY_MS,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            }
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.queryByText('80 ml')).not.toBeInTheDocument();
    });

    it('renders the litre-derived water amount flag when watering is due', () => {
        const now = Date.now();
        const plant = makePlant({
            care: {
                waterEveryDays: 2
            },
            lastCare: {
                [CareKind.Water]: now - 5 * DAY_MS,
                [CareKind.Fertilize]: now,
                [CareKind.Repot]: now
            },
            soilVolumeLitres: 12
        });

        render(<PlantChips {...props} plant={plant} />);

        expect(screen.getByText('1.2 L')).toBeInTheDocument();
    });

    it('renders no chips when the plant has no care intervals', () => {
        const plant = makePlant({
            care: {
                waterEveryDays: 0,
                fertilizeEveryDays: 0,
                repotEveryMonths: 0
            }
        });

        const { container } = render(<PlantChips {...props} plant={plant} />);

        expect(container.firstElementChild).toBeEmptyDOMElement();
    });
});
