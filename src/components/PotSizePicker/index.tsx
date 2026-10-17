'use client';

import classNames from 'classnames';
import React, { useCallback, useId, useState } from 'react';
import { Droplet, Info } from 'lucide-react';

// Constants
import { DOSE_MARKS, LITRES_ERROR, LITRES_FIELD_LABEL, LITRES_INFO_LABEL, LITRES_UNIT, LONG_SHAPE_LABEL, POT_CLEAR_LABEL, POT_DIAMETER_INFO_LABEL, POT_SIZE_LABEL, ROUND_SHAPE_LABEL, SHAPE_GROUP_LABEL } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';
import { POT_SIZES } from '@/helpers/pot/constants';

// Components
import Button from '@/design-system/Button';
import Popover from '@/design-system/Popover';
import DiameterDiagram from './DiameterDiagram';
import LitresDiagram from './LitresDiagram';
import PotGlyph from './PotGlyph';

// Helpers
import { dosePillStyle, doseTickStyle, formatLitresAmount, formatPotOptionName, formatRoundAmountSentence, hasContainerSize, litreFillStyle, parseSoilVolumeLitres } from './helpers';
import { formatWaterAmount, getWaterAmountMl } from '@/helpers/pot';

// Styles
import styles from './styles.module.css';

// Types
import { ContainerShape } from './types';
import type { ContainerSize } from '@/helpers/pot/types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange'> {
    value?: ContainerSize;
    onChange: (value?: ContainerSize) => void;
    hint?: string;
}

const PotSizePicker: React.FunctionComponent<Props> = ({ value, onChange, hint, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const labelId = useId();
    const hintId = useId();
    const roundGroupId = useId();
    const shapeGroupId = useId();
    const litresErrorId = useId();
    const [shape, setShape] = useState<ContainerShape>(value?.soilVolumeLitres === undefined ? ContainerShape.Round : ContainerShape.Long);
    const [litresText, setLitresText] = useState(() => {
        return value?.soilVolumeLitres === undefined ? '' : String(value.soilVolumeLitres);
    });
    const amount = getWaterAmountMl(value);
    const describedBy = hint ? hintId : undefined;
    const isSet = hasContainerSize(value);

    const handleShapeChange = useCallback(() => {
        setShape((current) => {
            return current === ContainerShape.Round ? ContainerShape.Long : ContainerShape.Round;
        });
    }, []);

    const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
            potDiameter: Number(event.currentTarget.value)
        });
    }, [onChange]);

    const handleLitresChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextText = event.currentTarget.value;
        const litres = parseSoilVolumeLitres(nextText);

        setLitresText(nextText);

        if (nextText.trim() === '') {
            onChange();

            return;
        }

        if (litres === undefined) {
            return;
        }

        onChange({
            soilVolumeLitres: litres
        });
    }, [onChange]);

    const handleClear = useCallback(() => {
        setShape(ContainerShape.Round);
        setLitresText('');
        onChange({});
    }, [onChange]);

    const renderHintText = () => {
        if (!hint) {
            return;
        }

        return (
            <div className={styles.hint} id={hintId}>
                {hint}
            </div>
        );
    };

    const renderHint = () => {
        return (
            <div className={styles.hintRow}>
                {renderHintText()}
                <Popover aria-label={POT_DIAMETER_INFO_LABEL} className={styles.info} openOnHover trigger={<Info aria-hidden size="1rem" />}>
                    <DiameterDiagram />
                </Popover>
            </div>
        );
    };

    const renderShapes = () => {
        return (
            <div aria-label={SHAPE_GROUP_LABEL} className={styles.shapes} role="radiogroup">
                {[ContainerShape.Round, ContainerShape.Long].map((option) => {
                    const optionClasses = classNames(styles.shape, {
                        [styles.shapeSelected]: shape === option
                    });
                    const optionLabel = option === ContainerShape.Round ? ROUND_SHAPE_LABEL : LONG_SHAPE_LABEL;

                    return (
                        <label className={optionClasses} key={option}>
                            <input aria-label={optionLabel} checked={shape === option} className={styles.shapeInput} name={shapeGroupId} onChange={handleShapeChange} type="radio" value={option} />
                            <span>{optionLabel}</span>
                        </label>
                    );
                })}
            </div>
        );
    };

    const renderOptions = () => {
        return POT_SIZES.map((size) => {
            const isSelected = value?.potDiameter === size.diameter;
            const optionClasses = classNames(styles.option, {
                [styles.optionSelected]: isSelected
            });

            return (
                <label className={optionClasses} key={size.diameter}>
                    <input aria-label={formatPotOptionName(size.diameter)} checked={isSelected} className={styles.optionInput} name={roundGroupId} onChange={handleOptionChange} type="radio" value={size.diameter} />
                    <PotGlyph diameter={size.diameter} selected={isSelected} />
                    <span className={styles.optionLabel}>{size.diameter}</span>
                </label>
            );
        });
    };

    const renderResult = (sentence: string | undefined) => {
        if (sentence === undefined) {
            return;
        }

        return (
            <p aria-live="polite" className={styles.result}>
                <Droplet aria-hidden className={styles.resultIcon} size="0.875rem" />
                <span>{sentence}</span>
            </p>
        );
    };

    const renderRound = () => {
        const sentence = value?.potDiameter === undefined || amount === undefined ? undefined : formatRoundAmountSentence(value.potDiameter, amount);

        return (
            <div className={styles.branch}>
                {renderHint()}
                <div aria-describedby={describedBy} aria-labelledby={labelId} className={styles.grid} role="radiogroup">
                    {renderOptions()}
                </div>
                {renderResult(sentence)}
            </div>
        );
    };

    const renderLitres = () => {
        const isLitresInvalid = litresText !== '' && parseSoilVolumeLitres(litresText) === undefined;
        const sentence = isLitresInvalid || value?.soilVolumeLitres === undefined || amount === undefined ? undefined : formatLitresAmount(amount);

        const renderDosePill = () => {
            if (sentence === undefined || amount === undefined) {
                return;
            }

            return (
                <span className={styles.dosePill} style={dosePillStyle(value?.soilVolumeLitres)}>{formatWaterAmount(amount)}</span>
            );
        };

        return (
            <div className={styles.branch}>
                <div aria-hidden className={styles.scaleHead}>
                    <span className={styles.scaleHeadSpacer} />
                    <span className={styles.scaleUnit}>ml</span>
                </div>
                <div className={styles.longRow}>
                    <div aria-hidden className={styles.gutter}>
                        {renderDosePill()}
                    </div>
                    <div aria-hidden className={styles.bar}>
                        {DOSE_MARKS.map((mark) => {
                            return (
                                <span className={styles.doseTick} key={mark} style={doseTickStyle(mark)} />
                            );
                        })}
                        <div className={styles.fill} style={litreFillStyle(value?.soilVolumeLitres)} />
                    </div>
                    <div className={styles.longSide}>
                        <div className={styles.entry}>
                            <input aria-describedby={isLitresInvalid ? litresErrorId : undefined} aria-label={LITRES_FIELD_LABEL} className={styles.entryInput} inputMode="numeric" onChange={handleLitresChange} type="text" value={litresText} />
                            <span className={styles.entryUnit}>{LITRES_UNIT}</span>
                            <Popover aria-label={LITRES_INFO_LABEL} className={styles.info} openOnHover trigger={<Info aria-hidden size="1rem" />}>
                                <LitresDiagram />
                            </Popover>
                        </div>
                        {renderResult(sentence)}
                        {isLitresInvalid && (
                            <p className={styles.error} id={litresErrorId} role="alert">
                                {LITRES_ERROR}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderClear = () => {
        if (!isSet) {
            return;
        }

        return (
            <Button className={styles.clear} onClick={handleClear} variant={ButtonVariant.Unstyled}>{POT_CLEAR_LABEL}</Button>
        );
    };

    return (
        <div className={classes} {...props}>
            <span className={styles.label} id={labelId}>{POT_SIZE_LABEL}</span>
            {renderShapes()}
            {shape === ContainerShape.Round ? renderRound() : renderLitres()}
            {renderClear()}
        </div>
    );
};

export default PotSizePicker;
