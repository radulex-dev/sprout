'use client';

import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper } from 'lucide-react';

// Components
import CareEmptyState from './CareEmptyState';
import CareTaskSection from './CareTaskSection';

// Helpers
import { allTasks } from '@/helpers/care';
import type { CareTask } from '@/helpers/care/types';

// Hooks
import { useClock } from '@/hooks';

// Database
import { markCareDone } from '@/lib/db/actions';

// Styles
import styles from './styles.module.css';

// Types
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plants: Plant[];
}

const CareScreen: React.FunctionComponent<Props> = ({ plants, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const router = useRouter();

    const now = useClock(); // re-render tick; tasks computed against fresh Date.now()

    const tasks = useMemo(() => {
        return allTasks(plants, now);
    }, [plants, now]);
    const due = useMemo(() => {
        return tasks.filter((task) => {
            return task.daysUntil <= 0;
        });
    }, [tasks]);
    const upcoming = useMemo(() => {
        return tasks.filter((task) => {
            return task.daysUntil > 0 && task.daysUntil <= 14;
        });
    }, [tasks]);

    const handleDone = useCallback(async (task: CareTask) => {
        await markCareDone(task.plant.id, task.kind);
        router.refresh();
    }, [router]);

    const handleSelect = useCallback((id: string) => {
        router.push(`/plants/${id}`);
    }, [router]);

    return (
        <div className={classes} {...props}>
            <header className={styles.appHeader}>
                <div>
                    <h1>
                        Care
                    </h1>
                    <div className={styles.sub}>
                        {due.length === 0 ? (
                            <React.Fragment>
                                All plants are happy
                                <PartyPopper size="0.875rem" aria-hidden />
                            </React.Fragment>
                        ) : `${due.length} task${due.length === 1 ? ' needs' : 's need'} attention`}
                    </div>
                </div>
            </header>

            {plants.length === 0 ? (
                <CareEmptyState />
            ) : (
                <div className={styles.sections}>
                    <CareTaskSection title="Needs attention" tasks={due} onDone={handleDone} onSelectPlant={handleSelect} />
                    <CareTaskSection title="Coming up" tasks={upcoming} onDone={handleDone} onSelectPlant={handleSelect} emptyNotice="Nothing due in the next two weeks." />
                </div>
            )}
        </div>
    );
};

export default CareScreen;
