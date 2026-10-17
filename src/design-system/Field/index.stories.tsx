import React, { useCallback, useState } from 'react';
import { noop } from 'lodash-es';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import Field from './index';

const FieldDemo: React.FunctionComponent<React.ComponentProps<typeof Field>> = ({ value, onValueChange, ...props }) => {
    const [current, setCurrent] = useState(value);

    const handleValueChange = useCallback((next: string) => {
        onValueChange(next);
        setCurrent(next);
    }, [onValueChange]);

    return (
        <Field {...props} value={current} onValueChange={handleValueChange} />
    );
};

const meta = {
    title: 'Components/Field',
    component: Field,
    tags: ['autodocs'],
    args: {
        label: 'Email',
        value: '',
        onValueChange: noop
    },
    argTypes: {
        value: {
            description: 'Initial value. The demo keeps its own state so typing sticks.'
        },
        validate: {
            control: false
        },
        onValueChange: {
            action: 'changed'
        }
    },
    render: (args) => {
        return (
            <FieldDemo {...args} />
        );
    }
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
    args: {
        hint: 'We only use it for account recovery.'
    }
};

export const Required: Story = {
    args: {
        required: true,
        validationMode: 'onBlur',
        hint: 'Type something, clear it, then leave the field to see the native constraint message.'
    }
};

export const WithValidation: Story = {
    args: {
        label: 'Nickname',
        validate: (value) => {
            return String(value).length < 3 ? 'Use at least 3 characters.' : undefined;
        },
        hint: 'Validated on every change by default, like the app forms that need to react while typing.'
    }
};

export const WithExternalError: Story = {
    args: {
        invalid: true,
        error: 'That email is already registered.'
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
        hint: 'A disabled field hides its error message entirely.'
    }
};
