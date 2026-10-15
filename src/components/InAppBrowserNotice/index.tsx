'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Compass } from 'lucide-react';

// Constants
import { ANDROID_NOTICE_CONTENT, CONTINUE_ANYWAY_LABEL, COPY_LINK_FAILURE_MESSAGE, COPY_LINK_LABEL, COPY_LINK_SUCCESS_MESSAGE, IOS_NOTICE_CONTENT } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';
import { ToastVariant } from '@/design-system/Toast/constants';

// Components
import Button from '@/design-system/Button';

// Helpers
import { copyCurrentUrl, markNoticeDismissed } from './helpers';

// Hooks
import { useNoticePlatform } from './hooks';
import { useToast } from '@/design-system/hooks/useToast';

// Styles
import styles from './styles.module.css';

// Types
import { InstallPlatform } from '@/services/install/types';

export interface Props extends React.ComponentProps<'div'> {}

const InAppBrowserNotice: React.FunctionComponent<Props> = ({ className, role = 'dialog', ...props }) => {
    const classes = classNames(styles.root, className);
    const titleId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const showToast = useToast();
    const detectedPlatform = useNoticePlatform();
    const [isDismissed, setIsDismissed] = useState(false);

    const platform = isDismissed ? undefined : detectedPlatform;

    const handleDismiss = useCallback(() => {
        markNoticeDismissed();
        setIsDismissed(true);
    }, []);

    const handleCopyLink = useCallback(async () => {
        const didCopy = await copyCurrentUrl();

        showToast({
            variant: didCopy ? ToastVariant.Success : ToastVariant.Error,
            title: didCopy ? COPY_LINK_SUCCESS_MESSAGE : COPY_LINK_FAILURE_MESSAGE
        });
    }, [showToast]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            handleDismiss();

            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
        const firstButton = buttons.at(0);
        const lastButton = buttons.at(-1);

        if (event.shiftKey && document.activeElement === firstButton) {
            event.preventDefault();
            lastButton?.focus();

            return;
        }

        if (!event.shiftKey && document.activeElement === lastButton) {
            event.preventDefault();
            firstButton?.focus();
        }
    }, [handleDismiss]);

    useEffect(() => {
        if (!platform) {
            return;
        }

        rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }, [platform]);

    if (!platform) {
        return;
    }

    const content = platform === InstallPlatform.Ios ? IOS_NOTICE_CONTENT : ANDROID_NOTICE_CONTENT;

    return (
        <div ref={rootRef} className={classes} role={role} aria-modal="true" aria-labelledby={titleId} onKeyDown={handleKeyDown} {...props}>
            <div className={styles.content}>
                <span className={styles.icon} aria-hidden>
                    <Compass size="2.5rem" />
                </span>
                <h2 id={titleId} className={styles.title}>{content.title}</h2>
                <p className={styles.body}>{content.body}</p>
                <ol className={styles.steps} role="list">
                    {content.steps.map((step, index) => {
                        return (
                            <li key={step} className={styles.step}>
                                <span className={styles.stepNumber} aria-hidden>{index + 1}</span>
                                {step}
                            </li>
                        );
                    })}
                </ol>
                <div className={styles.actions}>
                    <Button variant={ButtonVariant.Primary} onClick={handleCopyLink}>{COPY_LINK_LABEL}</Button>
                    <Button variant={ButtonVariant.Secondary} onClick={handleDismiss}>{CONTINUE_ANYWAY_LABEL}</Button>
                </div>
            </div>
        </div>
    );
};

export default InAppBrowserNotice;
