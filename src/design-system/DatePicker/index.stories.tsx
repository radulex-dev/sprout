import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import DatePicker from './index';

const DatePickerDemo: React.FunctionComponent<React.ComponentProps<typeof DatePicker>> = ({ value, onChange, ...props }) => {
    const [current, setCurrent] = useState(value);

    const handleChange = useCallback((next: string) => {
        onChange(next);
        setCurrent(next);
    }, [onChange]);

    return (
        <DatePicker {...props} value={current} onChange={handleChange} />
    );
};

const meta = {
    title: 'Components/DatePicker',
    component: DatePicker,
    tags: ['autodocs'],
    args: {
        label: 'Last watered',
        value: '2026-10-01',
        onChange: noop
    },
    argTypes: {
        value: {
            description: 'Initial value. The picker keeps its own state so you can change the date.'
        },
        onChange: {
            action: 'changed'
        }
    },
    render: (args) => {
        return (
            <DatePickerDemo {...args} />
        );
    }
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
    args: {
        hint: 'Pick the day you last watered this plant'
    }
};

export const WithMax: Story = {
    args: {
        max: '2026-10-10'
    }
};

export const Empty: Story = {
    args: {
        value: ''
    }
};
