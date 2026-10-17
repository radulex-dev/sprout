'use client';

import classNames from 'classnames';
import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<typeof BaseField.Label>, 'htmlFor' | 'className'> {
    className?: string;
}

const FieldLabel: React.FunctionComponent<Props> = ({ nativeLabel = true, className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <BaseField.Label className={classes} nativeLabel={nativeLabel} {...props} />
    );
};

export default FieldLabel;
