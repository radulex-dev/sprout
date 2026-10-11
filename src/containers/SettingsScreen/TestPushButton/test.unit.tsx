import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { RING_LENGTH } from './constants';

// Components
import TestPushButton from './index';

const props: React.ComponentProps<typeof TestPushButton> = {
    cooldown: 0,
    total: 15,
    onSend: vi.fn()
};

describe('<TestPushButton />', () => {
    it('shows the bell and stays enabled when ready', () => {
        render(<TestPushButton {...props} />);

        expect(screen.getByRole('button', {
            name: 'Send a test notification'
        })).toBeEnabled();
    });

    it('shows the remaining seconds and disables the button while cooling down', () => {
        render(<TestPushButton {...props} cooldown={12} />);

        expect(screen.getByRole('button', {
            name: 'Send a test notification'
        })).toBeDisabled();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('positions the ring for the remaining cooldown rather than restarting it', () => {
        render(<TestPushButton {...props} cooldown={5} />);

        const circle = screen.getByRole('button').querySelector('circle');
        const expected = String(RING_LENGTH * ((15 - 5) / 15));

        expect(circle).toHaveAttribute('stroke-dashoffset', expected);
    });

    it('reports a send when clicked', async () => {
        const handleSend = vi.fn();
        const user = userEvent.setup();

        render(<TestPushButton {...props} onSend={handleSend} />);

        await user.click(screen.getByRole('button', {
            name: 'Send a test notification'
        }));

        expect(handleSend).toHaveBeenCalledTimes(1);
    });
});
