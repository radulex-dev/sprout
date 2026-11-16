import classNames from 'classnames';
import React from 'react';

// Constants
import { NoticeTone } from './constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'p'> {
    tone?: NoticeTone;
}

const Notice: React.FunctionComponent<Props> = ({ tone = NoticeTone.Info, className, role = 'status', ...props }) => {
    const classes = classNames(styles.root, {
        [styles.warn]: tone === NoticeTone.Warn
    }, className);

    return <p className={classes} role={tone === NoticeTone.Warn ? 'alert' : role} {...props} />;
};

export default Notice;
