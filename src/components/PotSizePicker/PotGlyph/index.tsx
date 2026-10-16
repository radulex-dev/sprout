import classNames from 'classnames';
import React from 'react';

// Constants
import { POT_GLYPH_BODY_PATH, POT_GLYPH_RIM_HEIGHT, POT_GLYPH_RIM_RADIUS, POT_GLYPH_RIM_WIDTH, POT_GLYPH_RIM_X, POT_GLYPH_RIM_Y, POT_GLYPH_VIEW_BOX, POT_WIDTH_REM_PER_CM } from '../constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'svg'> {
    diameter: number;
    selected: boolean;
}

const PotGlyph: React.FunctionComponent<Props> = ({ diameter, selected, className, ...props }) => {
    const classes = classNames(styles.root, {
        [styles.selected]: selected
    }, className);
    const potStyle: React.CSSProperties = {
        width: `${Number((diameter * POT_WIDTH_REM_PER_CM).toFixed(4))}rem`
    };

    return (
        <svg aria-hidden className={classes} style={potStyle} viewBox={POT_GLYPH_VIEW_BOX} {...props}>
            <path className={styles.body} d={POT_GLYPH_BODY_PATH} />
            <rect className={styles.rim} height={POT_GLYPH_RIM_HEIGHT} rx={POT_GLYPH_RIM_RADIUS} width={POT_GLYPH_RIM_WIDTH} x={POT_GLYPH_RIM_X} y={POT_GLYPH_RIM_Y} />
        </svg>
    );
};

export default PotGlyph;
