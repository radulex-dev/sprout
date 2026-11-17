import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareStats from './index';

// Mocks
import { makePlant, NOW } from '@test/vitest/data/plant.mock';

// Styles
import styles from './styles.module.css';

// Types
import { CareKind } from '@/types';

const props: React.ComponentProps<typeof CareStats> = {
    plant: makePlant({
        care: {
            waterEveryDaysSpring: 7,
            waterEveryDaysSummer: 7,
            waterEveryDaysAutumn: 7,
            waterEveryDaysWinter: 7,
            waterAmountMl: 80,
            fertilizeEveryDays: 30,
            repotEveryMonths: 12
        },
        potDiameter: 12,
        lastCare: {
            [CareKind.Water]: NOW,
            [CareKind.Fertilize]: NOW,
            [CareKind.Repot]: NOW
        }
    }),
    now: NOW,
    onRequestPotSize: vi.fn()
};

describe('<CareStats />', () => {
    it('renders the three care labels', () => {
        render(<CareStats {...props} />);

        expect(screen.getByText('Water')).toBeInTheDocument();
        expect(screen.getByText('Fertilise')).toBeInTheDocument();
        expect(screen.getByText('Repot')).toBeInTheDocument();
    });

    it('shows the season used for the watering interval', () => {
        render(<CareStats {...props} />);

        expect(screen.getByRole('img', {
            name: 'Autumn'
        })).toHaveClass(styles.seasonAutumn);
    });
});
