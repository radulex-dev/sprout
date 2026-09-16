'use client';

import React from 'react';
import classNames from 'classnames';
import { Plus } from 'lucide-react';

// Components
import Button from '@/design-system/Button';
import PlantGrid from './PlantGrid';
import PlantsEmptyState from './PlantsEmptyState';
import PlantSubtitle from './PlantSubtitle';

// Hooks
import { useClock } from '@/hooks';

// Styles
import styles from './styles.module.css';

// Types
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plants: Plant[];
}

const PlantsScreen: React.FunctionComponent<Props> = ({ plants, className, ...props }) => {
    useClock();

    const classes = classNames(styles.root, className);

    const renderContent = () => {
        if (plants.length === 0) {
            return <PlantsEmptyState />;
        }

        return <PlantGrid plants={plants} />;
    };

    return (
        <div className={classes} {...props}>
            <header className={styles.appHeader}>
                <div>
                    <h1>
                        Sprout
                    </h1>
                    <div className={styles.sub}>
                        <PlantSubtitle plants={plants} />
                    </div>
                </div>
                <Button href="/identify" icon={Plus}>
                    Add a plant
                </Button>
            </header>
            {renderContent()}
        </div>
    );
};

export default PlantsScreen;
