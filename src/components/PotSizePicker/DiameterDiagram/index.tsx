'use client';

import classNames from 'classnames';
import React, { useId } from 'react';

// Constants
import { BASE_ARROW, BASE_CAPTION, BASE_EXTENSION_LEFT, BASE_EXTENSION_RIGHT, BASE_POT_TRANSFORM, CHECK_PATH, CROSS_PATH, DIAGRAM_DESC, DIAGRAM_HEADING, DIAGRAM_LEAD, DIAGRAM_TEXT, DIAGRAM_TITLE, DIAGRAM_VIEW_BOX, DIAMETER_LABEL, LITRES_REDIRECT_LINE, MAIN_ARROW, MAIN_EXTENSION_LEFT, MAIN_EXTENSION_RIGHT, MAIN_POT_TRANSFORM, MARKER_PATH, MARKER_REF_X, MARKER_REF_Y, MARKER_SIZE, RANGE_LINE, TOP_ARROW, TOP_CAPTION, TOP_EXTENSION_LEFT, TOP_EXTENSION_RIGHT, TOP_POT_TRANSFORM } from './constants';
import { POT_GLYPH_BODY_PATH, POT_GLYPH_RIM_HEIGHT, POT_GLYPH_RIM_RADIUS, POT_GLYPH_RIM_WIDTH, POT_GLYPH_RIM_X, POT_GLYPH_RIM_Y } from '../constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const DiameterDiagram: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);
    const baseId = useId().replaceAll(/[^a-zA-Z0-9]/g, '');
    const titleId = `${baseId}-title`;
    const descId = `${baseId}-desc`;
    const markerStart = `url(#${baseId}-marker)`;
    const wrongMarkerStart = `url(#${baseId}-marker-wrong)`;

    const renderPot = (transform: string) => {
        return (
            <g transform={transform}>
                <path className={styles.potBody} d={POT_GLYPH_BODY_PATH} />
                <rect className={styles.potRim} height={POT_GLYPH_RIM_HEIGHT} rx={POT_GLYPH_RIM_RADIUS} width={POT_GLYPH_RIM_WIDTH} x={POT_GLYPH_RIM_X} y={POT_GLYPH_RIM_Y} />
            </g>
        );
    };

    return (
        <div className={classes} {...props}>
            <svg aria-describedby={descId} aria-labelledby={titleId} className={styles.diagram} role="img" viewBox={DIAGRAM_VIEW_BOX}>
                <title id={titleId}>{DIAGRAM_TITLE}</title>
                <desc id={descId}>{DIAGRAM_DESC}</desc>
                <defs>
                    <marker id={`${baseId}-marker`} markerHeight={MARKER_SIZE} markerWidth={MARKER_SIZE} orient="auto-start-reverse" refX={MARKER_REF_X} refY={MARKER_REF_Y} viewBox="0 0 8 8">
                        <path className={styles.marker} d={MARKER_PATH} />
                    </marker>
                    <marker id={`${baseId}-marker-wrong`} markerHeight={MARKER_SIZE} markerWidth={MARKER_SIZE} orient="auto-start-reverse" refX={MARKER_REF_X} refY={MARKER_REF_Y} viewBox="0 0 8 8">
                        <path className={styles.markerWrong} d={MARKER_PATH} />
                    </marker>
                </defs>
                <text className={styles.title} x="0" y="13">{DIAGRAM_HEADING}</text>
                <text className={styles.lead} x="0" y="29">{DIAGRAM_LEAD}</text>
                {renderPot(MAIN_POT_TRANSFORM)}
                <g className={styles.dimension}>
                    <path className={styles.extension} d={MAIN_EXTENSION_LEFT} />
                    <path className={styles.extension} d={MAIN_EXTENSION_RIGHT} />
                    <path d={MAIN_ARROW} markerEnd={markerStart} markerStart={markerStart} />
                </g>
                <text className={styles.label} textAnchor="middle" x="143.8" y="53">{DIAMETER_LABEL}</text>
                {renderPot(TOP_POT_TRANSFORM)}
                <g className={styles.dimension}>
                    <path className={styles.extension} d={TOP_EXTENSION_LEFT} />
                    <path className={styles.extension} d={TOP_EXTENSION_RIGHT} />
                    <path d={TOP_ARROW} markerEnd={markerStart} markerStart={markerStart} />
                </g>
                <circle className={styles.checkCircle} cx="114" cy="250" r="8" />
                <path className={styles.checkMark} d={CHECK_PATH} />
                <text className={styles.label} textAnchor="middle" x="72" y="312">{TOP_CAPTION}</text>
                {renderPot(BASE_POT_TRANSFORM)}
                <g className={styles.dimensionWrong}>
                    <path d={BASE_EXTENSION_LEFT} />
                    <path d={BASE_EXTENSION_RIGHT} />
                    <path d={BASE_ARROW} markerEnd={wrongMarkerStart} markerStart={wrongMarkerStart} />
                </g>
                <circle className={styles.crossCircle} cx="250" cy="250" r="8" />
                <path className={styles.crossMark} d={CROSS_PATH} />
                <text className={styles.crossText} textAnchor="middle" x="208" y="312">{BASE_CAPTION}</text>
                <text className={styles.rangeLine} x="0" y="342">{RANGE_LINE}</text>
                <text className={styles.mutedLine} x="0" y="358">{LITRES_REDIRECT_LINE}</text>
            </svg>
            <p className={styles.srOnly}>{DIAGRAM_TEXT}</p>
        </div>
    );
};

export default DiameterDiagram;
