import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import AlertDialog from './index';
import Button from '@/design-system/Button';

const TRIGGER_LABEL = 'Open dialog';

const AlertDialogDemo: React.FunctionComponent<React.ComponentProps<typeof AlertDialog>> = ({ isOpen, title, description, confirmLabel, cancelLabel, confirmVariant, hideCancel, onConfirm, onCancel, children }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(isOpen);

    const handleOpen = useCallback(() => {
        setIsDialogOpen(true);
    }, []);

    const handleConfirm = useCallback(() => {
        onConfirm();
        setIsDialogOpen(false);
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel();
        setIsDialogOpen(false);
    }, [onCancel]);

    return (
        <React.Fragment>
            <Button onClick={handleOpen}>{TRIGGER_LABEL}</Button>
            <AlertDialog isOpen={isDialogOpen} title={title} description={description} confirmLabel={confirmLabel} cancelLabel={cancelLabel} confirmVariant={confirmVariant} hideCancel={hideCancel} onConfirm={handleConfirm} onCancel={handleCancel}>{children}</AlertDialog>
        </React.Fragment>
    );
};

const meta = {
    title: 'Components/AlertDialog',
    component: AlertDialog,
    tags: ['autodocs'],
    args: {
        isOpen: false,
        title: 'Delete this plant?',
        description: 'This permanently removes the plant and its care history.',
        confirmLabel: 'Delete plant',
        cancelLabel: 'Keep plant',
        onConfirm: noop,
        onCancel: noop
    },
    argTypes: {
        confirmVariant: {
            control: 'select',
            options: Object.values(ButtonVariant)
        },
        isOpen: {
            control: false,
            description: 'Story-managed: the trigger button opens the dialog and confirm/cancel close it.'
        },
        onConfirm: {
            action: 'confirmed'
        },
        onCancel: {
            action: 'cancelled'
        },
        children: {
            control: false
        }
    },
    render: (args) => {
        return (
            <AlertDialogDemo {...args} />
        );
    }
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Danger: Story = {};

export const PrimaryConfirm: Story = {
    args: {
        title: 'Water every plant now?',
        description: 'Marks every plant as watered today.',
        confirmLabel: 'Water all',
        confirmVariant: ButtonVariant.Primary
    }
};

export const WithoutCancel: Story = {
    args: {
        hideCancel: true
    }
};

export const WithBody: Story = {
    args: {
        description: 'This action cannot be undone.'
    },
    render: (args) => {
        return (
            <AlertDialogDemo {...args}>
                <p>Care history for this plant will be deleted too.</p>
            </AlertDialogDemo>
        );
    }
};
