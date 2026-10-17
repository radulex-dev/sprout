'use client';

import classNames from 'classnames';
import React, { useCallback, useState } from 'react';

// Constants
import { FREQUENCY_TITLE } from '@/components/CareScheduleFields/constants';
import { POT_SIZE_HINT } from '@/components/PotSizePicker/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import CareScheduleFields from '@/components/CareScheduleFields';
import Field from '@/design-system/Field';
import PotSizePicker from '@/components/PotSizePicker';

// Styles
import styles from './styles.module.css';

// Types
import type { ContainerSize } from '@/helpers/pot/types';
import type { Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plant: Plant;
    onSave: (plant: Plant) => void;
    onCancel: () => void;
}

const EditSchedule: React.FunctionComponent<Props> = ({ plant, onSave, onCancel, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const [nickname, setNickname] = useState(plant.nickname);
    const [care, setCare] = useState(plant.care);
    const [size, setSize] = useState<ContainerSize | undefined>(() => {
        return {
            potDiameter: plant.potDiameter,
            soilVolumeLitres: plant.soilVolumeLitres
        };
    });

    const handleNicknameChange = useCallback((nextNickname: string) => {
        setNickname(nextNickname);
    }, []);

    const handleSave = useCallback(() => {
        onSave({
            ...plant,
            nickname: nickname.trim() || plant.nickname,
            care,
            potDiameter: size?.potDiameter,
            soilVolumeLitres: size?.soilVolumeLitres
        });
    }, [plant, onSave, nickname, care, size]);

    return (
        <div className={classes} {...props}>
            <Field className={styles.field} label="Nickname" value={nickname} onValueChange={handleNicknameChange} />
            <h2 className={styles.sectionTitle}>
                {FREQUENCY_TITLE}
            </h2>
            <CareScheduleFields value={care} onChange={setCare} />
            <PotSizePicker value={size} onChange={setSize} hint={POT_SIZE_HINT} />
            <div className={styles.shutterRow}>
                <Button variant={ButtonVariant.Secondary} grow onClick={onCancel}>
                    Cancel
                </Button>
                <Button grow onClick={handleSave}>
                    Save changes
                </Button>
            </div>
        </div>
    );
};

export default EditSchedule;
