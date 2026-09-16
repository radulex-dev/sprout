'use client';

import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { capitalize } from 'lodash-es';

// Constants
import { CARE_META } from '@/helpers/care/constants';

// Components
import DatePicker from '@/design-system/DatePicker';

// Styles
import styles from './styles.module.css';

// Types
import { CareKind, type LastCareDates } from '@/types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange'> {
    value: LastCareDates;
    onChange: (dates: LastCareDates) => void;
    hint?: string;
}

const LastCareFields: React.FunctionComponent<Props> = ({ value, onChange, hint, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const maxDate = useMemo(() => {
        return today(getLocalTimeZone()).toString();
    }, []);

    const handleWaterChange = useCallback((date: string) => {
        onChange({
            ...value,
            [CareKind.Water]: date
        });
    }, [value, onChange]);

    const handleFertilizeChange = useCallback((date: string) => {
        onChange({
            ...value,
            [CareKind.Fertilize]: date
        });
    }, [value, onChange]);

    const handleRepotChange = useCallback((date: string) => {
        onChange({
            ...value,
            [CareKind.Repot]: date
        });
    }, [value, onChange]);

    const renderWaterField = () => {
        return (
            <DatePicker label={capitalize(CARE_META[CareKind.Water].verb)} value={value[CareKind.Water] ?? ''} max={maxDate} onChange={handleWaterChange} />
        );
    };

    const renderFertilizeField = () => {
        return (
            <DatePicker label={capitalize(CARE_META[CareKind.Fertilize].verb)} value={value[CareKind.Fertilize] ?? ''} max={maxDate} onChange={handleFertilizeChange} />
        );
    };

    const renderRepotField = () => {
        return (
            <DatePicker label={capitalize(CARE_META[CareKind.Repot].verb)} value={value[CareKind.Repot] ?? ''} max={maxDate} onChange={handleRepotChange} />
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

export default LastCareFields;
