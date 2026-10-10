import React, { useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';
import { TOAST_TIMEOUT_INDEFINITE, ToastVariant } from '@/design-system/Toast/constants';

// Components
import Button from '@/design-system/Button';
import ToastProvider from '@/design-system/ToastProvider';

// Hooks
import { useToast } from '@/design-system/hooks/useToast';

// Types
import type { ToastOptions } from './types';

const VARIANT_TITLES: Record<ToastVariant, string> = {
    [ToastVariant.Info]: 'Heads up',
    [ToastVariant.Success]: 'Saved',
    [ToastVariant.Warning]: 'Careful',
    [ToastVariant.Error]: 'Something went wrong'
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
};

const UseToastDemo: React.FunctionComponent<ToastOptions> = ({ title, description, variant, timeout }) => {
    const toast = useToast();

    const handleShow = useCallback((): void => {
        toast({
            title,
            description,
            variant,
            timeout
        });
    }, [toast, title, description, variant, timeout]);

    return (
        <Button onClick={handleShow}>toast(options)</Button>
    );
};

const TimeoutDemo: React.FunctionComponent<ToastOptions> = ({ title, variant }) => {
    const toast = useToast();

    const handleShow = useCallback((timeout: number) => {
        return (): void => {
            toast({
                title,
                variant,
                timeout
            });
        };
    }, [toast, title, variant]);

    return (
        <div style={rowStyle}>
            <Button onClick={handleShow(4000)}>Auto-dismiss after 4s</Button>
            <Button variant={ButtonVariant.Secondary} onClick={handleShow(TOAST_TIMEOUT_INDEFINITE)}>Indefinite (0)</Button>
        </div>
    );
};

const VariantsDemo: React.FunctionComponent<ToastOptions> = ({ timeout }) => {
    const toast = useToast();

    const handleShow = useCallback((variant: ToastVariant) => {
        return (): void => {
            toast({
                title: VARIANT_TITLES[variant],
                variant,
                timeout
            });
        };
    }, [toast, timeout]);

    return (
        <div style={rowStyle}>
            {Object.values(ToastVariant).map((variant) => {
                return (
                    <Button key={variant} variant={ButtonVariant.Secondary} onClick={handleShow(variant)}>
                        {VARIANT_TITLES[variant]}
                    </Button>
                );
            })}
        </div>
    );
};

const meta = {
    title: 'Hooks/useToast',
    component: UseToastDemo,
    tags: ['autodocs'],
    args: {
        title: 'Plant added to your collection',
        description: 'Monstera deliciosa · 92% match',
        variant: ToastVariant.Info,
        timeout: 5000
    },
    argTypes: {
        variant: {
            control: 'select',
            options: Object.values(ToastVariant)
        },
        timeout: {
            control: 'number',
            description: 'Milliseconds before auto-dismiss. Omitting it is the default and means indefinite (`TOAST_TIMEOUT_INDEFINITE` = 0) — the toast stays until dismissed; any value above 0 adds a countdown ring.'
        }
    },
    parameters: {
        docs: {
            description: {
                component: 'useToast returns a `toast(options)` function. Every toast is owned by the nearest ToastProvider, and the hook is the only supported way to raise one — reach for `Components/Toast` when you need the rendering pieces.'
            }
        }
    },
    render: (args) => {
        return (
            <ToastProvider>
                <UseToastDemo {...args} />
            </ToastProvider>
        );
    }
} satisfies Meta<typeof UseToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TimeoutModes: Story = {
    render: (args) => {
        return (
            <ToastProvider>
                <TimeoutDemo {...args} />
            </ToastProvider>
        );
    }
};

export const Variants: Story = {
    args: {
        timeout: 5000
    },
    render: (args) => {
        return (
            <ToastProvider>
                <VariantsDemo {...args} />
            </ToastProvider>
        );
    }
};
