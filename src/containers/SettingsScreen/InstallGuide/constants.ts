// Services
import { InstallPlatform } from '@/services/install';

// Types
import type { InstallGuideContent } from './types';

export const CONFIRM_LABEL = 'Got it';

export const STEPS_HEADING = 'How to install';

export const INSTALL_GUIDE_CONTENT: Record<InstallPlatform, InstallGuideContent> = {
    [InstallPlatform.Ios]: {
        title: 'Install Sprout',
        description: 'On iPhone and iPad, notifications only work in an installed web app, so Sprout has to be added to your Home Screen first.',
        steps: [
            'Tap the Share button in Safari\'s toolbar.',
            'Choose Add to Home Screen.',
            'Open Sprout from the Home Screen and turn on reminders here.'
        ]
    },
    [InstallPlatform.Chromium]: {
        title: 'Install Sprout',
        description: 'Install Sprout to get the full-screen app experience, without the browser controls.',
        steps: [
            'Open the browser menu (the three-dot menu).',
            'Choose Install app (or Add to Home screen).',
            'Launch Sprout from its new icon.'
        ]
    },
    [InstallPlatform.Other]: {
        title: 'Install Sprout',
        description: 'Install Sprout to get the full-screen app experience on your device.',
        steps: [
            'Use your browser\'s menu to add this site to your home screen.'
        ]
    }
};
