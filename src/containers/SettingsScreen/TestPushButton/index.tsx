'use client';

import classNames from 'classnames';
import React from 'react';
import { BellRing } from 'lucide-react';

// Constants
import { RING_LENGTH, RING_RADIUS, TEST_PUSH_LABEL } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button, { type DiscriminatedButtonProps } from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends React.PropsWithoutRef<DiscriminatedButtonProps['Button']> {
    cooldown: number;
    total: number;
    onSend: () => void;
}

const TestPushButton: React.FunctionComponent<Props> = ({ cooldown, total, onSend, ...props }) => {
    const isCoolingDown = cooldown > 0;
    const classes = classNames(styles.root);
    const ringOffset = RING_LENGTH * ((total - cooldown) / total);

    const renderContent = () => {
        if (!isCoolingDown) {
            return (
                <BellRing size="1rem" aria-hidden />
            );
        }

        return (
            <React.Fragment>
                <svg className={styles.ring} viewBox="0 0 28 28" aria-hidden>
                    <circle className={styles.ringCircle} cx="14" cy="14" r={RING_RADIUS} strokeDasharray={RING_LENGTH} strokeDashoffset={ringOffset} />
                </svg>
                <span className={styles.countdown} aria-hidden>
                    {cooldown}
                </span>
            </React.Fragment>
        );
    };

    return (
        <Button variant={ButtonVariant.Unstyled} className={classes} disabled={isCoolingDown} aria-label={TEST_PUSH_LABEL} onClick={onSend} {...props}>
            {renderContent()}
        </Button>
    );
};

export default TestPushButton;
