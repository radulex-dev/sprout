import React from 'react';
import classNames from 'classnames';
import { Droplet } from 'lucide-react';

// Constants
import { WATER_AMOUNT_ICON_SIZE, WaterAmountVariant } from './constants';

// Helpers
import { formatWaterAmount } from '@/helpers/pot';

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
            {formatWaterAmount(amount)}
        </span>
    );
};

export default WaterAmount;
