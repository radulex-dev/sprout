'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';

// Constants
import { ANALYTICS_CONSENT_ACCEPT_LABEL, ANALYTICS_CONSENT_DECLINE_LABEL, ANALYTICS_CONSENT_EXIT_MS, ANALYTICS_CONSENT_MESSAGE } from './constants';
import { ButtonSize, ButtonVariant } from '@/design-system/Button/constants';

// Components
import Analytics from '@/components/Analytics';
import Button from '@/design-system/Button';

// Hooks
import { useAnalyticsConsent } from '@/hooks';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const AnalyticsConsent: React.FunctionComponent<Props> = ({ className, role = 'region', ...props }) => {
    const { isLoaded, consent, accept, decline } = useAnalyticsConsent();
    const [isLeaving, setIsLeaving] = useState(false);
    const isHidden = !isLoaded || consent === false;

    const handleAccept = useCallback(() => {
        accept();
        setIsLeaving(true);
    }, [accept]);

    const handleDecline = useCallback(() => {
        decline();
        setIsLeaving(true);
    }, [decline]);

    useEffect(() => {
        if (!isLeaving) {
            return;
        }

        const timeout = setTimeout(() => {
            setIsLeaving(false);
        }, ANALYTICS_CONSENT_EXIT_MS);

        return () => {
            clearTimeout(timeout);
        };
    }, [isLeaving]);

    if (!isLeaving && isLoaded && consent === true) {
        return <Analytics />;
    }

    if (!isLeaving && isHidden) {
        return;
    }

    const classes = classNames(styles.root, {
        [styles.leaving]: isLeaving
    }, className);

    return (
        <div className={classes} role={role} {...props}>
            <p className={styles.message}>
                {ANALYTICS_CONSENT_MESSAGE}
            </p>
            <div className={styles.actions}>
                <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={handleDecline}>
                    {ANALYTICS_CONSENT_DECLINE_LABEL}
                </Button>
                <Button size={ButtonSize.Sm} onClick={handleAccept}>
                    {ANALYTICS_CONSENT_ACCEPT_LABEL}
                </Button>
            </div>
        </div>
    );
};

export default AnalyticsConsent;
