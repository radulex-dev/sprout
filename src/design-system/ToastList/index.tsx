'use client';

import classNames from 'classnames';
import React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';

// Components
import Toast from '@/design-system/Toast';

// Styles
import styles from './styles.module.css';

interface Props extends React.ComponentProps<typeof BaseToast.Viewport> {}

const ToastList: React.FunctionComponent<Props> = ({ role = 'region', className, ...props }) => {
    const { toasts } = BaseToast.useToastManager();
    const classes = classNames(styles.viewport, className);

    return (
        <BaseToast.Viewport className={classes} role={role} {...props}>
            {toasts.map((toast) => {
                return <Toast key={toast.id} toast={toast} />;
            })}
        </BaseToast.Viewport>
    );
};

export default ToastList;
