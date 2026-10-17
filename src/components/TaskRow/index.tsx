'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { capitalize } from 'lodash-es';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';
import { CARE_META } from '@/helpers/care/constants';

// Components
import Button from '@/design-system/Button';
import PlantPhoto from '@/components/PlantPhoto';
import WaterAmount from '@/components/WaterAmount';

// Helpers
import { displayName } from '@/helpers/plant';
import { formatDue } from '@/helpers/care';
import { getWaterAmountMl } from '@/helpers/pot';
import type { CareTask } from '@/helpers/care/types';

// Styles
import styles from './styles.module.css';

// Types
import { CareKind } from '@/types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
    task: CareTask;
    onSelect: (id: string) => void;
}

const TaskRow: React.FunctionComponent<Props> = ({ task, onSelect, className, ...props }) => {
    const meta = CARE_META[task.kind];
    const classes = classNames(styles.root, className);
    const whenClasses = classNames(styles.when, {
        [styles.overdue]: task.daysUntil < 0,
        [styles.due]: task.daysUntil === 0
    });

    const handleSelect = useCallback(() => {
        onSelect(task.plant.id);
    }, [onSelect, task]);

    const renderAmount = () => {
        if (task.kind !== CareKind.Water) {
            return;
        }

        return <WaterAmount amount={getWaterAmountMl(task.plant)} />;
    };

    return (
        <div className={classes} {...props}>
            <Button variant={ButtonVariant.Unstyled} className={styles.select} onClick={handleSelect}>
                <span className={styles.content}>
                    <PlantPhoto photo={task.plant.photo} alt={displayName(task.plant)} className={styles.thumb} />
                    <span className={styles.info}>
                        <span className={styles.title}>
                            <meta.icon size="0.875rem" aria-hidden />
                            <span>
                                {meta.label}
                            </span>
                            <span>
                                {displayName(task.plant)}
                            </span>
                        </span>
                        <span className={whenClasses}>
                            {capitalize(formatDue(task.daysUntil))}
                        </span>
                        {renderAmount()}
                    </span>
                </span>
            </Button>
        </div>
    );
};

export default TaskRow;
