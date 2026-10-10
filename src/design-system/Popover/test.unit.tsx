import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Components
import Popover from './index';

const props: Omit<React.ComponentProps<typeof Popover>, 'children'> = {
    trigger: 'Open'
};

describe('Popover', () => {
    it('renders the trigger button', () => {
        render(<Popover {...props}>Popover body</Popover>);

        expect(screen.getByRole('button', {
            name: 'Open'
        })).toBeInTheDocument();
    });

    it('reveals the content when the trigger is clicked', async () => {
        const user = userEvent.setup();

        render(<Popover {...props}>Popover body</Popover>);

        await user.click(screen.getByRole('button', {
            name: 'Open'
        }));

        expect(await screen.findByText('Popover body')).toBeInTheDocument();
    });

    it('labels the popup with the trigger', async () => {
        const user = userEvent.setup();

        render(<Popover {...props}>Popover body</Popover>);

        const trigger = screen.getByRole('button', {
            name: 'Open'
        });

        await user.click(trigger);

        const popup = await screen.findByRole('dialog');

        expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
    });

    it('hides the content after pressing Escape', async () => {
        const user = userEvent.setup();

        render(<Popover {...props}>Popover body</Popover>);

        await user.click(screen.getByRole('button', {
            name: 'Open'
        }));
        await screen.findByText('Popover body');
        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
        });
    });

    it('passes extra button props through to the trigger', () => {
        render(<Popover {...props} aria-label="Care options">Popover body</Popover>);

        expect(screen.getByRole('button', {
            name: 'Care options'
        })).toBeInTheDocument();
    });
});
