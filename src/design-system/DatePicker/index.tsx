'use client';

import classNames from 'classnames';
import React from 'react';

// Components
import Field from '@/design-system/Field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'children' | 'type' | 'max'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    max?: string;
}

const DatePicker: React.FunctionComponent<Props> = ({ label, value, onChange, hint, max, className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <Field {...props} label={label} value={value} onValueChange={onChange} hint={hint} type="date" max={max} className={classes} />
    );
};

export default DatePicker;
