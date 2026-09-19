import React from 'react';
import { Download } from 'lucide-react';

// Constants
import { GUIDE_LABEL, INSTALL_LABEL } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

export interface Props extends React.ComponentProps<'button'> {
    isPromptAvailable: boolean;
    onInstall: () => void;
}

const InstallButton: React.FunctionComponent<Props> = ({ isPromptAvailable, onInstall, ...props }) => {
    return (
        <Button variant={ButtonVariant.Accent} block icon={Download} {...props} onClick={onInstall}>
            {isPromptAvailable ? INSTALL_LABEL : GUIDE_LABEL}
        </Button>
    );
};

export default InstallButton;
