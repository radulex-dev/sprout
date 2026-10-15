import classNames from 'classnames';
import React from 'react';
import { Check, Smartphone } from 'lucide-react';

// Constants
import { INSTALL_ACTION_LABEL, INSTALL_DESCRIPTION, INSTALL_LABEL, INSTALLED_LABEL, SHOW_STEPS_LABEL } from '../constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    isInstalled: boolean;
    canPrompt: boolean;
    onInstall: () => void;
    onShowSteps: () => void;
}

const InstallCard: React.FunctionComponent<Props> = ({ isInstalled, canPrompt, onInstall, onShowSteps, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const renderInstalled = () => {
        return (
            <div className={styles.installed}>
                <span className={styles.check} aria-hidden>
                    <Check size="1rem" />
                </span>
                <span className={styles.installedLabel}>
                    {INSTALLED_LABEL}
                </span>
            </div>
        );
    };

    const renderUninstalled = () => {
        return (
            <div className={styles.actions}>
                {canPrompt ? (
                    <Button variant={ButtonVariant.Primary} onClick={onInstall}>
                        {INSTALL_ACTION_LABEL}
                    </Button>
                ) : undefined}
                <Button variant={canPrompt ? ButtonVariant.Secondary : ButtonVariant.Primary} onClick={onShowSteps}>
                    {SHOW_STEPS_LABEL}
                </Button>
            </div>
        );
    };

    return (
        <div className={classes} {...props}>
            <h2>
                <Smartphone size="1.125rem" aria-hidden />
                {INSTALL_LABEL}
            </h2>
            <p>
                {INSTALL_DESCRIPTION}
            </p>
            {isInstalled ? renderInstalled() : renderUninstalled()}
        </div>
    );
};

export default InstallCard;
