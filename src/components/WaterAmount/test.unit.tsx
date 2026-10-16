import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { WaterAmountVariant } from './constants';

// Components
import WaterAmount from './index';

// Styles
import styles from './styles.module.css';

const props: React.ComponentProps<typeof WaterAmount> = {
    amount: 160
};

describe('<WaterAmount />', () => {
    it('renders the amount with its unit', () => {
        render(<WaterAmount {...props} />);

        expect(screen.getByText('160 ml')).toBeInTheDocument();
    });

    it('renders nothing when the amount is absent', () => {
        const { container } = render(<WaterAmount {...props} amount={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the flag treatment for the flag variant', () => {
        render(<WaterAmount {...props} variant={WaterAmountVariant.Flag} />);

        const amount = screen.getByText('160 ml');

        expect(amount).toHaveClass(styles.flag);
        expect(amount).not.toHaveClass(styles.root);
    });

    it('renders the plain treatment by default', () => {
        render(<WaterAmount {...props} />);

        const amount = screen.getByText('160 ml');

        expect(amount).toHaveClass(styles.root);
        expect(amount).not.toHaveClass(styles.flag);
    });
});
