'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Field } from '@base-ui/react/field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    max?: string;
}

const DatePicker: React.FunctionComponent<Props> = ({ label, value, onChange, hint, max, className, 'aria-label': ariaLabel = label, ...props }) => {
    const classes = classNames(styles.root, className);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    }, [onChange]);

    return (
        <Field.Root className={classes} {...props}>
            <Field.Label>
                {label}
            </Field.Label>
            <Field.Control type="date" value={value} max={max} aria-labelledby={undefined} onChange={handleChange} aria-label={ariaLabel} />
            {hint && (
                <Field.Description className={styles.hint}>
                    {hint}
                </Field.Description>
            )}
        </Field.Root>
    );
};

export default DatePicker;
