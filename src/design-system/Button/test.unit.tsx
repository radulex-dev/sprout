import userEvent from '@testing-library/user-event';
import type { SyntheticEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Plus } from 'lucide-react';

// Components
import Button from './index';

const CALLER_CLASS_NAME = 'caller-class-name';

const handleFormSubmit = (handleSubmit: () => void) => {
    return (event: SyntheticEvent): void => {
        event.preventDefault();
        handleSubmit();
    };
};

describe('Button', () => {
    it('renders a button of type button by default', () => {
        render(<Button>Save</Button>);

        expect(screen.getByRole('button', {
            name: 'Save'
        })).toHaveAttribute('type', 'button');
    });

    it('keeps an explicit type when the caller passes one', () => {
        render(<Button type="submit">Save</Button>);

        expect(screen.getByRole('button', {
            name: 'Save'
        })).toHaveAttribute('type', 'submit');
    });

    it('does not submit the surrounding form by default', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();

        render(
            <form onSubmit={handleFormSubmit(handleSubmit)}>
                <Button>Save</Button>
            </form>
        );

        await user.click(screen.getByRole('button', {
            name: 'Save'
        }));

        expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits the surrounding form when the caller asks for submit', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();

        render(
            <form onSubmit={handleFormSubmit(handleSubmit)}>
                <Button type="submit">Save</Button>
            </form>
        );

        await user.click(screen.getByRole('button', {
            name: 'Save'
        }));

        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('renders a link when href is given', () => {
        render(<Button href="/identify">Add a plant</Button>);

        const link = screen.getByRole('link', {
            name: 'Add a plant'
        });

        expect(link).toHaveAttribute('href', '/identify');
        expect(link).not.toHaveAttribute('type');
        expect(link).not.toHaveAttribute('role');
    });

    it('passes className and aria attributes through', () => {
        render(<Button className={CALLER_CLASS_NAME} aria-label="Remove plant">Remove</Button>);

        expect(screen.getByRole('button', {
            name: 'Remove plant'
        })).toHaveClass(CALLER_CLASS_NAME);
    });

    it('reports clicks', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Save</Button>);

        await user.click(screen.getByRole('button', {
            name: 'Save'
        }));

        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledWith(expect.anything());
    });

    it('ignores clicks while disabled', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button disabled onClick={handleClick}>Save</Button>);

        const button = screen.getByRole('button', {
            name: 'Save'
        });

        expect(button).toBeDisabled();

        await user.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders the icon alongside the children', () => {
        render(<Button icon={Plus}>Add a plant</Button>);

        const button = screen.getByRole('button', {
            name: 'Add a plant'
        });

        expect(button.querySelector('svg')).toBeInTheDocument();
    });
});
