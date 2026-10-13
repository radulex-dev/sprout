import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PlantsScreen from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const props: React.ComponentProps<typeof PlantsScreen> = {
    plants: [makePlant()]
};

describe('<PlantsScreen />', () => {
    it('renders the empty state when there are no plants', () => {
        render(<PlantsScreen {...props} plants={[]} />);

        expect(screen.getByRole('heading', {
            name: 'Sprout'
        })).toBeInTheDocument();
        expect(screen.getByText('Your plant collection')).toBeInTheDocument();
        expect(screen.getByRole('heading', {
            name: 'No plants yet'
        })).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('renders the plant grid when there are plants', () => {
        render(<PlantsScreen {...props} />);

        expect(screen.getByText('1 plant in your care')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByRole('link', {
            name: /Monstera deliciosa/
        })).toHaveAttribute('href', '/plants/plant-1');
    });

    it('links to the identify screen from the header', () => {
        render(<PlantsScreen {...props} />);

        expect(screen.getByRole('link', {
            name: /Add a plant/
        })).toHaveAttribute('href', '/identify');
    });
});
