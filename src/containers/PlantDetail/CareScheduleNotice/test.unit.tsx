import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { FALLBACK_CARE } from '@/helpers/care/constants';

// Components
import CareScheduleNotice from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const props: React.ComponentProps<typeof CareScheduleNotice> = {
    plant: makePlant(),
    onEdit: vi.fn()
};

describe('<CareScheduleNotice />', () => {
    it('renders the four seasonal water intervals', () => {
        const plant = makePlant({
            care: FALLBACK_CARE
        });

        render(<CareScheduleNotice {...props} plant={plant} />);

        expect(screen.getByText('Spring 7 · Summer 7 · Autumn 7 · Winter 7 days')).toBeInTheDocument();
    });

    it('renders the recorded pot size', () => {
        const plant = makePlant({
            potDiameter: 12
        });

        render(<CareScheduleNotice {...props} plant={plant} />);

        expect(screen.getByText('12 cm')).toBeInTheDocument();
    });

    it('renders the recorded soil volume', () => {
        const plant = makePlant({
            soilVolumeLitres: 60
        });

        render(<CareScheduleNotice {...props} plant={plant} />);

        expect(screen.getByText('60 L')).toBeInTheDocument();
    });

    it('renders Not set when the plant has no pot size', () => {
        render(<CareScheduleNotice {...props} />);

        expect(screen.getByText('Not set')).toBeInTheDocument();
    });
});
