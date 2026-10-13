import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PlantCommonNameSuffix from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const CALLER_CLASS_NAME = 'caller-class-name';

const props: React.ComponentProps<typeof PlantCommonNameSuffix> = {
    plant: makePlant({
        commonName: 'Swiss Cheese Plant'
    })
};

describe('<PlantCommonNameSuffix />', () => {
    it('renders the plant common name', () => {
        render(<PlantCommonNameSuffix {...props} />);

        expect(screen.getByText('Swiss Cheese Plant')).toBeInTheDocument();
    });

    it('keeps the caller class and the passed attributes', () => {
        render(<PlantCommonNameSuffix {...props} className={CALLER_CLASS_NAME} title="Also known as" />);

        expect(screen.getByText('Swiss Cheese Plant')).toHaveClass(CALLER_CLASS_NAME);
        expect(screen.getByTitle('Also known as')).toBeInTheDocument();
    });

    it('renders nothing when the plant has no common name', () => {
        render(<PlantCommonNameSuffix {...props} plant={makePlant()} />);

        expect(screen.queryByText(/\S/)).not.toBeInTheDocument();
    });
});
