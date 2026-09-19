import classNames from 'classnames';
import React from 'react';
import { Download } from 'lucide-react';

// Constants
import { INSTALL_GUIDE_CONTENT, STEPS_HEADING } from './constants';

// Services
import type { InstallPlatform } from '@/services/install';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    platform: InstallPlatform;
}

const InstallGuide: React.FunctionComponent<Props> = ({ platform, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const content = INSTALL_GUIDE_CONTENT[platform];

    const renderStep = (step: string) => {
        return (
            <li key={step} className={styles.step}>{step}</li>
        );
    };

    return (
        <div className={classes} {...props}>
            <h3 className={styles.heading}>
                <Download size="1rem" aria-hidden />
                {STEPS_HEADING}
            </h3>
            <ol className={styles.steps}>
                {content.steps.map((step) => {
                    return renderStep(step);
                })}
            </ol>
        </div>
    );
};

export default InstallGuide;
