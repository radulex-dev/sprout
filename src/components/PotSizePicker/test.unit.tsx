import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// Constants
import { LITRES_INFO_LABEL, POT_DIAMETER_INFO_LABEL, POT_SIZE_HINT } from './constants';
import { DIAGRAM_TITLE as DIAMETER_DIAGRAM_TITLE } from './DiameterDiagram/constants';
import { DIAGRAM_TITLE as LITRES_DIAGRAM_TITLE } from './LitresDiagram/constants';

// Components
import PotSizePicker from './index';

// Styles
import styles from './styles.module.css';

// Types
import type { ContainerSize } from '@/helpers/pot/types';

const props: React.ComponentProps<typeof PotSizePicker> = {
    value: {},
    onChange: vi.fn()
};

describe('<PotSizePicker />', () => {
    it('renders the twelve pot sizes in ascending order', () => {
        render(<PotSizePicker {...props} />);

        const roundGroup = screen.getByRole('radiogroup', {
            name: 'Pot size'
        });

        expect(within(roundGroup).getAllByRole('radio')).toHaveLength(12);
        expect(within(roundGroup).getAllByRole('radio').map((radio) => {
            return radio.getAttribute('value');
        })).toEqual(['9', '10.5', '12', '13', '14', '15', '17', '19', '21', '24', '27', '30']);
    });

    it('names the 9 cm and 10.5 cm options', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.getByRole('radio', {
            name: 'Select 9 cm pot'
        })).toBeInTheDocument();
        expect(screen.getByRole('radio', {
            name: 'Select 10.5 cm pot'
        })).toBeInTheDocument();
    });

    it('offers the round pot and litres shapes', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.getByRole('radiogroup', {
            name: 'Container shape'
        })).toBeInTheDocument();
        expect(screen.getByRole('radio', {
            name: 'Round pot'
        })).toBeChecked();
        expect(screen.getByRole('radio', {
            name: 'Litres'
        })).not.toBeChecked();
    });

    it('reports the chosen diameter', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Select 12 cm pot'
        }));

        expect(props.onChange).toHaveBeenCalledWith({
            potDiameter: 12
        });
    });

    it('checks nothing while no value is set', () => {
        render(<PotSizePicker {...props} />);

        const roundGroup = screen.getByRole('radiogroup', {
            name: 'Pot size'
        });

        expect(within(roundGroup).queryAllByRole('radio', {
            checked: true
        })).toHaveLength(0);
    });

    it('checks only the option matching the value', () => {
        const size: ContainerSize = {
            potDiameter: 17
        };

        render(<PotSizePicker {...props} value={size} />);

        const roundGroup = screen.getByRole('radiogroup', {
            name: 'Pot size'
        });

        expect(screen.getByRole('radio', {
            name: 'Select 17 cm pot'
        })).toBeChecked();
        expect(within(roundGroup).getAllByRole('radio', {
            checked: true
        })).toHaveLength(1);
    });

    it('derives 80 ml for a 12 cm pot', () => {
        const size: ContainerSize = {
            potDiameter: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText('Select 12 cm pot · about 80 ml')).toBeInTheDocument();
    });

    it('hides the derived amount while no value is set', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByText(/^about /)).not.toBeInTheDocument();
    });

    it('hides the clear control while no value is set', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByRole('button', {
            name: 'Clear pot size'
        })).not.toBeInTheDocument();
    });

    it('opens the litres entry when the litres shape is chosen', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            potDiameter: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        expect(props.onChange).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Soil volume in litres')).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: LITRES_INFO_LABEL
        })).toBeInTheDocument();
    });

    it('keeps the litres diagram behind the info control', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        expect(screen.queryByRole('img', {
            name: LITRES_DIAGRAM_TITLE
        })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: LITRES_INFO_LABEL
        }));

        expect(await screen.findByRole('img', {
            name: LITRES_DIAGRAM_TITLE
        })).toBeInTheDocument();
    });

    it('returns to the round grid when the round pot shape is chosen', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        await user.click(screen.getByRole('radio', {
            name: 'Round pot'
        }));

        expect(props.onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('radio', {
            name: 'Select 12 cm pot'
        })).toBeInTheDocument();
    });

    it('keeps the chosen diameter when the shape tabs are switched back and forth', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            potDiameter: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));
        await user.click(screen.getByRole('radio', {
            name: 'Round pot'
        }));

        expect(props.onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('radio', {
            name: 'Select 12 cm pot'
        })).toBeChecked();
    });

    it('keeps the entered litres when the shape tabs are switched back and forth', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        await user.click(screen.getByRole('radio', {
            name: 'Round pot'
        }));
        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        expect(props.onChange).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Soil volume in litres')).toHaveValue('12');
    });

    it('prefills the litres entry from a stored soil volume', () => {
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByLabelText('Soil volume in litres')).toHaveValue('12');
    });

    it.each([{
        litres: 12,
        sentence: 'about 1.2 L'
    }, {
        litres: 60,
        sentence: 'about 6 L'
    }, {
        litres: 86,
        sentence: 'about 8.6 L'
    }])('reads back $litres L as $sentence', ({ litres, sentence }) => {
        const size: ContainerSize = {
            soilVolumeLitres: litres
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText(sentence)).toBeInTheDocument();
    });

    it.each(['0', '10.5', '-1', '1001', 'abc'])('rejects the litres entry %s without storing it', async (entered) => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));
        await user.click(screen.getByLabelText('Soil volume in litres'));
        await user.paste(entered);

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it('unsets the size when the litres entry is emptied', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        const { rerender } = render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText('about 1.2 L')).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Soil volume in litres'));

        expect(props.onChange).toHaveBeenLastCalledWith();

        rerender(<PotSizePicker {...props} value={undefined} />);

        expect(screen.queryByText('about 1.2 L')).not.toBeInTheDocument();
        expect(screen.queryByText('1.2 L')).not.toBeInTheDocument();
    });

    it.each(['1001', '12.5'])('shows a validation message for the invalid litres entry %s', async (entered) => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));
        await user.type(screen.getByLabelText('Soil volume in litres'), entered);

        expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole number of litres between 1 and 1000.');
    });

    it.each([1, 1000])('accepts the litres entry %s without a validation message', async (entered) => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));
        await user.type(screen.getByLabelText('Soil volume in litres'), String(entered));

        expect(props.onChange).toHaveBeenLastCalledWith({
            soilVolumeLitres: entered
        });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears the validation message when the litres entry is emptied', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        const entry = screen.getByLabelText('Soil volume in litres');

        await user.type(entry, '1001');
        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.clear(entry);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('hides the amount sentence while the litres entry is invalid', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText('about 1.2 L')).toBeInTheDocument();

        const entry = screen.getByLabelText('Soil volume in litres');

        await user.clear(entry);
        await user.type(entry, '1001');

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByText(/^about /)).not.toBeInTheDocument();
    });

    it.each([{
        litres: 1,
        height: '3.2%'
    }, {
        litres: 12,
        height: '11%'
    }, {
        litres: 60,
        height: '24.5%'
    }, {
        litres: 86,
        height: '29.3%'
    }, {
        litres: 100,
        height: '31.6%'
    }, {
        litres: 200,
        height: '44.7%'
    }, {
        litres: 625,
        height: '79.1%'
    }, {
        litres: 1000,
        height: '100%'
    }])('fills $litres L to $height of the bar', ({ litres, height }) => {
        const size: ContainerSize = {
            soilVolumeLitres: litres
        };

        const { container } = render(<PotSizePicker {...props} value={size} />);

        expect(container.querySelector(`.${styles.fill}`)).toHaveStyle({
            height
        });
    });

    it('shows the dose in the gutter for a stored volume', () => {
        const size: ContainerSize = {
            soilVolumeLitres: 60
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText('6 L')).toHaveStyle({
            bottom: '24.5%'
        });
    });

    it('renders no dose while the litres entry is empty', async () => {
        const user = userEvent.setup();

        const { container } = render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        expect(container.querySelector(`.${styles.dosePill}`)).not.toBeInTheDocument();
    });

    it('hides the dose while the litres entry is invalid', async () => {
        const user = userEvent.setup();
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.getByText('1.2 L')).toBeInTheDocument();

        const entry = screen.getByLabelText('Soil volume in litres');

        await user.clear(entry);
        await user.type(entry, '1001');

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByText('1.2 L')).not.toBeInTheDocument();
    });

    it('hides the dose scale from assistive technology', () => {
        const size: ContainerSize = {
            soilVolumeLitres: 60
        };

        const { container } = render(<PotSizePicker {...props} value={size} />);

        expect(container.querySelector(`.${styles.gutter}`)).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector(`.${styles.bar}`)).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders the four graduation marks in the bar', () => {
        const size: ContainerSize = {
            soilVolumeLitres: 60
        };

        const { container } = render(<PotSizePicker {...props} value={size} />);

        expect(container.querySelectorAll(`.${styles.doseTick}`)).toHaveLength(4);
    });

    it.each(['10 L', '20 L', '30 L', '50 L', '100 L'])('drops the %s container tick from the litres scale', (label) => {
        const size: ContainerSize = {
            soilVolumeLitres: 12
        };

        render(<PotSizePicker {...props} value={size} />);

        expect(screen.queryByText(label)).not.toBeInTheDocument();
    });

    it('shows no amount on the litres branch until litres are entered', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} />);

        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        expect(screen.getByLabelText('Soil volume in litres')).toHaveValue('');
        expect(screen.queryByText(/^about /)).not.toBeInTheDocument();
    });

    it('renders the hint when one is provided', () => {
        render(<PotSizePicker {...props} hint={POT_SIZE_HINT} />);

        expect(screen.getByText(POT_SIZE_HINT)).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', {
            name: 'Pot size'
        })).toHaveAccessibleDescription(POT_SIZE_HINT);
    });

    it('keeps the round hint visible and the diagram behind its info control', async () => {
        const user = userEvent.setup();

        render(<PotSizePicker {...props} hint={POT_SIZE_HINT} />);

        expect(screen.getByText(POT_SIZE_HINT)).toBeInTheDocument();
        expect(screen.queryByRole('img', {
            name: DIAMETER_DIAGRAM_TITLE
        })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: POT_DIAMETER_INFO_LABEL
        }));

        expect(await screen.findByRole('img', {
            name: DIAMETER_DIAGRAM_TITLE
        })).toBeInTheDocument();
    });

    it('renders no hint without one', () => {
        render(<PotSizePicker {...props} />);

        expect(screen.queryByText(POT_SIZE_HINT)).not.toBeInTheDocument();
    });
});
