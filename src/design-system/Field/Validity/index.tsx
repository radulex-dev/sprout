'use client';

import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

export interface Props extends React.ComponentPropsWithoutRef<typeof BaseField.Validity> {}

const FieldValidity: React.FunctionComponent<Props> = ({ children }) => {
    return (
        <BaseField.Validity>
            {children}
        </BaseField.Validity>
    );
};

export default FieldValidity;
