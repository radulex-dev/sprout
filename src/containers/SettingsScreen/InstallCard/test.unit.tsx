import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { INSTALL_ACTION_LABEL, INSTALL_DESCRIPTION, INSTALL_LABEL, INSTALLED_LABEL, SHOW_STEPS_LABEL } from '../constants';

// Components
import InstallCard from './index';

const props: React.ComponentProps<typeof InstallCard> = {
    isInstalled: false,
    canPrompt: false,
    onInstall: vi.fn(),
    onShowSteps: vi.fn()
};

describe('<InstallCard />', () => {
    it('renders the install copy', () => {
        render(<InstallCard {...props} />);

        expect(screen.getByText(INSTALL_LABEL)).toBeInTheDocument();
        expect(screen.getByText(INSTALL_DESCRIPTION)).toBeInTheDocument();
    });

    it('shows only the steps action when a native install prompt is unavailable', () => {
        render(<InstallCard {...props} />);

        expect(screen.getByRole('button', {
            name: SHOW_STEPS_LABEL
        })).toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: INSTALL_ACTION_LABEL
        })).not.toBeInTheDocument();
    });

    it('shows the install action alongside the steps when a native install prompt is available', () => {
        render(<InstallCard {...props} canPrompt />);

        expect(screen.getByRole('button', {
            name: INSTALL_ACTION_LABEL
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: SHOW_STEPS_LABEL
        })).toBeInTheDocument();
    });

    it('shows the installed status and no call to action when the app is installed', () => {
        render(<InstallCard {...props} isInstalled canPrompt />);

        expect(screen.getByText(INSTALLED_LABEL)).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
