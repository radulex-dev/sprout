import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import DateSelect from './index';

const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
};

const labelStyle: React.CSSProperties = {
    color: 'var(--color-ink-soft)'
};

const DateSelectDemo: React.FunctionComponent<React.ComponentProps<typeof DateSelect>> = ({ label, value, onSelect, ...props }) => {
    const [current, setCurrent] = useState(value);

    const handleSelect = useCallback((next: string) => {
        onSelect(next);
        setCurrent(next);
    }, [onSelect]);

    return (
        <div style={rowStyle}>
            <DateSelect {...props} label={label} value={current} onSelect={handleSelect} />
            <span style={labelStyle}>{`Selected: ${current}`}</span>
        </div>
    );
};

const meta = {
    title: 'Components/DateSelect',
    component: DateSelect,
    tags: ['autodocs'],
    args: {
        label: 'Last fertilised',
        value: '2026-10-01',
        onSelect: noop
    },
    argTypes: {
        value: {
            description: 'Initial value. The calendar keeps its own state, and the label beside it shows what is selected.'
        },
        onSelect: {
            action: 'selected'
        }
    },
    render: (args) => {
        return (
            <DateSelectDemo {...args} />
        );
    }
} satisfies Meta<typeof DateSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMax: Story = {
    args: {
        max: '2026-10-10'
    }
};
