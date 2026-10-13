import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import EditSchedule from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

const props: React.ComponentProps<typeof EditSchedule> = {
    plant: makePlant({
        nickname: 'Fern'
    }),
    onSave: vi.fn(),
    onCancel: vi.fn()
};

describe('<EditSchedule />', () => {
    it('prefills the nickname input from the plant', () => {
        render(<EditSchedule {...props} />);

        expect(screen.getByLabelText('Nickname')).toHaveValue('Fern');
    });

    it('prefills the care fields from the plant schedule', () => {
        render(<EditSchedule {...props} />);

        expect(screen.getAllByRole('combobox').map((field) => {
            return field.textContent;
        })).toEqual(['7 days', '30 days', '12 months']);
    });

    it('titles the schedule section Frequency', () => {
        render(<EditSchedule {...props} />);

        expect(screen.getByRole('heading', {
            name: 'Frequency'
        })).toBeInTheDocument();
    });
});
