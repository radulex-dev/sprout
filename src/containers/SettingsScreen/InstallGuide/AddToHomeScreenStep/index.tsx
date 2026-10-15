import classNames from 'classnames';
import React from 'react';
import { SquarePlus } from 'lucide-react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'span'> {}

const AddToHomeScreenStep: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <span className={classes} aria-hidden {...props}>
            <span className={styles.icon}>
                <SquarePlus size="0.875rem" />
            </span>
            <span className={styles.label}>
                Add to Home Screen
            </span>
        </span>
    );
};

export default AddToHomeScreenStep;
