import React from 'react';
import classNames from 'classnames';
import Link from 'next/link';

// Components
import PlantPhoto from '@/components/PlantPhoto';
import PlantChips from '../PlantChips';

// Helpers
import { displayName } from '@/helpers/plant';

// Styles
import styles from './styles.module.css';

// Types
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'ul'> {
    plants: Plant[];
}

const PlantGrid: React.FunctionComponent<Props> = ({ plants, className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <ul className={classes} {...props}>
            {plants.map((plant) => {
                return (
                    <li key={plant.id} className={styles.plantCardItem}>
                        <Link href={`/plants/${plant.id}`} className={styles.plantCard}>
                            <div className={styles.photoFrame}>
                                <PlantPhoto photo={plant.photo} alt={displayName(plant)} className={styles.photo} />
                            </div>
                            <div className={styles.meta}>
                                <div className={styles.name}>
                                    {displayName(plant)}
                                </div>
                                <div className={styles.species}>
                                    {plant.species}
                                </div>
                                <div className={styles.chips}>
                                    <PlantChips plant={plant} />
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
};

export default PlantGrid;
