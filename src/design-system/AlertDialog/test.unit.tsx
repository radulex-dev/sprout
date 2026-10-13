import type React from 'react';
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

describe('<AlertDialog />', () => {
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

    it('renders no dialog when isOpen is false', () => {
        render(<AlertDialog {...props} isOpen={false} />);

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});
