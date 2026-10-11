'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
    isChecked: boolean;
    onCheckedChange: (isChecked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const Switch: React.FunctionComponent<Props> = ({ isChecked, onCheckedChange, label, disabled = false, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const handleCheckedChange = useCallback((isNextChecked: boolean) => {
        onCheckedChange(isNextChecked);
    }, [onCheckedChange]);

    return (
        <BaseSwitch.Root className={classes} {...props} checked={isChecked} onCheckedChange={handleCheckedChange} disabled={disabled}>
            {label && (
                <span className={styles.label}>
                    {label}
                </span>
            )}
            <span className={styles.track}>
                <BaseSwitch.Thumb className={styles.thumb} />
            </span>
        </BaseSwitch.Root>
    );
};

export default Switch;
