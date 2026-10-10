// Constants
import { type ToastVariant } from '@/design-system/Toast/constants';

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    timeout?: number;
}
