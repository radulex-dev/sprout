'use client';

import classNames from 'classnames';
import React, { useCallback, useId, useState } from 'react';
import { Sprout } from 'lucide-react';

// Constants
import { CARE_HINT_BY_SOURCE, NICKNAME_LABEL, NICKNAME_PLACEHOLDER } from './constants';
import { FREQUENCY_TITLE } from '@/components/CareScheduleFields/constants';
import { LAST_CARE_HINT, LAST_CARE_TITLE } from '@/components/LastCareFields/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import CareScheduleFields from '@/components/CareScheduleFields';
import LastCareFields from '@/components/LastCareFields';

// Helpers
import { resolveLastCare } from '@/helpers/care';

// Hooks
import { useObjectUrl } from '@/hooks';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Styles
import styles from './styles.module.css';

// Types
import type { CareSchedule, LastCareDates, PlantInput } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    photo: Blob;
    result: IdentifyResult;
    onCancel: () => void;
    onSave: (input: PlantInput) => void;
}

const AddPlantForm: React.FunctionComponent<Props> = ({ photo, result, onCancel, onSave, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const resultCardClasses = classNames(styles.resultCard, styles.selected);
    const careHint = CARE_HINT_BY_SOURCE[result.careSource];

    const [nickname, setNickname] = useState(result.commonName || result.species);
    const [care, setCare] = useState<CareSchedule>(() => {
        return result.defaultCare;
    });
    const [lastCareDates, setLastCareDates] = useState<LastCareDates>({});
    const photoUrl = useObjectUrl(photo);
    const nicknameId = useId();

    const handleNicknameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(event.target.value);
    }, []);

    const handleLastCareChange = useCallback((dates: LastCareDates) => {
        setLastCareDates(dates);
    }, []);

    const handleSave = useCallback(() => {
        onSave({
            nickname: nickname.trim() || result.commonName || result.species,
            species: result.species,
            commonName: result.commonName,
            photo,
            care,
            acquiredAt: Date.now(),
            lastCare: resolveLastCare(lastCareDates, Date.now())
        });
    }, [nickname, result, photo, care, lastCareDates, onSave]);

    return (
        <div className={classes} {...props}>
            <div className={styles.previewPane}>
                <div className={resultCardClasses}>
                    {photoUrl && <img src={photoUrl} alt="" className={styles.thumb} />}
                    <div>
                        <div className={styles.common}>
                            {result.commonName || result.species}
                        </div>
                        <div className={styles.sci}>
                            {result.species}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.formPane}>
                <div className={styles.field}>
                    <label htmlFor={nicknameId}>
                        {NICKNAME_LABEL}
                    </label>
                    <input id={nicknameId} value={nickname} onChange={handleNicknameChange} placeholder={NICKNAME_PLACEHOLDER} />
                </div>

                <h2 className={styles.sectionTitle}>
                    {LAST_CARE_TITLE}
                </h2>
                <LastCareFields value={lastCareDates} onChange={handleLastCareChange} hint={LAST_CARE_HINT} />

                <h2 className={styles.sectionTitle}>
                    {FREQUENCY_TITLE}
                </h2>
                <CareScheduleFields value={care} onChange={setCare} hint={careHint} />

                <div className={styles.shutterRow}>
                    <Button variant={ButtonVariant.Secondary} grow onClick={onCancel}>
                        Back
                    </Button>
                    <Button grow onClick={handleSave} icon={Sprout}>
                        Add to my plants
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddPlantForm;
