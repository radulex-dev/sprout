import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import InstallButton from './index';

const props: React.ComponentProps<typeof InstallButton> = {
    isPromptAvailable: true,
    onInstall: vi.fn()
};

describe('InstallButton', () => {
    it('renders the install label and calls onInstall from the button', async () => {
        const handleInstall = vi.fn();
        const user = userEvent.setup();

        render(<InstallButton {...props} onInstall={handleInstall} />);

        await user.click(screen.getByRole('button', {
            name: 'Install app'
        }));

        expect(handleInstall).toHaveBeenCalledTimes(1);
    });

    it('offers the guide label and no install button when the prompt is unavailable', () => {
        render(<InstallButton {...props} isPromptAvailable={false} />);

        expect(screen.getByRole('button', {
            name: 'How to install'
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Install app'
        })).not.toBeInTheDocument();
    });
});
