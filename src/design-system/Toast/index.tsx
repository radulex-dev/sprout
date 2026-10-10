'use client';

import classNames from 'classnames';
import React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { X } from 'lucide-react';

// Constants
import { DEFAULT_TOAST_VARIANT, TOAST_DISMISS_LABEL, TOAST_VARIANT_ICON, type ToastVariant } from './constants';

// Helpers
import { countdownRingStyle } from './helpers';

// Styles
import styles from './styles.module.css';

interface Props extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
    toast: BaseToast.Root.ToastObject;
}

const Toast: React.FunctionComponent<Props> = ({ toast, className, role = 'alert', ...props }) => {
    const variant = (toast.type as ToastVariant | undefined) ?? DEFAULT_TOAST_VARIANT;
    const Icon = TOAST_VARIANT_ICON[variant];
    const classes = classNames(styles.root, styles[variant], className);
    const timeout = toast.timeout ?? 0;

    const renderCountdown = () => {
        if (timeout <= 0) {
            return;
        }

        return (
            <svg className={styles.ring} viewBox="0 0 28 28" aria-hidden>
                <circle className={styles.ringCircle} cx="14" cy="14" r="12" style={countdownRingStyle(timeout)} />
            </svg>
        );
    };

    return (
        <BaseToast.Root toast={toast} className={classes} role={role} {...props}>
            <BaseToast.Content className={styles.content}>
                <span className={styles.icon}>
                    <Icon size="1.25rem" aria-hidden />
                </span>
                <div className={styles.body}>
                    <BaseToast.Title className={styles.title} />
                    <BaseToast.Description className={styles.description} />
                </div>
                <BaseToast.Close className={styles.close} aria-label={TOAST_DISMISS_LABEL}>
                    {renderCountdown()}
                    <X size="1rem" aria-hidden />
                </BaseToast.Close>
            </BaseToast.Content>
        </BaseToast.Root>
    );
};

export default Toast;
