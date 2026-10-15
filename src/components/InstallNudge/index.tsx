'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Constants
import { CONFIRM_LABEL, INSTALL_GUIDE_CONTENT } from '@/containers/SettingsScreen/InstallGuide/constants';
import { INSTALL_NUDGE_BODY, INSTALL_NUDGE_DISMISS_LABEL, INSTALL_NUDGE_INSTALL_LABEL, INSTALL_NUDGE_REGION_LABEL, INSTALL_NUDGE_SHOW_ME_HOW_LABEL, INSTALL_NUDGE_TITLE } from './constants';
import { ButtonSize, ButtonVariant } from '@/design-system/Button/constants';

// Components
import InstallGuide from '@/containers/SettingsScreen/InstallGuide';
import AlertDialog from '@/design-system/AlertDialog';
import Button from '@/design-system/Button';

// Hooks
import { useInstall } from '@/hooks';
import { useInstallNudgeState } from './hooks';

// Services
import { InstallPlatform } from '@/services/install';
import { markNudgeSeen } from '@/services/install-nudge';
import { clearInstallNudgeHandoff } from '@/services/install-nudge/helpers';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const InstallNudge: React.FunctionComponent<Props> = ({ className, role = 'region', ...props }) => {
    const classes = classNames(styles.root, className);
    const pathname = usePathname();
    const { isStandalone, isPhone, platform, canPrompt, promptInstall } = useInstall();
    const { isPending, isSuppressed } = useInstallNudgeState(pathname);

    const [isDismissed, setIsDismissed] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const isVisible = isPending && !isSuppressed && !isDismissed && isStandalone === false && isPhone === true;

    const guidePlatform = platform ?? InstallPlatform.Other;
    const guideContent = INSTALL_GUIDE_CONTENT[guidePlatform];

    useEffect(() => {
        if (!isVisible) {
            return;
        }

        clearInstallNudgeHandoff();
    }, [isVisible]);

    const handlePrimary = useCallback(async () => {
        markNudgeSeen();

        if (canPrompt) {
            await promptInstall();

            return;
        }

        setIsGuideOpen(true);
    }, [canPrompt, promptInstall]);

    const handleDismiss = useCallback(() => {
        markNudgeSeen();
        setIsDismissed(true);
    }, []);

    const handleCloseGuide = useCallback(() => {
        setIsGuideOpen(false);
    }, []);

    if (!isVisible) {
        return;
    }

    return (
        <React.Fragment>
            <div className={classes} role={role} aria-label={INSTALL_NUDGE_REGION_LABEL} {...props}>
                <div className={styles.intro}>
                    <div className={styles.header}>
                        <img className={styles.icon} src="/icon-192.png" alt="" />
                        <p className={styles.title}>{INSTALL_NUDGE_TITLE}</p>
                    </div>
                    <p className={styles.body}>{INSTALL_NUDGE_BODY}</p>
                </div>
                <div className={styles.actions}>
                    <Button size={ButtonSize.Sm} grow onClick={handlePrimary}>
                        {canPrompt ? INSTALL_NUDGE_INSTALL_LABEL : INSTALL_NUDGE_SHOW_ME_HOW_LABEL}
                    </Button>
                    <Button className={styles.dismiss} variant={ButtonVariant.Unstyled} size={ButtonSize.Sm} onClick={handleDismiss}>
                        {INSTALL_NUDGE_DISMISS_LABEL}
                    </Button>
                </div>
            </div>
            <AlertDialog isOpen={isGuideOpen} title={guideContent.title} description={guideContent.description} confirmLabel={CONFIRM_LABEL} confirmVariant={ButtonVariant.Primary} hideCancel onConfirm={handleCloseGuide} onCancel={handleCloseGuide}>
                <InstallGuide platform={guidePlatform} />
            </AlertDialog>
        </React.Fragment>
    );
};

export default InstallNudge;
