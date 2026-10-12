'use client';

import React, { useCallback, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

// Constants
import { NEVER_OPTION_LABEL, NEVER_OPTION_VALUE } from '../constants';

// Components
import Select from '@/design-system/Select';

// Types
import type { SelectOption } from '@/design-system/Select/types';

export interface Props extends Omit<React.ComponentProps<'div'>, 'onChange' | 'id'> {
    label: string;
    icon: LucideIcon;
    value?: number;
    options: number[];
    unit: 'days' | 'months';
    allowNever?: boolean;
    onChange: (value?: number) => void;
    hint?: string;
}

const ScheduleField: React.FunctionComponent<Props> = ({ label, icon, value, options, unit, allowNever = false, onChange, hint, ...props }) => {
    const selectOptions = useMemo<SelectOption[]>(() => {
        const mapped = options.map((amount) => {
            return {
                value: String(amount),
                label: `${amount} ${unit}`
            };
        });

        if (allowNever) {
            return [{
                value: NEVER_OPTION_VALUE,
                label: NEVER_OPTION_LABEL
            }, ...mapped];
        }

        return mapped;
    }, [options, unit, allowNever]);

    const handleChange = useCallback((newValue: string) => {
        onChange(newValue === NEVER_OPTION_VALUE ? undefined : Number(newValue));
    }, [onChange]);

    return (
        <Select label={label} icon={icon} value={value === undefined ? NEVER_OPTION_VALUE : String(value)} options={selectOptions} onChange={handleChange} hint={hint} {...props} />
    );
};

export default ScheduleField;
