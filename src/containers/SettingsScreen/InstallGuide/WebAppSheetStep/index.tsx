import classNames from 'classnames';
import React from 'react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'span'> {}

const WebAppSheetStep: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <span className={classes} aria-hidden {...props}>
            <span className={styles.row}>
                <span className={styles.label}>
                    Name
                </span>
                <span className={styles.field}>
                    Sprout
                </span>
            </span>
            <span className={styles.row}>
                <span className={styles.label}>
                    Open as Web App
                </span>
                <span className={styles.toggle}>
                    <span className={styles.knob} />
                </span>
            </span>
            <span className={styles.actions}>
                <span className={styles.button}>
                    Add
                </span>
            </span>
        </span>
    );
};

export default WebAppSheetStep;
