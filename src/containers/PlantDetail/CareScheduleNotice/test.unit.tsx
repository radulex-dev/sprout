import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareScheduleNotice from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const props: React.ComponentProps<typeof CareScheduleNotice> = {
    plant: makePlant(),
    onEdit: vi.fn()
};

describe('<CareScheduleNotice />', () => {
    it('renders the recorded pot size', () => {
        const plant = makePlant({
            potDiameter: 12
        });

        render(<CareScheduleNotice {...props} plant={plant} />);

        expect(screen.getByText('12 cm')).toBeInTheDocument();
    });

    it('renders Not set when the plant has no pot size', () => {
        render(<CareScheduleNotice {...props} />);

        expect(screen.getByText('Not set')).toBeInTheDocument();
    });
});
