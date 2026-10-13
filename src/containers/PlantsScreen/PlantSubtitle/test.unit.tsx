import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PlantSubtitle from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const props: React.ComponentProps<typeof PlantSubtitle> = {
    plants: [makePlant()]
};

describe('<PlantSubtitle />', () => {
    it('renders the empty-collection copy when there are no plants', () => {
        render(<PlantSubtitle {...props} plants={[]} />);

        expect(screen.getByText('Your plant collection')).toBeInTheDocument();
    });

    it('renders the singular count for one plant', () => {
        render(<PlantSubtitle {...props} />);

        expect(screen.getByText('1 plant in your care')).toBeInTheDocument();
    });

    it('renders the plural count for several plants', () => {
        const plants = [
            makePlant(),
            makePlant({
                id: 'plant-2'
            })
        ];

        render(<PlantSubtitle {...props} plants={plants} />);

        expect(screen.getByText('2 plants in your care')).toBeInTheDocument();
    });
});
