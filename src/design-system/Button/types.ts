import type { ComponentPropsWithoutRef } from 'react';
import type { LucideIcon } from 'lucide-react';

// Constants
import type { ButtonSize, ButtonVariant } from './constants';

export interface BaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    grow?: boolean;
    round?: boolean;
    icon?: LucideIcon;
}

export interface ButtonProps extends BaseProps, ComponentPropsWithoutRef<'button'> {
    href?: never;
}

export interface AnchorProps extends BaseProps, ComponentPropsWithoutRef<'a'> {
    href: string;
    onClick?: never;
}
