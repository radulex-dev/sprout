'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Droplets, Flower2, Leaf } from 'lucide-react';

// Constants
import { FERTILIZE_OPTIONS, REPOT_OPTIONS, WATER_OPTIONS } from './constants';

// Components
import ScheduleField from './ScheduleField';

// Styles
import styles from './styles.module.css';

// Types
import type { CareSchedule } from '../../types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange'> {
    value: CareSchedule;
    onChange: (care: CareSchedule) => void;
    hint?: string;
}

const CareScheduleFields: React.FunctionComponent<Props> = ({ value, onChange, hint, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const handleWaterChange = useCallback((newValue?: number) => {
        if (newValue === undefined) {
            return;
        }

        onChange({
            ...value,
            waterEveryDays: newValue
        });
    }, [value, onChange]);

    const handleFertilizeChange = useCallback((newValue?: number) => {
        onChange({
            ...value,
            fertilizeEveryDays: newValue
        });
    }, [value, onChange]);

    const handleRepotChange = useCallback((newValue?: number) => {
        onChange({
            ...value,
            repotEveryMonths: newValue
        });
    }, [value, onChange]);

    const renderWaterField = () => {
        return (
            <ScheduleField label="Water" icon={Droplets} value={value.waterEveryDays} options={WATER_OPTIONS} unit="days" onChange={handleWaterChange} />
        );
    };

    const renderFertilizeField = () => {
        return (
            <ScheduleField label="Fertilise" icon={Leaf} value={value.fertilizeEveryDays} options={FERTILIZE_OPTIONS} unit="days" allowNever onChange={handleFertilizeChange} />
        );
    };

    const renderRepotField = () => {
        return (
            <ScheduleField label="Repot" icon={Flower2} value={value.repotEveryMonths} options={REPOT_OPTIONS} unit="months" allowNever onChange={handleRepotChange} />
        );
    };

    const renderHint = () => {
        if (!hint) {
            return;
        }

        return (
            <div className={styles.hint}>
                {hint}
            </div>
        );
    };

    const renderContent = () => {
        return (
            <React.Fragment>
                <div className={styles.fieldRow}>
                    {renderWaterField()}
                    {renderFertilizeField()}
                    {renderRepotField()}
                </div>
                {renderHint()}
            </React.Fragment>
        );
    };

    return (
        <div className={classes} {...props}>
            {renderContent()}
        </div>
    );
};

export default CareScheduleFields;
