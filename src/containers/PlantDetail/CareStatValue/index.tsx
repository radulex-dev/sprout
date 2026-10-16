import React from 'react';
import classNames from 'classnames';
import { Droplet } from 'lucide-react';

// Constants
import { NO_DUE_DATE_TEXT } from './constants';
import { SET_POT_SIZE_LABEL } from '@/components/PotSizePicker/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import Popover from '@/design-system/Popover';

// Helpers
import { daysUntilDue } from './helpers';
import { formatDue, nextDue, toDateValue } from '@/helpers/care';
import { getWaterAmountMl } from '@/helpers/pot';

// Styles
import styles from './styles.module.css';

// Types
import { CareKind, type Plant } from '@/types';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
    plant: Plant;
    kind: CareKind;
    now: number;
    onRequestPotSize: () => void;
}

const CareStatValue: React.FunctionComponent<Props> = ({ plant, kind, now, onRequestPotSize, ...props }) => {
    const due = nextDue(plant, kind);
    const amount = kind === CareKind.Water ? getWaterAmountMl(plant.potDiameter) : undefined;

    const renderValue = () => {
        if (due === undefined) {
            return (
                <span className={styles.root}>
                    {NO_DUE_DATE_TEXT}
                </span>
            );
        }

        const daysUntil = daysUntilDue(due, now);
        const valueClasses = classNames(styles.root, {
            [styles.overdue]: daysUntil < 0,
            [styles.due]: daysUntil <= 0
        });

        return (
            <Popover {...props} trigger={formatDue(daysUntil)} className={valueClasses}>
                {toDateValue(due)}
            </Popover>
        );
    };

    const renderPotSlot = () => {
        if (kind !== CareKind.Water) {
            return;
        }

        if (amount === undefined) {
            return (
                <Button className={styles.prompt} variant={ButtonVariant.Unstyled} onClick={onRequestPotSize}>
                    {SET_POT_SIZE_LABEL}
                </Button>
            );
        }

        return (
            <span className={styles.amount}>
                <Droplet aria-hidden size="0.75rem" />
                {`${amount} ml`}
            </span>
        );
    };

    return (
        <React.Fragment>
            {renderValue()}
            {renderPotSlot()}
        </React.Fragment>
    );
};

export default CareStatValue;
