'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

// Constants
import { ButtonSize, ButtonVariant } from './constants';

// Styles
import styles from './styles.module.css';

// Types
import type { AnchorProps, ButtonProps } from './types';

export type Props = ButtonProps | AnchorProps;

const Button: React.FunctionComponent<Props> = ({ variant = ButtonVariant.Default, size = ButtonSize.Md, block = false, grow = false, round = false, className, icon: Icon, children, ...props }) => {
    const classes = classNames(styles.root, {
        [styles[variant]]: variant !== ButtonVariant.Unstyled,
        [styles.block]: block,
        [styles.grow]: grow,
        [styles.sm]: size === ButtonSize.Sm,
        [styles.round]: round
    }, className);

    const renderContent = () => {
        return (
            <React.Fragment>
                {Icon && <Icon size="1rem" aria-hidden />}
                {children}
            </React.Fragment>
        );
    };

    if (props.href !== undefined) {
        return (
            <Link className={classes} {...props}>
                {renderContent()}
            </Link>
        );
    }

    return (
        <BaseButton className={classes} {...props} type={props.type ?? 'button'}>
            {renderContent()}
        </BaseButton>
    );
};

export default Button;
