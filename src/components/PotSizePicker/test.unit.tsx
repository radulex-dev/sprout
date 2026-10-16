import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PotSizePicker from './index';

const props: React.ComponentProps<typeof PotSizePicker> = {
    value: undefined,
    onChange: vi.fn()
};

describe('<PotSizePicker />', () => {
    it('renders the twelve pot sizes in ascending order', () => {
        render(<PotSizePicker {...props} />);

        const radios = screen.getAllByRole('radio');

        expect(radios).toHaveLength(12);
        expect(radios.map((radio) => {
            return radio.getAttribute('value');
        })).toEqual(['9', '10.5', '12', '13', '14', '15', '17', '19', '21', '24', '27', '30']);
    });

    it('names the 9 cm and 10.5 cm options', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.getByRole('radio', {
            name: '9 cm pot'
        })).toBeInTheDocument();
        expect(screen.getByRole('radio', {
            name: '10.5 cm pot'
        })).toBeInTheDocument();
    });

    it('reports the chosen diameter', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: '12 cm pot'
        }));

        expect(props.onChange).toHaveBeenCalledWith(12);
    });

    it('checks nothing while no value is set', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryAllByRole('radio', {
            checked: true
        })).toHaveLength(0);
    });

    it('checks only the option matching the value', () => {
        render(<PotSizePicker {...props} value={17} />);

        expect(screen.getByRole('radio', {
            name: '17 cm pot'
        })).toBeChecked();
        expect(screen.getAllByRole('radio', {
            checked: true
        })).toHaveLength(1);
    });

    it('hides the clear control while no value is set', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByRole('button', {
            name: 'Clear pot size'
        })).not.toBeInTheDocument();
    });

    it('derives 160 ml for a 12 cm pot', () => {
        render(<PotSizePicker {...props} value={12} />);

        expect(screen.getByText('12 cm pot · about 160 ml per watering')).toBeInTheDocument();
    });

    it('derives 2000 ml for a 30 cm pot', () => {
        render(<PotSizePicker {...props} value={30} />);

        expect(screen.getByText('30 cm pot · about 2000 ml per watering')).toBeInTheDocument();
    });

    it('hides the derived amount while no value is set', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByText(/per watering/)).not.toBeInTheDocument();
    });

    it('renders the hint when one is provided', () => {
        render(<PotSizePicker {...props} hint="Measure across the top of the pot." />);

        expect(screen.getByText('Measure across the top of the pot.')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Measure across the top of the pot.');
    });

    it('renders no hint without one', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByText('Optional · Measure across the top of the pot, in cm.')).not.toBeInTheDocument();
    });

    it('names the group after the field label', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.getByRole('radiogroup', {
            name: 'Pot size'
        })).toBeInTheDocument();
    });
});
