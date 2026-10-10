import type React from 'react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import Button from '@/design-system/Button';
import ToastProvider from '@/design-system/ToastProvider';

// Hooks
import { useToast } from '@/design-system/hooks/useToast';

const Trigger: React.FunctionComponent = () => {
    const showToast = useToast();

    const handleClick = useCallback(() => {
        showToast({
            title: 'Plant saved',
            timeout: 5000
        });
    }, [showToast]);

    return (
        <Button onClick={handleClick}>Show</Button>
    );
};

describe('ToastList', () => {
    it('renders the viewport as a region', () => {
        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>
        );

        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders one toast per notification added', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));

        expect(await screen.findAllByRole('alert')).toHaveLength(2);
    });
});
