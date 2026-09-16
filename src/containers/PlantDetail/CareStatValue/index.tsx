import React from 'react';
import classNames from 'classnames';

// Constants
import { NO_DUE_DATE_TEXT } from './constants';

// Components
import Popover from '@/design-system/Popover';

// Helpers
import { daysUntilDue } from './helpers';
import { formatDue, nextDue, toDateValue } from '@/helpers/care';

// Styles
import styles from './styles.module.css';

// Types
import type { CareKind, Plant } from '@/types';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
    plant: Plant;
    kind: CareKind;
    now: number;
}

const CareStatValue: React.FunctionComponent<Props> = ({ plant, kind, now, ...props }) => {
    const due = nextDue(plant, kind);

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

export default CareStatValue;
