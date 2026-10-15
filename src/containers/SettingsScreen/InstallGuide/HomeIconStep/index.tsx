import classNames from 'classnames';
import React from 'react';
import { Sprout } from 'lucide-react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'span'> {}

const HomeIconStep: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <span className={classes} aria-hidden {...props}>
            <span className={styles.tile}>
                <Sprout size="1.75rem" />
            </span>
            <span className={styles.label}>
                Sprout
            </span>
        </span>
    );
};

export default HomeIconStep;
