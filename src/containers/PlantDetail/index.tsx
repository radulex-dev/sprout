'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalTimeZone, parseDate } from '@internationalized/date';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Constants
import { AMOUNT_STALE_NOTICE, HEADER_STYLE, SUB_STYLE } from './constants';
import { FREQUENCY_TITLE } from '@/components/CareScheduleFields/constants';
import { ToastVariant } from '@/design-system/Toast/constants';
import { NoticeTone } from '@/components/Notice/constants';

// Components
import PlantPhoto from '@/components/PlantPhoto';
import EditSchedule from '@/components/EditSchedule';
import CareLogRow from '@/components/CareLogRow';
import Notice from '@/components/Notice';
import DeletePlantBlock from './DeletePlantBlock';
import PlantCommonNameSuffix from './PlantCommonNameSuffix';
import CareStats from './CareStats';
import CareScheduleNotice from './CareScheduleNotice';

// Helpers
import { startOfToday } from '@/helpers/care';
import { displayName } from '@/helpers/plant';
import { resolveSoilVolumeMl } from '@/helpers/pot';

// Hooks
import { useClock } from '@/hooks';
import { useToast } from '@/design-system/hooks/useToast';

// Database
import { deletePlant, markCareDone, recalculateCareAmount, updatePlant } from '@/lib/db/actions';

// Styles
import styles from './styles.module.css';

// Types
import { CareProfileStatus } from '@/lib/db/actions/types';
import { CareKind, type Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plant: Plant;
}

const PlantDetail: React.FunctionComponent<Props> = ({ plant, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const router = useRouter();
    const now = useClock();
    const showToast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [isAmountStale, setIsAmountStale] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);

    const handleMarkDone = useCallback(async (kind: CareKind) => {
        try {
            await markCareDone(plant.id, kind, startOfToday());
        } catch (reason) {
            console.error('Failed to log care', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t log that care. Please try again.'
            });
        }
    }, [plant, showToast]);

    const handleSetDate = useCallback(async (kind: CareKind, date: string) => {
        try {
            await markCareDone(plant.id, kind, parseDate(date).toDate(getLocalTimeZone()).getTime());
        } catch (reason) {
            console.error('Failed to log care', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t log that care. Please try again.'
            });
        }
    }, [plant, showToast]);

    const handleSaveEdited = useCallback(async (edited: Plant) => {
        const hasSizeChanged = edited.potDiameter !== plant.potDiameter || edited.soilVolumeLitres !== plant.soilVolumeLitres;
        const nextVolume = resolveSoilVolumeMl({
            potDiameter: edited.potDiameter,
            soilVolumeLitres: edited.soilVolumeLitres
        });
        const defaultCare = {
            ...edited.care,
            waterAmountMl: undefined
        };
        const care = hasSizeChanged && nextVolume === undefined ? defaultCare : edited.care;

        try {
            await updatePlant(edited.id, {
                nickname: edited.nickname,
                care,
                potDiameter: edited.potDiameter,
                soilVolumeLitres: edited.soilVolumeLitres
            });

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Schedule saved.'
            });

            setIsEditing(false);

            if (nextVolume !== undefined && hasSizeChanged) {
                try {
                    const result = await recalculateCareAmount(edited.id, nextVolume);

                    setIsAmountStale(result.status !== CareProfileStatus.Ok);
                } catch (reason) {
                    console.error('Failed to recalculate the watering amount', reason);
                    setIsAmountStale(true);
                }
            }
        } catch (reason) {
            console.error('Failed to save schedule', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t save the schedule. Please try again.'
            });
        }
    }, [plant, showToast]);

    const handleRemove = useCallback(async () => {
        try {
            await deletePlant(plant.id);

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Plant deleted.'
            });

            router.push('/');
        } catch (reason) {
            console.error('Failed to delete plant', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t delete this plant. Please try again.'
            });
        }
    }, [plant, router, showToast]);

    const scrollToForm = useCallback(() => {
        formRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, []);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        scrollToForm();
    }, [isEditing, scrollToForm]);

    const handleStartEdit = useCallback(() => {
        if (isEditing) {
            scrollToForm();

            return;
        }

        setIsEditing(true);
    }, [isEditing, scrollToForm]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
    }, []);

    const handleStartDelete = useCallback(() => {
        setIsConfirmDelete(true);
    }, []);

    const handleKeepPlant = useCallback(() => {
        setIsConfirmDelete(false);
    }, []);

    const renderSchedule = () => {
        return isEditing ? <EditSchedule key={plant.id} ref={formRef} plant={plant} onSave={handleSaveEdited} onCancel={handleCancelEdit} /> : <CareScheduleNotice plant={plant} onEdit={handleStartEdit} />;
    };

    return (
        <div className={classes} {...props}>
            <Link href="/" className={styles.backBtn}>
                <ArrowLeft size="1rem" aria-hidden />
                My Plants
            </Link>

            <div className={styles.layout}>
                <PlantPhoto photo={plant.photo} alt={displayName(plant)} className={styles.detailHero} />
                <div>
                    <header className={styles.appHeader} style={HEADER_STYLE}>
                        <div>
                            <h1>
                                {displayName(plant)}
                            </h1>
                            <div className={styles.sub} style={SUB_STYLE}>
                                <span>
                                    {plant.species}
                                </span>
                                {plant.commonName && plant.commonName !== plant.nickname && (
                                    <PlantCommonNameSuffix plant={plant} />
                                )}
                            </div>
                        </div>
                    </header>

                    <CareStats plant={plant} now={now} onRequestPotSize={handleStartEdit} />

                    <h2 className={styles.sectionTitle}>
                        Log care
                    </h2>
                    <ul className={styles.taskList}>
                        {[CareKind.Water, CareKind.Fertilize, CareKind.Repot].map((kind) => {
                            return (
                                <li key={kind}>
                                    <CareLogRow plant={plant} label={kind} now={now} onDone={handleMarkDone} onSetDate={handleSetDate} />
                                </li>
                            );
                        })}
                    </ul>

                    {!isEditing && (
                        <h2 className={styles.sectionTitle}>
                            {FREQUENCY_TITLE}
                        </h2>
                    )}
                    {renderSchedule()}
                    {isAmountStale && (
                        <Notice className={styles.amountNotice} tone={NoticeTone.Warn}>
                            {AMOUNT_STALE_NOTICE}
                        </Notice>
                    )}

                    <DeletePlantBlock plantName={displayName(plant)} isConfirming={isConfirmDelete} onKeep={handleKeepPlant} onRemove={handleRemove} onStartDelete={handleStartDelete} />
                </div>
            </div>
        </div>
    );
};

export default PlantDetail;
