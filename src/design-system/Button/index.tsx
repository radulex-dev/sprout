'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { type LucideIcon } from 'lucide-react';

// Constants
import { ButtonSize, ButtonVariant } from './constants';

// Styles
import styles from './styles.module.css';

interface BaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    grow?: boolean;
    round?: boolean;
    icon?: LucideIcon;
}

interface ButtonProps extends BaseProps, React.ComponentPropsWithoutRef<'button'> {
    href?: never;
}

interface AnchorProps extends BaseProps, React.ComponentPropsWithoutRef<'a'> {
    href: string;
    onClick?: never;
}

type Props = ButtonProps | AnchorProps;

export interface DiscriminatedButtonProps {
    Button: ButtonProps;
    Anchor: AnchorProps;
}

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
