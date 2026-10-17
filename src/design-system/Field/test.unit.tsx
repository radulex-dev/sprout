import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import Field from './index';

const props: React.ComponentProps<typeof Field> = {
    label: 'Email',
    value: '',
    onValueChange: vi.fn()
};

describe('<Field />', () => {
    it('associates the control with its visible label', () => {
        render(<Field {...props} />);

        const input = screen.getByLabelText('Email');

        expect(input).toHaveAccessibleName('Email');
        expect(screen.getByText('Email')).toHaveAttribute('for', input.id);
    });

    it('keeps the hint in the control description', () => {
        render(<Field {...props} hint="We never share it." />);

        const input = screen.getByLabelText('Email');

        expect(input).toHaveAccessibleDescription('We never share it.');
        expect(input).toHaveAttribute('aria-describedby', screen.getByText('We never share it.').id);
    });

    it('marks the control invalid and shows the message when the field is invalid', () => {
        render(<Field {...props} invalid error="That email is already registered." />);

        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('That email is already registered.')).toBeInTheDocument();
    });

    it('marks the control invalid from a server error alone', () => {
        render(<Field {...props} error="That email is already registered." />);

        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('That email is already registered.')).toBeInTheDocument();
    });

    it('announces the message as an alert', () => {
        render(<Field {...props} error="That email is already registered." />);

        expect(screen.getByRole('alert')).toHaveTextContent('That email is already registered.');
    });

    it('disables the control when disabled', () => {
        render(<Field {...props} disabled />);

        expect(screen.getByLabelText('Email')).toBeDisabled();
    });

    it('shows the message returned by validate', async () => {
        const user = userEvent.setup();

        const { rerender } = render(<Field {...props} validationMode="onChange" validate={vi.fn().mockReturnValue('That email is already registered.')} />);

        await user.type(screen.getByLabelText('Email'), 'a');

        rerender(<Field {...props} value="a" validationMode="onChange" validate={vi.fn().mockReturnValue('That email is already registered.')} />);

        expect(screen.getByText('That email is already registered.')).toBeInTheDocument();
    });

    it('validates while typing without a submit or blur', async () => {
        const user = userEvent.setup();

        const { rerender } = render(<Field {...props} validate={vi.fn().mockReturnValue('That email is already registered.')} />);

        await user.type(screen.getByLabelText('Email'), 'a');

        rerender(<Field {...props} value="a" validate={vi.fn().mockReturnValue('That email is already registered.')} />);

        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('That email is already registered.')).toBeInTheDocument();
    });
});

describe('Field validation', () => {
    it('reports a native constraint failure with the browser message', async () => {
        const user = userEvent.setup();

        render(
            <Field.Root validationMode="onBlur">
                <Field.Label>Email</Field.Label>
                <Field.Control required />
                <Field.Error />
            </Field.Root>
        );

        await user.type(screen.getByLabelText('Email'), 'a');
        await user.clear(screen.getByLabelText('Email'));
        await user.tab();

        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Constraints not satisfied')).toBeInTheDocument();
    });

    it('lists every message when validate returns more than one error', async () => {
        const user = userEvent.setup();

        render(
            <Field.Root validationMode="onChange" validate={() => { return ['Too short.', 'Add a number.']; }}>
                <Field.Label>Password</Field.Label>
                <Field.Control />
                <Field.Error />
            </Field.Root>
        );

        await user.type(screen.getByLabelText('Password'), 'a');

        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('Too short.')).toBeInTheDocument();
        expect(screen.getByText('Add a number.')).toBeInTheDocument();
    });

    it('removes the message once the value becomes valid again', async () => {
        const user = userEvent.setup();

        render(
            <Field.Root validationMode="onChange" validate={(value) => { return value === 'bad' ? 'Nope.' : undefined; }}>
                <Field.Label>Code</Field.Label>
                <Field.Control />
                <Field.Error />
            </Field.Root>
        );

        await user.type(screen.getByLabelText('Code'), 'bad');

        expect(screen.getByText('Nope.')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Code'), 'x');

        expect(screen.queryByText('Nope.')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Code')).not.toHaveAttribute('aria-invalid');
    });
});

describe('<Field.Item />', () => {
    it('names a control from the label scoped to its item', () => {
        render(
            <Field.Root>
                <Field.Item>
                    <Field.Label>
                        <Field.Control type="checkbox" />
                        Watering
                    </Field.Label>
                </Field.Item>
            </Field.Root>
        );

        expect(screen.getByRole('checkbox')).toHaveAccessibleName('Watering');
    });
});

describe('<Field.Validity />', () => {
    it('reports an unknown validity before the first validation pass', () => {
        render(
            <Field.Root>
                <Field.Label>Email</Field.Label>
                <Field.Control />
                <Field.Validity>
                    {(state) => {
                        if (state.validity.valid === null) {
                            return (
                                <span>Unknown</span>
                            );
                        }

                        return (
                            <span>Known</span>
                        );
                    }}
                </Field.Validity>
            </Field.Root>
        );

        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
});
