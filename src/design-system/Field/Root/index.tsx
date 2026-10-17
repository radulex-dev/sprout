'use client';

import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

export interface Props extends React.ComponentPropsWithoutRef<typeof BaseField.Root> {}

const FieldRoot: React.FunctionComponent<Props> = ({ validationMode = 'onChange', ...props }) => {
    return (
        <BaseField.Root validationMode={validationMode} {...props} />
    );
};

export default FieldRoot;
