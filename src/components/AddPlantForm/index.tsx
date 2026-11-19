'use client';

import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';

// Constants
import { CARE_HINT, NICKNAME_LABEL, NICKNAME_PLACEHOLDER, PROFILE_CAPPED, PROFILE_LOADING, PROFILE_UNAVAILABLE } from './constants';
import { FREQUENCY_TITLE } from '@/components/CareScheduleFields/constants';
import { LAST_CARE_HINT, LAST_CARE_TITLE } from '@/components/LastCareFields/constants';
import { NoticeTone } from '@/components/Notice/constants';
import { POT_SIZE_HINT } from '@/components/PotSizePicker/constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import CareScheduleFields from '@/components/CareScheduleFields';
import Field from '@/design-system/Field';
import LastCareFields from '@/components/LastCareFields';
import Notice from '@/components/Notice';
import PotSizePicker from '@/components/PotSizePicker';

// Helpers
import { resolveLastCare } from '@/helpers/care';
import { hasContainerSize, resolveSoilVolumeMl } from '@/helpers/pot';

// Hooks
import { useObjectUrl } from '@/hooks';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Database
import { loadCareIntervals, loadWaterAmount } from '@/lib/db/actions';

// Styles
import styles from './styles.module.css';

// Types
import type { ContainerSize } from '@/helpers/pot/types';
import { CareProfileStatus } from '@/lib/db/actions/types';
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

    const [nickname, setNickname] = useState(result.commonName || result.species);
    const [status, setStatus] = useState<CareProfileStatus>(CareProfileStatus.Loading);
    const [amountStatus, setAmountStatus] = useState<CareProfileStatus | undefined>();
    const [care, setCare] = useState<CareSchedule | undefined>();
    const [lastCareDates, setLastCareDates] = useState<LastCareDates>({});
    const [size, setSize] = useState<ContainerSize | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const photoUrl = useObjectUrl(photo);
    const isReady = status === CareProfileStatus.Ok;

    useEffect(() => {
        (async () => {
            try {
                const loaded = await loadCareIntervals({
                    species: result.species
                });

                setStatus(loaded.status);

                if (loaded.status === CareProfileStatus.Ok) {
                    setCare(loaded.care);
                }
            } catch (reason) {
                console.warn('Failed to load the care intervals', reason);
                setStatus(CareProfileStatus.Unavailable);
            }
        })();
    }, [result.species]);

    const handleNicknameChange = useCallback((nextNickname: string) => {
        setNickname(nextNickname);
    }, []);

    const handleLastCareChange = useCallback((dates: LastCareDates) => {
        setLastCareDates(dates);
    }, []);

    const handleSizeChange = useCallback((nextSize?: ContainerSize) => {
        setSize(nextSize);
    }, []);

    const handleCareChange = useCallback((nextCare: CareSchedule) => {
        setCare(nextCare);
    }, []);

    const handleSave = useCallback(async () => {
        if (!isReady || !care) {
            return;
        }

        setIsSubmitting(true);
        setAmountStatus(undefined);

        try {
            const waterAmountRequestBody = {
                species: result.species,
                soilVolumeMl: resolveSoilVolumeMl(size)
            };

            const loaded = hasContainerSize(size) ? await loadWaterAmount(waterAmountRequestBody) : undefined;

            if (loaded !== undefined) {
                setAmountStatus(loaded.status);

                if (loaded.status !== CareProfileStatus.Ok) {
                    return;
                }
            }

            onSave({
                nickname: nickname.trim() || result.commonName || result.species,
                species: result.species,
                commonName: result.commonName,
                photo,
                care: {
                    ...care,
                    waterAmountMl: loaded?.waterAmountMl
                },
                ...size,
                acquiredAt: Date.now(),
                lastCare: resolveLastCare(lastCareDates)
            });
        } catch (reason) {
            console.warn('Failed to load the water amount', reason);
            setAmountStatus(CareProfileStatus.Unavailable);
        } finally {
            setIsSubmitting(false);
        }
    }, [isReady, care, nickname, result, photo, size, lastCareDates, onSave]);

    const renderNotice = () => {
        if (status === CareProfileStatus.Unavailable || amountStatus === CareProfileStatus.Unavailable) {
            return (
                <Notice tone={NoticeTone.Warn}>
                    {PROFILE_UNAVAILABLE}
                </Notice>
            );
        }

        if (status === CareProfileStatus.Capped || amountStatus === CareProfileStatus.Capped) {
            return (
                <Notice tone={NoticeTone.Warn}>
                    {PROFILE_CAPPED}
                </Notice>
            );
        }

        if (care === undefined) {
            return (
                <Notice>
                    {PROFILE_LOADING}
                </Notice>
            );
        }

        return;
    };

    const renderSchedule = () => {
        return (
            <React.Fragment>
                {renderNotice()}
                {care !== undefined && (
                    <React.Fragment>
                        <h2 className={styles.sectionTitle}>
                            {FREQUENCY_TITLE}
                        </h2>
                        <CareScheduleFields value={care} onChange={handleCareChange} hint={CARE_HINT} />
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    };

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
                <Field className={styles.field} label={NICKNAME_LABEL} value={nickname} onValueChange={handleNicknameChange} placeholder={NICKNAME_PLACEHOLDER} />

                <PotSizePicker className={styles.potField} value={size} onChange={handleSizeChange} hint={POT_SIZE_HINT} />

                <h2 className={styles.sectionTitle}>
                    {LAST_CARE_TITLE}
                </h2>
                <LastCareFields value={lastCareDates} onChange={handleLastCareChange} hint={LAST_CARE_HINT} />

                {renderSchedule()}

                <div className={styles.shutterRow}>
                    <Button variant={ButtonVariant.Secondary} grow onClick={onCancel}>
                        Back
                    </Button>
                    <Button grow onClick={handleSave} icon={Sprout} disabled={!isReady || isSubmitting}>
                        Add to my plants
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddPlantForm;
