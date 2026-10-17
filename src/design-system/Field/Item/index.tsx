'use client';

import classNames from 'classnames';
import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<typeof BaseField.Item>, 'className'> {
    className?: string;
}

const FieldItem: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <BaseField.Item className={classes} {...props} />
    );
};

export default FieldItem;
