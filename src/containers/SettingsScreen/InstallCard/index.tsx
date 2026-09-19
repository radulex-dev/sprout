import classNames from 'classnames';
import React from 'react';
import { Download } from 'lucide-react';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    onInstall: () => void;
}

const InstallCard: React.FunctionComponent<Props> = ({ onInstall, className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <div className={classes} {...props}>
            <h2>
                <Download size="1.125rem" aria-hidden />
                Install app
            </h2>
            <p>
                Get the full-screen app experience, without the browser controls.
            </p>
            <Button block onClick={onInstall}>
                Install Sprout
            </Button>
        </div>
    );
};

export default InstallCard;
