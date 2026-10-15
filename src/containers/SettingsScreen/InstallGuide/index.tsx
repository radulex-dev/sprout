import classNames from 'classnames';
import React from 'react';
import { Download, Info } from 'lucide-react';

// Constants
import { STEPS_HEADING } from './constants';

// Components
import AddToHomeScreenStep from './AddToHomeScreenStep';
import HomeIconStep from './HomeIconStep';
import ShareStep from './ShareStep';
import WebAppSheetStep from './WebAppSheetStep';

// Helpers
import { getInstallGuideContent } from './helpers';

// Services
import type { InstallBrowser, InstallPlatform } from '@/services/install';

// Styles
import styles from './styles.module.css';

// Types
import { StepIllustration, type InstallGuideStep } from './types';

export interface Props extends React.ComponentProps<'div'> {
    platform: InstallPlatform;
    browser?: InstallBrowser;
}

const renderIllustration = (illustration: StepIllustration) => {
    if (illustration === StepIllustration.Share) {
        return <ShareStep />;
    }

    if (illustration === StepIllustration.AddToHomeScreen) {
        return <AddToHomeScreenStep />;
    }

    if (illustration === StepIllustration.WebAppSheet) {
        return <WebAppSheetStep />;
    }

    return <HomeIconStep />;
};

const renderStep = (step: InstallGuideStep, index: number) => {
    return (
        <li key={step.title} className={styles.step}>
            <span className={styles.stepNum} aria-hidden>
                {index + 1}
            </span>
            <div className={styles.stepContent}>
                <p className={styles.stepTitle}>
                    {step.title}
                </p>
                {step.hint && (
                    <p className={styles.stepHint}>
                        {step.hint}
                    </p>
                )}
                {step.illustration && renderIllustration(step.illustration)}
            </div>
        </li>
    );
};

const InstallGuide: React.FunctionComponent<Props> = ({ platform, browser, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const content = getInstallGuideContent(platform, browser);

    return (
        <div className={classes} {...props}>
            <h3 className={styles.heading}>
                <Download size="1rem" aria-hidden />
                {STEPS_HEADING}
            </h3>
            {content.note && (
                <p className={styles.note}>
                    <Info size="0.875rem" aria-hidden />
                    {content.note}
                </p>
            )}
            <ol className={styles.steps}>
                {content.steps.map((step, index) => {
                    return renderStep(step, index);
                })}
            </ol>
        </div>
    );
};

export default InstallGuide;
