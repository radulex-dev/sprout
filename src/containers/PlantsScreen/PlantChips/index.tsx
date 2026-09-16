import React from 'react';
import classNames from 'classnames';

// Constants
import { CARE_META } from '@/helpers/care/constants';

// Helpers
import { allTasks, formatDue } from '@/helpers/care';

// Styles
import styles from './styles.module.css';

// Types
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plant: Plant;
}

const PlantChips: React.FunctionComponent<Props> = ({ plant, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const tasks = allTasks([plant]);
    const urgent = tasks.filter((task) => {
        return task.daysUntil <= 0;
    }).slice(0, 2);
    const next = tasks.at(0);
    const NextMeta = next ? CARE_META[next.kind] : undefined;

    const renderUrgentChips = () => {
        return urgent.map((task) => {
            const chipClasses = classNames(styles.chip, {
                [styles.overdue]: task.daysUntil < 0,
                [styles.due]: task.daysUntil >= 0
            });
            const TaskIcon = CARE_META[task.kind].icon;

            return (
                <span key={task.kind} className={chipClasses}>
                    <TaskIcon size="0.75rem" aria-hidden />
                    <span>
                        {formatDue(task.daysUntil)}
                    </span>
                </span>
            );
        });
    };

    const renderNextChip = () => {
        if (!NextMeta || !next) {
            return;
        }

        return (
            <span className={styles.chip}>
                <NextMeta.icon size="0.75rem" aria-hidden />
                <span>
                    {NextMeta.label}
                </span>
                <span>
                    {formatDue(next.daysUntil)}
                </span>
            </span>
        );
    };

    const renderContent = () => {
        if (urgent.length > 0) {
            return renderUrgentChips();
        }

        return NextMeta && next ? renderNextChip() : undefined;
    };

    return (
        <div className={classes} {...props}>
            {renderContent()}
        </div>
    );
};

export default PlantChips;
