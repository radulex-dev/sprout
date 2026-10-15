import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { STEPS_HEADING } from './constants';

// Components
import InstallGuide from './index';

// Services
import { InstallBrowser, InstallPlatform } from '@/services/install';

const props: React.ComponentProps<typeof InstallGuide> = {
    platform: InstallPlatform.Ios
};

describe('<InstallGuide />', () => {
    it('renders the iOS Safari steps with the share hint', () => {
        render(<InstallGuide {...props} />);

        expect(screen.getByRole('heading', {
            name: STEPS_HEADING
        })).toBeInTheDocument();
        expect(screen.getByText('Tap the Share button')).toBeInTheDocument();
        expect(screen.getByText('Find this icon in your browser\'s toolbar.')).toBeInTheDocument();
        expect(screen.getByText('Choose Add to Home Screen')).toBeInTheDocument();
        expect(screen.getByText('Leave Open as Web App turned on, then tap Add')).toBeInTheDocument();
        expect(screen.getByText('Open Sprout from your Home Screen, then turn on reminders')).toBeInTheDocument();
    });

    it.each([{
        browser: InstallBrowser.Chrome
    }, {
        browser: InstallBrowser.Firefox
    }])('shows the address bar step and the browser note on iOS $browser', ({ browser }) => {
        render(<InstallGuide {...props} browser={browser} />);

        expect(screen.getByText('Tap the Share button in the address bar')).toBeInTheDocument();
        expect(screen.getByText('Using Chrome or Firefox? The Share button is in the address bar at the top.')).toBeInTheDocument();
    });

    it('keeps the Safari step and hides the browser note on iOS Safari', () => {
        render(<InstallGuide {...props} browser={InstallBrowser.Safari} />);

        expect(screen.getByText('Tap the Share button')).toBeInTheDocument();
        expect(screen.queryByText('Using Chrome or Firefox? The Share button is in the address bar at the top.')).not.toBeInTheDocument();
    });

    it.each([{
        title: 'Open the browser menu (the three-dot menu).'
    }, {
        title: 'Choose Install app (or Add to home screen).'
    }, {
        title: 'Launch Sprout from its new icon.'
    }])('renders the Chromium step $title', ({ title }) => {
        render(<InstallGuide {...props} platform={InstallPlatform.Chromium} />);

        expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('renders the generic step on other platforms', () => {
        render(<InstallGuide {...props} platform={InstallPlatform.Other} />);

        expect(screen.getByText('Use your browser\'s menu to add this site to your home screen.')).toBeInTheDocument();
    });
});
