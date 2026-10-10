import type React from 'react';
import userEvent from '@testing-library/user-event';
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { TOAST_VARIANT_ICON, ToastVariant } from './constants';

// Components
import Button from '@/design-system/Button';
import ToastProvider from '@/design-system/ToastProvider';

// Helpers
import { countdownRingStyle } from './helpers';

// Hooks
import { useToast } from '@/design-system/hooks/useToast';

// Styles
import styles from './styles.module.css';

const Trigger: React.FunctionComponent<{ variant: ToastVariant; timeout?: number; }> = ({ variant, timeout }) => {
    const showToast = useToast();

    const handleClick = useCallback(() => {
        showToast({
            variant,
            title: 'Plant saved',
            description: 'Watering updated',
            timeout
        });
    }, [showToast, variant, timeout]);

    return (
        <Button onClick={handleClick}>Show</Button>
    );
};

describe('Toast', () => {
    it.each([{
        variant: ToastVariant.Info,
        icon: Info
    }, {
        variant: ToastVariant.Success,
        icon: CircleCheck
    }, {
        variant: ToastVariant.Warning,
        icon: CircleAlert
    }, {
        variant: ToastVariant.Error,
        icon: CircleX
    }])('maps the "$variant" variant to its icon', ({ variant, icon }) => {
        expect(TOAST_VARIANT_ICON[variant]).toBe(icon);
    });

    it.each([ToastVariant.Info, ToastVariant.Success, ToastVariant.Warning, ToastVariant.Error])('applies the "%s" variant class to the toast root', async (variant) => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <Trigger variant={variant} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));

        expect(await screen.findByRole('alert')).toHaveClass(styles[variant]);
    });

    it('sizes the countdown ring to the timeout', () => {
        expect(countdownRingStyle(5000)).toEqual({
            animationDuration: '5000ms'
        });
    });

    it('renders a variant icon inside the toast', async () => {
        const user = userEvent.setup();
        const { baseElement } = render(
            <ToastProvider>
                <Trigger variant={ToastVariant.Error} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(baseElement.querySelector(':scope [class*="icon"] svg')).not.toBeNull();
    });

    it.each([{
        timeout: 5000,
        hasRing: true
    }, {
        timeout: undefined,
        hasRing: false
    }])('renders the countdown ring only when timed ($timeout)', async ({ timeout, hasRing }) => {
        const user = userEvent.setup();
        const { baseElement } = render(
            <ToastProvider>
                <Trigger variant={ToastVariant.Warning} timeout={timeout} />
            </ToastProvider>
        );

        await user.click(screen.getByRole('button', {
            name: 'Show'
        }));
        await screen.findByRole('alert');

        expect(baseElement.querySelector('[class*="ringCircle"]') !== null).toBe(hasRing);
    });
});
