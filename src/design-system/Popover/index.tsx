'use client';

import React, { useId } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';
import { POPOVER_SIDE_OFFSET } from './constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
    trigger: React.ReactNode;
    children: React.ReactNode;
}

const Popover: React.FunctionComponent<Props> = ({ trigger, children, ...props }) => {
    const triggerId = useId();

    return (
        <BasePopover.Root>
            <BasePopover.Trigger id={triggerId} render={<Button variant={ButtonVariant.Unstyled} {...props} />}>
                {trigger}
            </BasePopover.Trigger>
            <BasePopover.Portal>
                <BasePopover.Positioner className={styles.positioner} sideOffset={POPOVER_SIDE_OFFSET}>
                    <BasePopover.Popup aria-labelledby={triggerId} className={styles.popup}>
                        {children}
                    </BasePopover.Popup>
                </BasePopover.Positioner>
            </BasePopover.Portal>
        </BasePopover.Root>
    );
};

export default Popover;
