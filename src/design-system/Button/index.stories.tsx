import React from 'react';
import { capitalize } from 'lodash-es';
import { Plus, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Constants
import { ButtonSize, ButtonVariant } from './constants';

// Components
import Button from './index';

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
};

const blockStyle: React.CSSProperties = {
    width: '20rem'
};

const meta = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    args: {
        variant: ButtonVariant.Primary,
        size: ButtonSize.Md,
        block: false,
        grow: false,
        round: false
    },
    argTypes: {
        variant: {
            control: 'select',
            options: Object.values(ButtonVariant)
        },
        size: {
            control: 'inline-radio',
            options: Object.values(ButtonSize)
        },
        icon: {
            control: false
        },
        onClick: {
            action: 'clicked'
        }
    }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        children: 'Save plant'
    }
};

export const Variants: Story = {
    render: (args) => {
        return (
            <div style={rowStyle}>
                {Object.values(ButtonVariant).map((variant) => {
                    return (
                        <Button key={variant} {...args} variant={variant}>
                            {capitalize(variant)}
                        </Button>
                    );
                })}
            </div>
        );
    }
};

export const Sizes: Story = {
    render: (args) => {
        return (
            <div style={rowStyle}>
                <Button {...args} size={ButtonSize.Md}>Medium</Button>
                <Button {...args} size={ButtonSize.Sm}>Small</Button>
            </div>
        );
    }
};

export const WithIcon: Story = {
    args: {
        children: 'Add a plant',
        icon: Plus
    }
};

export const Block: Story = {
    args: {
        block: true
    },
    render: (args) => {
        return (
            <div style={blockStyle}>
                <Button {...args}>Save plant</Button>
            </div>
        );
    }
};

export const Grow: Story = {
    args: {
        grow: true
    },
    render: (args) => {
        return (
            <div style={blockStyle}>
                <div style={rowStyle}>
                    <Button {...args} variant={ButtonVariant.Primary}>Save</Button>
                    <Button {...args} variant={ButtonVariant.Secondary}>Cancel</Button>
                </div>
            </div>
        );
    }
};

export const Round: Story = {
    args: {
        round: true
    },
    render: (args) => {
        return (
            <Button {...args} icon={Plus} aria-label="Add a plant" />
        );
    }
};

export const Disabled: Story = {
    args: {
        children: 'Delete plant',
        disabled: true,
        icon: Trash2,
        variant: ButtonVariant.Danger
    }
};

export const AsLink: Story = {
    args: {
        children: 'Add a plant',
        href: '/identify',
        icon: Plus
    }
};
