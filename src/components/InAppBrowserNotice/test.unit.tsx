import userEvent from '@testing-library/user-event';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

// Components
import InAppBrowserNotice from './index';
import ToastProvider from '@/design-system/ToastProvider';

// Services
import { getInstallPlatform, isInAppBrowser } from '@/services/install';

// Types
import { InstallPlatform } from '@/services/install/types';

vi.mock('@/services/install', () => {
    return {
        getInstallPlatform: vi.fn(),
        isInAppBrowser: vi.fn()
    };
});

const props: React.ComponentProps<typeof InAppBrowserNotice> = {};

describe('<InAppBrowserNotice />', () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('renders nothing when the browser is not an in-app browser', async () => {
        vi.mocked(isInAppBrowser).mockReturnValue(false);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it.each([{
        platform: InstallPlatform.Ios,
        title: 'Open Sprout in Safari',
        body: 'This in-app browser cannot install apps or send reminders. Open the page in Safari to continue.',
        firstStep: 'Tap the three-dot or compass icon in the browser bar.',
        lastStep: 'Choose Open in Safari.'
    }, {
        platform: InstallPlatform.Chromium,
        title: 'Open Sprout in Chrome',
        body: 'This in-app browser cannot install apps or send reminders. Open the page in Chrome to continue.',
        firstStep: 'Tap the three-dot icon in the top-right corner.',
        lastStep: 'Choose Open in Browser.'
    }])('shows the $platform copy inside an in-app browser', async ({ platform, title, body, firstStep, lastStep }) => {
        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(platform);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        expect(await screen.findByRole('dialog', {
            name: title
        })).toBeInTheDocument();
        expect(screen.getByText(body)).toBeInTheDocument();
        expect(screen.getByText(firstStep)).toBeInTheDocument();
        expect(screen.getByText(lastStep)).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Copy link'
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Continue anyway'
        })).toBeInTheDocument();
    });

    it('moves focus to the Copy link action when it opens', async () => {
        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', {
                name: 'Copy link'
            })).toHaveFocus();
        });
    });

    it('dismisses the notice for the rest of the session when Continue anyway is clicked', async () => {
        const user = userEvent.setup();

        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        const { unmount } = render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await user.click(await screen.findByRole('button', {
            name: 'Continue anyway'
        }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        unmount();

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('dismisses the notice when Escape is pressed', async () => {
        const user = userEvent.setup();

        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', {
                name: 'Copy link'
            })).toHaveFocus();
        });

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('copies the current URL and confirms when Copy link is clicked', async () => {
        const user = userEvent.setup();
        const writeText = vi.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText
            }
        });

        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await user.click(await screen.findByRole('button', {
            name: 'Copy link'
        }));

        expect(writeText).toHaveBeenCalledWith(location.href);
        expect(await screen.findByText('Link copied')).toBeInTheDocument();
    });

    it('shows a failure message when the clipboard rejects', async () => {
        const user = userEvent.setup();
        const writeText = vi.fn<(url: string) => Promise<void>>().mockRejectedValue(new Error('clipboard denied'));

        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText
            }
        });

        vi.mocked(isInAppBrowser).mockReturnValue(true);
        vi.mocked(getInstallPlatform).mockReturnValue(InstallPlatform.Ios);

        render(
            <ToastProvider>
                <InAppBrowserNotice {...props} />
            </ToastProvider>
        );

        await user.click(await screen.findByRole('button', {
            name: 'Copy link'
        }));

        expect(await screen.findByText('Could not copy the link')).toBeInTheDocument();
    });
});
