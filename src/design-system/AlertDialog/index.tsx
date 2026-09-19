'use client';

import React, { useCallback } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';
import { DEFAULT_CANCEL_LABEL, DEFAULT_CONFIRM_VARIANT, ESCAPE_REASON } from './constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

// Types
import type { AlertDialogChangeDetails } from './types';

export interface Props extends Omit<React.ComponentProps<typeof BaseAlertDialog.Root>, 'children'> {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirmVariant?: ButtonVariant;
    hideCancel?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children?: React.ReactNode;
}

const AlertDialog: React.FunctionComponent<Props> = ({ isOpen, title, description, confirmLabel, cancelLabel = DEFAULT_CANCEL_LABEL, confirmVariant = DEFAULT_CONFIRM_VARIANT, hideCancel = false, onConfirm, onCancel, children, ...props }) => {
    const handleConfirm = useCallback(() => {
        onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const handleOpenChange = useCallback((isNextOpen: boolean, changeDetails: AlertDialogChangeDetails) => {
        if (!isNextOpen && changeDetails.reason === ESCAPE_REASON) {
            onCancel();
        }
    }, [onCancel]);

    const renderContent = () => {
        if (!children) {
            return;
        }

        return (
            <div className={styles.content}>{children}</div>
        );
    };

    return (
        <BaseAlertDialog.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
            <BaseAlertDialog.Portal>
                <BaseAlertDialog.Backdrop className={styles.backdrop} />
                <BaseAlertDialog.Popup className={styles.popup}>
                    <BaseAlertDialog.Title className={styles.title}>{title}</BaseAlertDialog.Title>
                    <BaseAlertDialog.Description className={styles.description}>{description}</BaseAlertDialog.Description>
                    {renderContent()}
                    <div className={styles.actions}>
                        {!hideCancel && (
                            <BaseAlertDialog.Close render={<Button variant={ButtonVariant.Secondary} onClick={handleCancel} />}>
                                {cancelLabel}
                            </BaseAlertDialog.Close>
                        )}
                        <BaseAlertDialog.Close render={<Button variant={confirmVariant} onClick={handleConfirm} />}>
                            {confirmLabel}
                        </BaseAlertDialog.Close>
                    </div>
                </BaseAlertDialog.Popup>
            </BaseAlertDialog.Portal>
        </BaseAlertDialog.Root>
    );
};

export default AlertDialog;
