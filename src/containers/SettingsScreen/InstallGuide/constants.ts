// Services
import { InstallPlatform } from '@/services/install';

// Types
import { StepIllustration, type InstallGuideContent, type InstallGuideStep } from './types';

export const CONFIRM_LABEL = 'Got it';

export const STEPS_HEADING = 'How to install';

const IOS_DESCRIPTION = 'On iPhone and iPad, reminders only work in an installed web app, so Sprout has to be added to your Home Screen first.';

const IOS_ALTERNATE_NOTE = 'Using Chrome or Firefox? The Share button is in the address bar at the top.';

const SHARE_STEP: InstallGuideStep = {
    title: 'Tap the Share button',
    hint: 'Find this icon in your browser\'s toolbar.',
    illustration: StepIllustration.Share
};

const ALTERNATE_SHARE_STEP: InstallGuideStep = {
    ...SHARE_STEP,
    title: 'Tap the Share button in the address bar'
};

const ADD_TO_HOME_SCREEN_STEP: InstallGuideStep = {
    title: 'Choose Add to Home Screen',
    illustration: StepIllustration.AddToHomeScreen
};

const WEB_APP_SHEET_STEP: InstallGuideStep = {
    title: 'Leave Open as Web App turned on, then tap Add',
    illustration: StepIllustration.WebAppSheet
};

const HOME_ICON_STEP: InstallGuideStep = {
    title: 'Open Sprout from your Home Screen, then turn on reminders',
    illustration: StepIllustration.HomeIcon
};

const IOS_CONTENT: InstallGuideContent = {
    title: 'Install Sprout',
    description: IOS_DESCRIPTION,
    steps: [
        SHARE_STEP,
        ADD_TO_HOME_SCREEN_STEP,
        WEB_APP_SHEET_STEP,
        HOME_ICON_STEP
    ]
};

export const INSTALL_GUIDE_CONTENT: Record<InstallPlatform, InstallGuideContent> = {
    [InstallPlatform.Ios]: IOS_CONTENT,
    [InstallPlatform.Chromium]: {
        title: 'Install Sprout',
        description: 'Install Sprout to get the full-screen app experience, without the browser controls.',
        steps: [{
            title: 'Open the browser menu (the three-dot menu).'
        }, {
            title: 'Choose Install app (or Add to home screen).'
        }, {
            title: 'Launch Sprout from its new icon.'
        }]
    },
    [InstallPlatform.Other]: {
        title: 'Install Sprout',
        description: 'Install Sprout to get the full-screen app experience on your device.',
        steps: [{
            title: 'Use your browser\'s menu to add this site to your home screen.'
        }]
    }
};

export const IOS_ALTERNATE_GUIDE_CONTENT: InstallGuideContent = {
    ...IOS_CONTENT,
    note: IOS_ALTERNATE_NOTE,
    steps: [
        ALTERNATE_SHARE_STEP,
        ADD_TO_HOME_SCREEN_STEP,
        WEB_APP_SHEET_STEP,
        HOME_ICON_STEP
    ]
};
