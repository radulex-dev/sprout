import classNames from 'classnames';
import React from 'react';
import { SquareArrowUp } from 'lucide-react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'span'> {}

const ShareStep: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);

    return (
        <span className={classes} aria-hidden {...props}>
            <SquareArrowUp size="0.875rem" />
        </span>
    );
};

export default ShareStep;
