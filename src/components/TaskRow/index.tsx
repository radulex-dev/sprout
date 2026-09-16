'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { capitalize } from 'lodash-es';
import { Check } from 'lucide-react';

// Constants
import { ButtonSize, ButtonVariant } from '@/design-system/Button/constants';
import { CARE_META } from '@/helpers/care/constants';

// Components
import Button from '@/design-system/Button';
import PlantPhoto from '@/components/PlantPhoto';

// Helpers
import { displayName } from '@/helpers/plant';
import { formatDue } from '@/helpers/care';
import type { CareTask } from '@/helpers/care/types';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
    task: CareTask;
    onDone: (t: CareTask) => void;
    onSelect: (id: string) => void;
}

const TaskRow: React.FunctionComponent<Props> = ({ task, onDone, onSelect, className, ...props }) => {
    const meta = CARE_META[task.kind];
    const classes = classNames(styles.root, className);
    const whenClasses = classNames(styles.when, {
        [styles.overdue]: task.daysUntil < 0,
        [styles.due]: task.daysUntil === 0
    });

    const handleSelect = useCallback(() => {
        onSelect(task.plant.id);
    }, [onSelect, task]);

    const handleDone = useCallback(() => {
        onDone(task);
    }, [onDone, task]);

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
                    </span>
                </span>
            </Button>
            {task.daysUntil <= 0 && (
                <Button variant={ButtonVariant.Soft} size={ButtonSize.Sm} onClick={handleDone} icon={Check} className={styles.done}>
                    Done
                </Button>
            )}
        </div>
    );
};

export default TaskRow;
