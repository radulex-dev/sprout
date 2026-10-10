'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { getLocalTimeZone, parseDate } from '@internationalized/date';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Constants
import { HEADER_STYLE, SUB_STYLE } from './constants';
import { FREQUENCY_TITLE } from '@/components/CareScheduleFields/constants';
import { CARE_META } from '@/helpers/care/constants';
import { ToastVariant } from '@/design-system/Toast/constants';

// Components
import PlantPhoto from '@/components/PlantPhoto';
import EditSchedule from '@/components/EditSchedule';
import CareLogRow from '@/components/CareLogRow';
import DeletePlantBlock from './DeletePlantBlock';
import PlantCommonNameSuffix from './PlantCommonNameSuffix';
import CareStatValue from './CareStatValue';
import CareScheduleNotice from './CareScheduleNotice';

// Helpers
import { startOfToday } from '@/helpers/care';
import { displayName } from '@/helpers/plant';

// Hooks
import { useClock } from '@/hooks';
import { useToast } from '@/design-system/hooks/useToast';

// Database
import { deletePlant, markCareDone, updatePlant } from '@/lib/db/actions';

// Styles
import styles from './styles.module.css';

// Types
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

    const handleMarkDone = useCallback(async (kind: CareKind) => {
        try {
            await markCareDone(plant.id, kind, startOfToday());

            router.refresh();
        } catch (reason) {
            console.error('Failed to log care', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t log that care. Please try again.'
            });
        }
    }, [plant, router, showToast]);

    const handleSetDate = useCallback(async (kind: CareKind, date: string) => {
        try {
            await markCareDone(plant.id, kind, parseDate(date).toDate(getLocalTimeZone()).getTime());

            router.refresh();
        } catch (reason) {
            console.error('Failed to log care', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t log that care. Please try again.'
            });
        }
    }, [plant, router, showToast]);

    const handleSaveEdited = useCallback(async (edited: Plant) => {
        try {
            await updatePlant(edited.id, {
                nickname: edited.nickname,
                care: edited.care
            });

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Schedule saved.'
            });

            setIsEditing(false);
            router.refresh();
        } catch (reason) {
            console.error('Failed to save schedule', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t save the schedule. Please try again.'
            });
        }
    }, [router, showToast]);

    const handleRemove = useCallback(async () => {
        try {
            await deletePlant(plant.id);

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Plant deleted.'
            });

            router.push('/');
            router.refresh();
        } catch (reason) {
            console.error('Failed to delete plant', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t delete this plant. Please try again.'
            });
        }
    }, [plant, router, showToast]);

    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
    }, []);

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
        return isEditing ? <EditSchedule key={plant.id} plant={plant} onSave={handleSaveEdited} onCancel={handleCancelEdit} /> : <CareScheduleNotice plant={plant} onEdit={handleStartEdit} />;
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

                    <dl className={styles.careStats}>
                        {[CareKind.Water, CareKind.Fertilize, CareKind.Repot].map((kind) => {
                            const meta = CARE_META[kind];

                            return (
                                <div key={kind} className={styles.careStat}>
                                    <div className={styles.emoji}>
                                        <meta.icon size="1.375rem" aria-hidden />
                                    </div>
                                    <dt className={styles.label}>
                                        {meta.label}
                                    </dt>
                                    <dd>
                                        <CareStatValue plant={plant} kind={kind} now={now} />
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>

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

                    <DeletePlantBlock plantName={displayName(plant)} isConfirming={isConfirmDelete} onKeep={handleKeepPlant} onRemove={handleRemove} onStartDelete={handleStartDelete} />
                </div>
            </div>
        </div>
    );
};

export default PlantDetail;
