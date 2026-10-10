import React, { useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';
import { ToastVariant } from './constants';

// Components
import Button from '@/design-system/Button';
import ToastProvider from '@/design-system/ToastProvider';

// Hooks
import { useToast } from '@/design-system/hooks/useToast';

const VARIANT_LABELS: Record<ToastVariant, string> = {
    [ToastVariant.Info]: 'Info',
    [ToastVariant.Success]: 'Success',
    [ToastVariant.Warning]: 'Warning',
    [ToastVariant.Error]: 'Error'
};

const VARIANT_TITLES: Record<ToastVariant, string> = {
    [ToastVariant.Info]: 'Plant added to your collection',
    [ToastVariant.Success]: 'Watering logged',
    [ToastVariant.Warning]: 'PlantNet is unavailable right now',
    [ToastVariant.Error]: 'Could not delete the plant'
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
};

interface ToastDemoProps {
    variant: ToastVariant;
    title: string;
    description?: string;
    timeout?: number;
}

const ToastDemo: React.FunctionComponent<ToastDemoProps> = ({ variant, title, description, timeout }) => {
    const toast = useToast();

    const handleShow = useCallback((): void => {
        toast({
            variant,
            title,
            description,
            timeout
        });
    }, [toast, variant, title, description, timeout]);

    return (
        <Button onClick={handleShow}>Show toast</Button>
    );
};

interface AllVariantsProps {
    timeout?: number;
}

const AllVariants: React.FunctionComponent<AllVariantsProps> = ({ timeout }) => {
    const toast = useToast();

    const handleShow = useCallback((variant: ToastVariant) => {
        return (): void => {
            toast({
                variant,
                title: VARIANT_TITLES[variant],
                timeout
            });
        };
    }, [toast, timeout]);

    return (
        <div style={rowStyle}>
            {Object.values(ToastVariant).map((variant) => {
                return (
                    <Button key={variant} variant={ButtonVariant.Secondary} onClick={handleShow(variant)}>
                        {VARIANT_LABELS[variant]}
                    </Button>
                );
            })}
        </div>
    );
};

const meta = {
    title: 'Components/Toast',
    component: ToastDemo,
    tags: ['autodocs'],
    args: {
        variant: ToastVariant.Info,
        title: 'Plant added to your collection',
        description: 'Monstera deliciosa · 92% match',
        timeout: 5000
    },
    argTypes: {
        variant: {
            control: 'select',
            options: Object.values(ToastVariant)
        },
        timeout: {
            control: 'number',
            description: 'Milliseconds before auto-dismiss. Omitting it is the default and means indefinite (`TOAST_TIMEOUT_INDEFINITE` = 0): the toast stays until dismissed and shows no countdown ring.'
        }
    },
    parameters: {
        docs: {
            description: {
                component: 'Toast is a single notification; ToastList renders the stack and ToastProvider owns the queue. All three ship together — trigger them through the useToast hook. A toast is indefinite by default: give it a timeout and it auto-dismisses with a countdown ring.'
            }
        }
    },
    render: (args) => {
        return (
            <ToastProvider>
                <ToastDemo {...args} />
            </ToastProvider>
        );
    }
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllToastVariants: Story = {
    args: {
        timeout: 5000
    },
    render: (args) => {
        return (
            <ToastProvider>
                <AllVariants {...args} />
            </ToastProvider>
        );
    }
};
