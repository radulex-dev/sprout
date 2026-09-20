import classNames from 'classnames';
import React from 'react';
import { Database } from 'lucide-react';

// Constants
import { CREDITS_TITLE, PLANTNET_CREDIT, PLANTNET_LINK_LABEL, PLANTNET_URL, PLANTSOLVE_CREDIT, PLANTSOLVE_LINK_LABEL, PLANTSOLVE_URL } from './constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const CreditsCard: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <div className={classes} {...props}>
            <h2>
                <Database size="1.125rem" aria-hidden />
                {CREDITS_TITLE}
            </h2>
            <p>
                {PLANTSOLVE_CREDIT}
                <a href={PLANTSOLVE_URL} target="_blank" rel="noreferrer">
                    {PLANTSOLVE_LINK_LABEL}
                </a>
            </p>
            <p>
                {PLANTNET_CREDIT}
                <a href={PLANTNET_URL} target="_blank" rel="noreferrer">
                    {PLANTNET_LINK_LABEL}
                </a>
            </p>
        </div>
    );
};

export default CreditsCard;
