import React from 'react';
import classNames from 'classnames';
import { Droplet } from 'lucide-react';

// Constants
import { WATER_AMOUNT_ICON_SIZE, WATER_AMOUNT_UNIT, WaterAmountVariant } from './constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'span'> {
    amount?: number;
    variant?: WaterAmountVariant;
}

const WaterAmount: React.FunctionComponent<Props> = ({ amount, variant = WaterAmountVariant.Plain, className, ...props }) => {
    if (amount === undefined) {
        return;
    }

    const classes = classNames({
        [styles.flag]: variant === WaterAmountVariant.Flag,
        [styles.root]: variant === WaterAmountVariant.Plain
    }, className);

    return (
        <span className={classes} {...props}>
            <Droplet aria-hidden size={WATER_AMOUNT_ICON_SIZE} />
            {`${amount} ${WATER_AMOUNT_UNIT}`}
        </span>
    );
};

export default WaterAmount;
