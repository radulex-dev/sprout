import React from 'react';
import classNames from 'classnames';

import { Camera, Sprout } from 'lucide-react';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const PlantsEmptyState: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <div className={classes} {...props}>
            <div className={styles.big}>
                <Sprout size="3rem" aria-hidden />
            </div>
            <h2>No plants yet</h2>
            <p>
                Point your camera at a plant to identify it and start tracking watering, fertilising
                and repotting.
            </p>
            <Button href="/identify" icon={Camera}>
                Identify your first plant
            </Button>
        </div>
    );
};

export default PlantsEmptyState;
