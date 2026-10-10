import { CircleAlert, CircleCheck, CircleX, Info, type LucideIcon } from 'lucide-react';

export enum ToastVariant {
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Error = 'error'
}

export const DEFAULT_TOAST_VARIANT = ToastVariant.Info;
export const TOAST_DISMISS_LABEL = 'Dismiss notification';
export const TOAST_TIMEOUT_INDEFINITE = 0;
export const TOAST_VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
    [ToastVariant.Info]: Info,
    [ToastVariant.Success]: CircleCheck,
    [ToastVariant.Warning]: CircleAlert,
    [ToastVariant.Error]: CircleX
};
