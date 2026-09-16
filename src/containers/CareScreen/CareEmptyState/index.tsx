import classNames from 'classnames';
import React from 'react';
import { Droplets } from 'lucide-react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const CareEmptyState: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <div className={classes} {...props}>
            <div className={styles.big}>
                <Droplets size="3rem" aria-hidden />
            </div>
            <h2>
                Nothing to do yet
            </h2>
            <p>
                Add plants and their watering, fertilising and repotting tasks will show up here.
            </p>
        </div>
    );
};

export default CareEmptyState;
