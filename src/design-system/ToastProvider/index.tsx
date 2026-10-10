'use client';

import React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';

// Constants
import { TOAST_LIMIT } from './constants';

// Components
import ToastList from '@/design-system/ToastList';

interface Props extends Omit<React.ComponentProps<typeof BaseToast.Provider>, 'children' | 'timeout'> {
    children: React.ReactNode;
}

const ToastProvider: React.FunctionComponent<Props> = ({ children, limit = TOAST_LIMIT, ...props }) => {
    return (
        <BaseToast.Provider limit={limit} {...props}>
            {children}
            <BaseToast.Portal>
                <ToastList />
            </BaseToast.Portal>
        </BaseToast.Provider>
    );
};

export default ToastProvider;
