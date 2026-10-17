'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';

// Components
import FieldControl from './Control';
import FieldDescription from './Description';
import FieldError from './Error';
import FieldItem from './Item';
import FieldLabel from './Label';
import FieldRoot from './Root';
import FieldValidity from './Validity';

// Styles
import styles from './styles.module.css';

// Types
import type { FieldValidate, FieldValidationMode } from './types';

export interface Props extends Omit<React.ComponentPropsWithoutRef<typeof FieldControl>, 'value' | 'defaultValue' | 'onChange' | 'onValueChange'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    hint?: string;
    error?: string;
    invalid?: boolean;
    validate?: FieldValidate;
    validationMode?: FieldValidationMode;
    validationDebounceTime?: number;
}

const FieldComponent: React.FunctionComponent<Props> = ({ label, value, onValueChange, hint, error, invalid, disabled, validate, validationMode, validationDebounceTime, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const handleValueChange = useCallback((nextValue: string) => {
        onValueChange(nextValue);
    }, [onValueChange]);

    return (
        <FieldRoot className={classes} disabled={disabled} invalid={invalid ?? Boolean(error)} validate={validate} validationMode={validationMode} validationDebounceTime={validationDebounceTime}>
            <FieldLabel>
                {label}
            </FieldLabel>
            <FieldControl value={value} onValueChange={handleValueChange} {...props} />
            {error ? (
                <FieldError match={true}>
                    {error}
                </FieldError>
            ) : (
                <FieldError />
            )}
            {hint && (
                <FieldDescription>
                    {hint}
                </FieldDescription>
            )}
        </FieldRoot>
    );
};

const Field = Object.assign(FieldComponent, {
    Root: FieldRoot,
    Label: FieldLabel,
    Control: FieldControl,
    Description: FieldDescription,
    Item: FieldItem,
    Error: FieldError,
    Validity: FieldValidity
});

export default Field;
