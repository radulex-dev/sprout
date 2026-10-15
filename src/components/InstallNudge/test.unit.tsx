import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { STEPS_HEADING } from '@/containers/SettingsScreen/InstallGuide/constants';
import { INSTALL_NUDGE_BODY, INSTALL_NUDGE_DISMISS_LABEL, INSTALL_NUDGE_INSTALL_LABEL, INSTALL_NUDGE_REGION_LABEL, INSTALL_NUDGE_SHOW_ME_HOW_LABEL, INSTALL_NUDGE_TITLE } from './constants';
import { INSTALL_NUDGE_HANDOFF_KEY, INSTALL_NUDGE_SEEN_KEY } from '@/services/install-nudge/constants';

// Components
import InstallNudge from './index';

// Services
import { InstallBrowser, InstallPlatform } from '@/services/install';

const { useInstallMock, usePathnameMock } = vi.hoisted(() => {
    return {
        useInstallMock: vi.fn(),
        usePathnameMock: vi.fn()
    };
});

vi.mock('@/hooks', () => {
    return {
        useInstall: useInstallMock
    };
});

vi.mock('next/navigation', () => {
    return {
        usePathname: usePathnameMock
    };
});

const props: React.ComponentProps<typeof InstallNudge> = {};

describe('<InstallNudge />', () => {
    it('is hidden without the add-plant handoff', () => {
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();
    });

    it('is hidden when the app is already installed', () => {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: true,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();
    });

    it('is hidden when the nudge is suppressed', () => {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        localStorage.setItem(INSTALL_NUDGE_SEEN_KEY, String(Date.now()));
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();
    });

    it('is shown after a plant is added without marking itself seen', () => {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        expect(screen.getByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).toBeInTheDocument();
        expect(screen.getByText(INSTALL_NUDGE_TITLE)).toBeInTheDocument();
        expect(screen.getByText(INSTALL_NUDGE_BODY)).toBeInTheDocument();
        expect(sessionStorage.getItem(INSTALL_NUDGE_HANDOFF_KEY)).toBeNull();
        expect(localStorage.getItem(INSTALL_NUDGE_SEEN_KEY)).toBeNull();
    });

    it('appears on the navigation that follows an add, when the handoff is written after mount', () => {
        usePathnameMock.mockReturnValue('/identify');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        const { rerender } = render(<InstallNudge {...props} />);

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();

        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        usePathnameMock.mockReturnValue('/plants/7b2cf2aa-b8d8-4e56-9ae0-c1f7a89082b8');
        rerender(<InstallNudge {...props} />);

        expect(screen.getByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).toBeInTheDocument();
    });

    it('waits for the install state before showing the nudge', () => {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: undefined,
            isPhone: undefined,
            platform: undefined,
            browser: undefined,
            isInApp: undefined,
            canPrompt: false,
            promptInstall: vi.fn()
        });

        const { rerender } = render(<InstallNudge {...props} />);

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();

        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });
        rerender(<InstallNudge {...props} />);

        expect(screen.getByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).toBeInTheDocument();
    });

    it('dismisses and marks itself seen when Not now is clicked', async () => {
        const user = userEvent.setup();

        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        await user.click(screen.getByRole('button', {
            name: INSTALL_NUDGE_DISMISS_LABEL
        }));

        expect(screen.queryByRole('region', {
            name: INSTALL_NUDGE_REGION_LABEL
        })).not.toBeInTheDocument();
        expect(Number(localStorage.getItem(INSTALL_NUDGE_SEEN_KEY))).toBeCloseTo(Date.now(), -3);
    });

    it.each([{
        platform: InstallPlatform.Ios,
        canPrompt: false,
        actionLabel: INSTALL_NUDGE_SHOW_ME_HOW_LABEL
    }, {
        platform: InstallPlatform.Chromium,
        canPrompt: true,
        actionLabel: INSTALL_NUDGE_INSTALL_LABEL
    }])('offers the $actionLabel primary action on $platform', ({ platform, canPrompt, actionLabel }) => {
        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform,
            browser: InstallBrowser.Other,
            isInApp: false,
            canPrompt,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        expect(screen.getByRole('button', {
            name: actionLabel
        })).toBeInTheDocument();
    });

    it('starts the native install prompt and marks itself seen from the primary action', async () => {
        const user = userEvent.setup();
        const promptInstall = vi.fn().mockResolvedValue(undefined);

        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Chromium,
            browser: InstallBrowser.Chrome,
            isInApp: false,
            canPrompt: true,
            promptInstall
        });

        render(<InstallNudge {...props} />);

        await user.click(screen.getByRole('button', {
            name: INSTALL_NUDGE_INSTALL_LABEL
        }));

        expect(promptInstall).toHaveBeenCalledTimes(1);
        expect(Number(localStorage.getItem(INSTALL_NUDGE_SEEN_KEY))).toBeCloseTo(Date.now(), -3);
    });

    it('opens the install guide from the primary action without a native prompt', async () => {
        const user = userEvent.setup();

        sessionStorage.setItem(INSTALL_NUDGE_HANDOFF_KEY, '1');
        useInstallMock.mockReturnValue({
            isStandalone: false,
            isPhone: true,
            platform: InstallPlatform.Ios,
            browser: InstallBrowser.Safari,
            isInApp: false,
            canPrompt: false,
            promptInstall: vi.fn()
        });

        render(<InstallNudge {...props} />);

        await user.click(screen.getByRole('button', {
            name: INSTALL_NUDGE_SHOW_ME_HOW_LABEL
        }));

        expect(screen.getByRole('alertdialog')).toHaveTextContent(STEPS_HEADING);
    });
});
