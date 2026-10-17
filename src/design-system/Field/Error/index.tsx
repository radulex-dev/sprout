'use client';

import classNames from 'classnames';
import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<typeof BaseField.Error>, 'className'> {
    className?: string;
}

const FieldError: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <BaseField.Error className={classes} role="alert" {...props} />
    );
};

export default FieldError;
