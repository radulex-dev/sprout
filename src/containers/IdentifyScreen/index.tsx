'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// Constants
import { IDENTIFY_COPY } from './constants';
import { ERROR_UNREADABLE_IMAGE } from '@/helpers/image/constants';
import { ToastVariant } from '@/design-system/Toast/constants';

// Components
import AddPlantForm from '@/components/AddPlantForm';
import CaptureStage from '@/components/CaptureStage';
import ResultsStage from '@/components/ResultsStage';

// Helpers
import { compressPhoto } from '@/helpers/image';

// Hooks
import { useObjectUrl } from '@/hooks';
import { useToast } from '@/design-system/hooks/useToast';

// Services
import { identifyPlant } from '@/services/identify';
import type { IdentifyResult } from '@/services/identify/types';

// Database
import { createPlant } from '@/lib/db/actions';

// Styles
import styles from './styles.module.css';

// Types
import type { PlantInput } from '@/types';
import type { Phase } from './types';

export interface Props extends React.ComponentProps<'div'> {
    emailVerified: boolean;
}

const IdentifyScreen: React.FunctionComponent<Props> = ({ emailVerified, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const router = useRouter();
    const showToast = useToast();

    const [phase, setPhase] = useState<Phase>('capture');
    const [photo, setPhoto] = useState<Blob | undefined>(undefined);
    const [results, setResults] = useState<IdentifyResult[]>([]);
    const [picked, setPicked] = useState<IdentifyResult | undefined>(undefined);

    const photoUrl = useObjectUrl(photo);

    const handlePhoto = useCallback(async (nextPhoto: Blob) => {
        try {
            setPhoto(await compressPhoto(nextPhoto));
        } catch (reason) {
            console.error('Failed to process photo', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: ERROR_UNREADABLE_IMAGE
            });
        }
    }, [showToast]);

    const handleIdentifyError = useCallback((message: string) => {
        if (!message) {
            return;
        }

        showToast({
            timeout: 5000,
            variant: ToastVariant.Error,
            title: message
        });
    }, [showToast]);

    const handleIdentify = useCallback(async () => {
        if (!photo) {
            return;
        }
        setPhase('identifying');
        try {
            const result = await identifyPlant(photo);

            setResults(result);
            setPicked(result.at(0));
            setPhase('results');
        } catch (reason) {
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: reason instanceof Error ? reason.message : 'Identification failed.'
            });
            setPhase('capture');
        }
    }, [photo, showToast]);

    const handleReset = useCallback(() => {
        setPhoto(undefined);
        setResults([]);
        setPicked(undefined);
        setPhase('capture');
    }, []);

    const handlePick = useCallback((result: IdentifyResult) => {
        setPicked(result);
    }, []);

    const handleContinue = useCallback(() => {
        setPhase('form');
    }, []);

    const handleBackToResults = useCallback(() => {
        setPhase('results');
    }, []);

    const handleSave = useCallback(async (input: PlantInput) => {
        try {
            const id = await createPlant(input);

            showToast({
                timeout: 5000,
                variant: ToastVariant.Success,
                title: 'Plant added.'
            });

            router.push(`/plants/${id}`);
            router.refresh();
        } catch (reason) {
            console.error('Failed to add plant', reason);
            showToast({
                timeout: 5000,
                variant: ToastVariant.Error,
                title: 'Couldn\'t add your plant. Please try again.'
            });
        }
    }, [router, showToast]);

    const renderCaptureStage = () => {
        if (phase !== 'capture' && phase !== 'identifying') {
            return;
        }

        return (
            <div className={styles.captureColumn}>
                <CaptureStage photoUrl={photoUrl} isIdentifying={phase === 'identifying'} onPhoto={handlePhoto} onError={handleIdentifyError} onReset={handleReset} onIdentify={handleIdentify} />
            </div>
        );
    };

    const renderResultsStage = () => {
        if (phase !== 'results') {
            return;
        }

        return (
            <ResultsStage results={results} picked={picked} onPick={handlePick} onReset={handleReset} onContinue={handleContinue} />
        );
    };

    const renderFormStage = () => {
        if (phase !== 'form' || !picked || !photo) {
            return;
        }

        return (
            <AddPlantForm photo={photo} result={picked} onCancel={handleBackToResults} onSave={handleSave} />
        );
    };

    const renderVerifyNotice = () => {
        const noticeClasses = classNames(styles.notice, styles.noticeWarn);

        return (
            <div className={noticeClasses}>
                <p className={styles.noticeTitle}>
                    {IDENTIFY_COPY.noticeTitle}
                </p>
                <p className={styles.noticeBody}>
                    {IDENTIFY_COPY.noticeBody}
                </p>
                <Link href="/settings" className={styles.noticeLink}>
                    {IDENTIFY_COPY.noticeLink}
                </Link>
            </div>
        );
    };

    const renderContent = () => {
        return (
            <React.Fragment>
                {emailVerified ? renderCaptureStage() : renderVerifyNotice()}
                {renderResultsStage()}
                {renderFormStage()}
            </React.Fragment>
        );
    };

    return (
        <div className={classes} {...props}>
            <header className={styles.appHeader}>
                <div>
                    <h1>
                        Identify
                    </h1>
                    <div className={styles.sub}>
                        Snap a leaf or flower up close
                    </div>
                </div>
            </header>

            {renderContent()}
        </div>
    );
};

export default IdentifyScreen;
