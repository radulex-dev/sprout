import React from 'react';
import classNames from 'classnames';

// Constants
import { EMPTY_COLLECTION_TEXT } from './constants';

// Styles
import styles from './styles.module.css';

// Types
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plants: Plant[];
}

const PlantSubtitle: React.FunctionComponent<Props> = ({ plants, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const renderText = () => {
        return plants.length === 0 ? EMPTY_COLLECTION_TEXT : `${plants.length} plant${plants.length === 1 ? '' : 's'} in your care`;
    };

    return (
        <div className={classes} {...props}>
            {renderText()}
        </div>
    );
};

export default PlantSubtitle;
