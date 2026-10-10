import type React from 'react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { ToastVariant } from '@/design-system/Toast/constants';

// Components
import Button from '@/design-system/Button';
import ToastProvider from './index';

// Hooks
import { useToast } from '@/design-system/hooks/useToast';

const Trigger: React.FunctionComponent = () => {
    const showToast = useToast();

    const handleClick = useCallback(() => {
        showToast({
            variant: ToastVariant.Success,
            title: 'Plant saved',
            description: 'Watering updated'
        });
    }, [showToast]);

    return (
        <Button onClick={handleClick}>Show</Button>
    );
};

describe('ToastProvider', () => {
    it('shows a toast with the title and description passed to useToast', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));

        expect(await screen.findByText('Plant saved')).toBeInTheDocument();
        expect(await screen.findByText('Watering updated')).toBeInTheDocument();
    });

    it('gives the toast a dismiss control', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));

        await user.hover(await screen.findByRole('alert'));

        expect(await screen.findByRole('button', {
            name: 'Dismiss notification'
        })).toBeInTheDocument();
    });
});
