import classNames from 'classnames';
import React from 'react';
import { Info } from 'lucide-react';

// Constants
import { NO_MARGIN_STYLE } from '../constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    plantCount: number;
}

const AboutCard: React.FunctionComponent<Props> = ({ plantCount, className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <div className={classes} {...props}>
            <h2>
                <Info size="1.125rem" aria-hidden />
                About
            </h2>
            <p style={NO_MARGIN_STYLE}>
                {`Sprout — ${plantCount} plant${plantCount === 1 ? '' : 's'} tracked. Your plants are synced to your account and available on any device. Install via your browser's "Add to Home Screen" for the full app experience.`}
            </p>
        </div>
    );
};

export default AboutCard;
