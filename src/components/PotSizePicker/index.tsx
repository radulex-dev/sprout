'use client';

import classNames from 'classnames';
import React, { useCallback, useId } from 'react';
import { Droplet } from 'lucide-react';

// Constants
import { POT_CLEAR_LABEL, POT_SIZE_LABEL } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';
import { POT_SIZES } from '@/helpers/pot/constants';

// Components
import Button from '@/design-system/Button';
import PotGlyph from './PotGlyph';

// Helpers
import { formatPotOptionName, formatWaterAmount } from './helpers';
import { waterAmountMl } from '@/helpers/pot';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange'> {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    hint?: string;
}

const PotSizePicker: React.FunctionComponent<Props> = ({ value, onChange, hint, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const labelId = useId();
    const hintId = useId();
    const radioGroupId = useId();
    const amount = waterAmountMl(value);
    const describedBy = hint ? hintId : undefined;

    const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(event.currentTarget.value));
    }, [onChange]);

    const handleClear = useCallback(() => {
        onChange(undefined);
    }, [onChange]);

    const renderHint = () => {
        if (!hint) {
            return;
        }

        return (
            <div className={styles.hint} id={hintId}>
                {hint}
            </div>
        );
    };

    const renderOptions = () => {
        return POT_SIZES.map((size) => {
            const isSelected = value === size.diameter;
            const optionClasses = classNames(styles.option, {
                [styles.optionSelected]: isSelected
            });

            return (
                <label className={optionClasses} key={size.diameter}>
                    <input aria-label={formatPotOptionName(size.diameter)} checked={isSelected} className={styles.optionInput} name={radioGroupId} onChange={handleOptionChange} type="radio" value={size.diameter} />
                    <PotGlyph diameter={size.diameter} selected={isSelected} />
                    <span className={styles.optionLabel}>{size.diameter}</span>
                </label>
            );
        });
    };

    const renderResult = () => {
        if (value === undefined || amount === undefined) {
            return;
        }

        return (
            <p aria-live="polite" className={styles.result}>
                <Droplet aria-hidden className={styles.resultIcon} size="0.875rem" />
                <span>{formatWaterAmount(value, amount)}</span>
            </p>
        );
    };

    const renderClear = () => {
        if (value === undefined) {
            return;
        }

        return (
            <Button className={styles.clear} onClick={handleClear} variant={ButtonVariant.Unstyled}>{POT_CLEAR_LABEL}</Button>
        );
    };

    return (
        <div className={classes} {...props}>
            <span className={styles.label} id={labelId}>{POT_SIZE_LABEL}</span>
            {renderHint()}
            <div aria-describedby={describedBy} aria-labelledby={labelId} className={styles.grid} role="radiogroup">
                {renderOptions()}
            </div>
            {renderResult()}
            {renderClear()}
        </div>
    );
};

export default PotSizePicker;
