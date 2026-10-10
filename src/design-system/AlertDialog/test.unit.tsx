import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { DEFAULT_CANCEL_LABEL } from './constants';

// Components
import AlertDialog from './index';

const props: React.ComponentProps<typeof AlertDialog> = {
    isOpen: true,
    title: 'Delete plant',
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
};

describe('AlertDialog', () => {
    it('renders the title and the description when open', () => {
        render(<AlertDialog {...props} />);

        expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete plant');
        expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    });

    it('renders the confirm label and the default cancel label', () => {
        render(<AlertDialog {...props} />);

        expect(screen.getByRole('button', {
            name: 'Delete'
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: DEFAULT_CANCEL_LABEL
        })).toBeInTheDocument();
    });

    it.each([{
        control: 'Delete',
        confirmCalled: 1,
        cancelCalled: 0
    }, {
        control: DEFAULT_CANCEL_LABEL,
        confirmCalled: 0,
        cancelCalled: 1
    }])('calls the matching handler for the "$control" control', async ({ control, confirmCalled, cancelCalled }) => {
        const handleConfirm = vi.fn();
        const handleCancel = vi.fn();
        const user = userEvent.setup();

        render(<AlertDialog {...props} onConfirm={handleConfirm} onCancel={handleCancel} />);
        await user.click(screen.getByRole('button', {
            name: control
        }));

        expect(handleConfirm).toHaveBeenCalledTimes(confirmCalled);
        expect(handleCancel).toHaveBeenCalledTimes(cancelCalled);
    });

    it('hides the cancel button when hideCancel is set', () => {
        render(<AlertDialog {...props} hideCancel />);

        expect(screen.queryByRole('button', {
            name: DEFAULT_CANCEL_LABEL
        })).not.toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Delete'
        })).toBeInTheDocument();
    });

    it('renders children inside the dialog when provided', () => {
        render(
            <AlertDialog {...props}>
                <p>Extra detail</p>
            </AlertDialog>
        );

        expect(screen.getByRole('alertdialog')).toContainElement(screen.getByText('Extra detail'));
    });

    it('calls onCancel when the dialog is dismissed with Escape', async () => {
        const handleCancel = vi.fn();
        const user = userEvent.setup();

        render(<AlertDialog {...props} onCancel={handleCancel} />);

        await user.keyboard('{Escape}');

        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('renders no dialog when isOpen is false', () => {
        render(<AlertDialog {...props} isOpen={false} />);

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});
