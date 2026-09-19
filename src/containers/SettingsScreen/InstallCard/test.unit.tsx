import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import InstallCard from './index';

describe('InstallCard', () => {
    it('renders the install heading', () => {
        render(<InstallCard onInstall={vi.fn()} />);

        expect(screen.getByRole('heading', {
            name: 'Install app'
        })).toBeInTheDocument();
    });

    it('calls onInstall when the install button is clicked', async () => {
        const handleInstall = vi.fn();
        const user = userEvent.setup();

        render(<InstallCard onInstall={handleInstall} />);

        await user.click(screen.getByRole('button', {
            name: 'Install Sprout'
        }));

        expect(handleInstall).toHaveBeenCalledTimes(1);
    });
});
