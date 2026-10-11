import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import Switch from './index';

const SwitchDemo: React.FunctionComponent<React.ComponentProps<typeof Switch>> = ({ isChecked, onCheckedChange, ...props }) => {
    const [isCurrentChecked, setIsCurrentChecked] = useState(isChecked);

    const handleCheckedChange = useCallback((isNextChecked: boolean) => {
        onCheckedChange(isNextChecked);
        setIsCurrentChecked(isNextChecked);
    }, [onCheckedChange]);

    return (
        <Switch {...props} isChecked={isCurrentChecked} onCheckedChange={handleCheckedChange} />
    );
};

const meta = {
    title: 'Components/Switch',
    component: Switch,
    tags: ['autodocs'],
    args: {
        isChecked: false,
        onCheckedChange: noop
    },
    argTypes: {
        isChecked: {
            description: 'Initial checked state. The demo keeps its own state so toggling sticks.'
        },
        label: {
            control: 'text'
        },
        onCheckedChange: {
            action: 'changed'
        }
    },
    render: (args) => {
        return (
            <SwitchDemo {...args} />
        );
    }
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
    args: {
        isChecked: true
    }
};

export const WithLabel: Story = {
    args: {
        label: 'Care reminders'
    }
};

export const Disabled: Story = {
    args: {
        disabled: true
    }
};
