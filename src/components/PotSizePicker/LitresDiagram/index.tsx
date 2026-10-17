'use client';

import classNames from 'classnames';
import React, { useId } from 'react';

// Constants
import { ARITHMETIC, DIAGRAM_DESC, DIAGRAM_HEADING, DIAGRAM_LEAD_CAPACITY, DIAGRAM_LEAD_MEASURE, DIAGRAM_TEXT, DIAGRAM_TITLE, DIAGRAM_VIEW_BOX, FILL_LABEL, FILL_LINE, FILL_SOURCE, FILL_START, FILL_STRAIGHT, FILL_TAPERED, FOOTNOTE, HEIGHT_ARROW, HEIGHT_EXTENSION_BOTTOM, HEIGHT_EXTENSION_TOP, HEIGHT_LABEL, LENGTH_ARROW, LENGTH_EXTENSION_LEFT, LENGTH_EXTENSION_RIGHT, LENGTH_LABEL, MARKER_PATH, MARKER_REF_X, MARKER_REF_Y, MARKER_SIZE, PLANTER_FRONT_PATH, PLANTER_SIDE_PATH, PLANTER_TOP_PATH, SECTION_PATH, SECTION_SOIL_PATH, STEP_ARROW, STEP_POUR, STEP_REPEAT, STEP_SOAK, STEP_TAIL, WIDTH_ARROW, WIDTH_EXTENSION_LEFT, WIDTH_EXTENSION_RIGHT, WIDTH_LABEL } from './constants';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {}

const LitresDiagram: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);
    const baseId = useId().replaceAll(/[^a-zA-Z0-9]/g, '');
    const titleId = `${baseId}-title`;
    const descId = `${baseId}-desc`;
    const markerStart = `url(#${baseId}-marker)`;

    return (
        <div className={classes} {...props}>
            <svg aria-describedby={descId} aria-labelledby={titleId} className={styles.diagram} role="img" viewBox={DIAGRAM_VIEW_BOX}>
                <title id={titleId}>{DIAGRAM_TITLE}</title>
                <desc id={descId}>{DIAGRAM_DESC}</desc>
                <defs>
                    <marker id={`${baseId}-marker`} markerHeight={MARKER_SIZE} markerWidth={MARKER_SIZE} orient="auto-start-reverse" refX={MARKER_REF_X} refY={MARKER_REF_Y} viewBox="0 0 8 8">
                        <path className={styles.marker} d={MARKER_PATH} />
                    </marker>
                </defs>
                <text className={styles.heading} x="0" y="13">{DIAGRAM_HEADING}</text>
                <text className={styles.lead} x="0" y="29">{DIAGRAM_LEAD_CAPACITY}</text>
                <text className={styles.lead} x="0" y="41">{DIAGRAM_LEAD_MEASURE}</text>
                <path className={styles.planterTop} d={PLANTER_TOP_PATH} />
                <path className={styles.planterFront} d={PLANTER_FRONT_PATH} />
                <path className={styles.planterSide} d={PLANTER_SIDE_PATH} />
                <g className={styles.dimension}>
                    <path className={styles.extension} d={LENGTH_EXTENSION_LEFT} />
                    <path className={styles.extension} d={LENGTH_EXTENSION_RIGHT} />
                    <path d={LENGTH_ARROW} markerEnd={markerStart} markerStart={markerStart} />
                    <path className={styles.extension} d={WIDTH_EXTENSION_LEFT} />
                    <path className={styles.extension} d={WIDTH_EXTENSION_RIGHT} />
                    <path d={WIDTH_ARROW} markerEnd={markerStart} markerStart={markerStart} />
                    <path className={styles.extension} d={HEIGHT_EXTENSION_TOP} />
                    <path className={styles.extension} d={HEIGHT_EXTENSION_BOTTOM} />
                    <path d={HEIGHT_ARROW} markerEnd={markerStart} markerStart={markerStart} />
                </g>
                <text className={styles.label} textAnchor="middle" x="130" y="62">{LENGTH_LABEL}</text>
                <text className={styles.label} textAnchor="middle" x="92" y="200">{WIDTH_LABEL}</text>
                <text className={styles.label} x="210" y="112">{HEIGHT_LABEL}</text>
                <rect className={styles.panel} height="30" rx="8" width="288" x="0" y="210" />
                <text className={styles.amount} textAnchor="middle" x="144" y="229.5">{ARITHMETIC}</text>
                <rect className={styles.panelSoft} height="68" rx="8" width="288" x="0" y="250" />
                <path className={styles.section} d={SECTION_PATH} />
                <path className={styles.sectionSoil} d={SECTION_SOIL_PATH} />
                <path className={styles.fillLine} d={FILL_LINE} />
                <text className={styles.mutedSmall} textAnchor="middle" x="46" y="287">{FILL_LABEL}</text>
                <text className={styles.mutedSmall} x="92" y="264">{FILL_SOURCE}</text>
                <text className={styles.label} x="92" y="281">{FILL_TAPERED}</text>
                <text className={styles.label} x="92" y="296">{FILL_STRAIGHT}</text>
                <text className={styles.mutedSmall} x="92" y="311">{FILL_START}</text>
                <rect className={styles.panel} height="22" rx="6" width="82" x="0" y="328" />
                <text className={styles.step} textAnchor="middle" x="41" y="342.5">{STEP_POUR}</text>
                <text className={styles.stepArrow} textAnchor="middle" x="91" y="342.5">{STEP_ARROW}</text>
                <rect className={styles.panel} height="22" rx="6" width="82" x="100" y="328" />
                <text className={styles.step} textAnchor="middle" x="141" y="342.5">{STEP_SOAK}</text>
                <text className={styles.stepArrow} textAnchor="middle" x="191" y="342.5">{STEP_ARROW}</text>
                <rect className={styles.panel} height="22" rx="6" width="88" x="200" y="328" />
                <text className={styles.step} textAnchor="middle" x="244" y="342.5">{STEP_REPEAT}</text>
                <text className={styles.mutedSmall} x="0" y="364">{STEP_TAIL}</text>
            </svg>
            <p className={styles.footnote}>{FOOTNOTE}</p>
            <p className={styles.srOnly}>{DIAGRAM_TEXT}</p>
        </div>
    );
};

export default LitresDiagram;
