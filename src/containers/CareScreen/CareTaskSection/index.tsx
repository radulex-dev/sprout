import classNames from 'classnames';
import React from 'react';

// Components
import TaskRow from '@/components/TaskRow';

// Helpers
import type { CareTask } from '@/helpers/care/types';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    title: string;
    tasks: CareTask[];
    onSelectPlant: (id: string) => void;
    emptyNotice?: string;
}

const CareTaskSection: React.FunctionComponent<Props> = ({ title, tasks, onSelectPlant, emptyNotice, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const shouldShowTitle = tasks.length > 0 || Boolean(emptyNotice);

    if (!shouldShowTitle) {
        return;
    }

    const renderTitle = () => {
        return (
            <h2 className={styles.sectionTitle}>
                {title}
            </h2>
        );
    };

    const renderEmptyNotice = () => {
        return (
            <div className={styles.notice}>
                {emptyNotice}
            </div>
        );
    };

    const renderTaskList = () => {
        return (
            <ul className={styles.taskList}>
                {tasks.map((task) => {
                    return (
                        <li key={`${task.plant.id}-${task.kind}`}>
                            <TaskRow task={task} onSelect={onSelectPlant} />
                        </li>
                    );
                })}
            </ul>
        );
    };

    const renderContent = () => {
        if (tasks.length === 0) {
            return emptyNotice && renderEmptyNotice();
        }

        return renderTaskList();
    };

    return (
        <div className={classes} {...props}>
            {renderTitle()}
            {renderContent()}
        </div>
    );
};

export default CareTaskSection;
