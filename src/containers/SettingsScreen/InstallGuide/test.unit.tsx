import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import InstallGuide from './index';

// Services
import { InstallPlatform } from '@/services/install';

const CALLER_CLASS_NAME = 'caller-class-name';

const props: React.ComponentProps<typeof InstallGuide> = {
    platform: InstallPlatform.Ios
};

describe('InstallGuide', () => {
    it('shows the iOS home screen steps', () => {
        render(<InstallGuide {...props} />);

        expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('shows the Chromium install steps without the iOS wording', () => {
        render(<InstallGuide {...props} platform={InstallPlatform.Chromium} />);

        expect(screen.getByText(/Install app/)).toBeInTheDocument();
        expect(screen.queryByText(/Add to Home Screen/)).not.toBeInTheDocument();
    });

    it('shows the generic step on other platforms', () => {
        render(<InstallGuide {...props} platform={InstallPlatform.Other} />);

        expect(screen.getByText(/add this site to your home screen/)).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('spreads props and className onto the root element', () => {
        render(<InstallGuide {...props} data-testid="install-guide" className={CALLER_CLASS_NAME} />);

        const root = screen.getByTestId('install-guide');

        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass(CALLER_CLASS_NAME);
    });
});
