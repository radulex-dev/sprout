// Types
import type { NoticeContent } from './types';

export const CONTINUE_ANYWAY_LABEL = 'Continue anyway';

export const COPY_LINK_FAILURE_MESSAGE = 'Could not copy the link';

export const COPY_LINK_LABEL = 'Copy link';

export const COPY_LINK_SUCCESS_MESSAGE = 'Link copied';

export const NOTICE_DISMISSED_KEY = 'sprout:in-app-browser-notice-dismissed';

export const ANDROID_NOTICE_CONTENT: NoticeContent = {
    title: 'Open Sprout in Chrome',
    body: 'This in-app browser cannot install apps or send reminders. Open the page in Chrome to continue.',
    steps: [
        'Tap the three-dot icon in the top-right corner.',
        'Choose Open in Browser.'
    ]
};

export const IOS_NOTICE_CONTENT: NoticeContent = {
    title: 'Open Sprout in Safari',
    body: 'This in-app browser cannot install apps or send reminders. Open the page in Safari to continue.',
    steps: [
        'Tap the three-dot or compass icon in the browser bar.',
        'Choose Open in Safari.'
    ]
};
