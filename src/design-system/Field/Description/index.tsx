'use client';

import classNames from 'classnames';
import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<typeof BaseField.Description>, 'className'> {
    className?: string;
}

const FieldDescription: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <BaseField.Description className={classes} {...props} />
    );
};

export default FieldDescription;
