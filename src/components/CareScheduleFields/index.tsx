'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Flower2, Leaf } from 'lucide-react';

// Constants
import { FERTILIZE_OPTIONS, REPOT_OPTIONS, SEASON_META, WATER_OPTIONS } from './constants';

// Components
import ScheduleField from './ScheduleField';

// Styles
import styles from './styles.module.css';

// Types
import { CareSeason, type CareSchedule } from '../../types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange'> {
    value: CareSchedule;
    onChange: (care: CareSchedule) => void;
    hint?: string;
}

const CareScheduleFields: React.FunctionComponent<Props> = ({ value, onChange, hint, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const handleSpringWaterChange = useCallback((newValue?: number) => {
        if (newValue === undefined) {
            return;
        }

        onChange({
            ...value,
            waterEveryDaysSpring: newValue
        });
    }, [value, onChange]);

    const handleSummerWaterChange = useCallback((newValue?: number) => {
        if (newValue === undefined) {
            return;
        }

        onChange({
            ...value,
            waterEveryDaysSummer: newValue
        });
    }, [value, onChange]);

    const handleAutumnWaterChange = useCallback((newValue?: number) => {
        if (newValue === undefined) {
            return;
        }

        onChange({
            ...value,
            waterEveryDaysAutumn: newValue
        });
    }, [value, onChange]);

    const handleWinterWaterChange = useCallback((newValue?: number) => {
        if (newValue === undefined) {
            return;
        }

        onChange({
            ...value,
            waterEveryDaysWinter: newValue
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

    const renderWaterFields = () => {
        return (
            <React.Fragment>
                <ScheduleField label={SEASON_META[CareSeason.Spring].label} icon={SEASON_META[CareSeason.Spring].icon} value={value.waterEveryDaysSpring} options={WATER_OPTIONS} unit="days" onChange={handleSpringWaterChange} />
                <ScheduleField label={SEASON_META[CareSeason.Summer].label} icon={SEASON_META[CareSeason.Summer].icon} value={value.waterEveryDaysSummer} options={WATER_OPTIONS} unit="days" onChange={handleSummerWaterChange} />
                <ScheduleField label={SEASON_META[CareSeason.Autumn].label} icon={SEASON_META[CareSeason.Autumn].icon} value={value.waterEveryDaysAutumn} options={WATER_OPTIONS} unit="days" onChange={handleAutumnWaterChange} />
                <ScheduleField label={SEASON_META[CareSeason.Winter].label} icon={SEASON_META[CareSeason.Winter].icon} value={value.waterEveryDaysWinter} options={WATER_OPTIONS} unit="days" onChange={handleWinterWaterChange} />
            </React.Fragment>
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
                    {renderWaterFields()}
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
