import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import { Droplets } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import Select from './index';

// Types
import type { SelectOption } from './types';

const options: SelectOption[] = [{
    value: 'day',
    label: 'Every day'
}, {
    value: 'week',
    label: 'Every week'
}, {
    value: 'month',
    label: 'Every month'
}];

const SelectDemo: React.FunctionComponent<React.ComponentProps<typeof Select>> = ({ value, onChange, ...props }) => {
    const [current, setCurrent] = useState(value);

    const handleChange = useCallback((next: string) => {
        onChange(next);
        setCurrent(next);
    }, [onChange]);

    return (
        <Select {...props} value={current} onChange={handleChange} />
    );
};

const meta = {
    title: 'Components/Select',
    component: Select,
    tags: ['autodocs'],
    args: {
        label: 'Watering interval',
        value: 'week',
        options,
        onChange: noop
    },
    argTypes: {
        value: {
            description: 'Initial value. The select keeps its own state so picking an option sticks.'
        },
        options: {
            control: false
        },
        onChange: {
            action: 'changed'
        }
    },
    render: (args) => {
        return (
            <SelectDemo {...args} />
        );
    }
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
    args: {
        icon: Droplets
    }
};

export const Placeholder: Story = {
    args: {
        value: '',
        placeholder: 'Choose an interval'
    }
};

export const WithHint: Story = {
    args: {
        hint: 'Drives when we remind you to water'
    }
};

export const Disabled: Story = {
    args: {
        disabled: true
    }
};
