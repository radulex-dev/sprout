import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { DAY_MS } from '@/helpers/care/constants';

// Components
import PlantGrid from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

// Types
import { CareKind } from '@/types';

const props: React.ComponentProps<typeof PlantGrid> = {
    plants: [makePlant()]
};

describe('<PlantGrid />', () => {
    it('renders no cards when there are no plants', () => {
        render(<PlantGrid {...props} plants={[]} />);

        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('renders a card per plant', () => {
        const plants = [
            makePlant(),
            makePlant({
                id: 'plant-2'
            })
        ];

        render(<PlantGrid {...props} plants={plants} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    it('links each card to its plant page with the display name and photo', () => {
        const plants = [
            makePlant({
                nickname: 'Fernie',
                photo: '/plants/plant-1/photo'
            })
        ];

        render(<PlantGrid {...props} plants={plants} />);

        expect(screen.getByRole('link', {
            name: /Fernie/
        })).toHaveAttribute('href', '/plants/plant-1');
        expect(screen.getByRole('img', {
            name: 'Fernie'
        })).toHaveAttribute('src', '/plants/plant-1/photo');
        expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    });

    it('renders the due chips for a plant', () => {
        const now = Date.now();
        const plants = [
            makePlant({
                care: {
                    waterEveryDays: 2
                },
                lastCare: {
                    [CareKind.Water]: now - 5 * DAY_MS,
                    [CareKind.Fertilize]: now,
                    [CareKind.Repot]: now
                }
            })
        ];

        render(<PlantGrid {...props} plants={plants} />);

        expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });
});
