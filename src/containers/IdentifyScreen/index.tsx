'use client';

import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// Constants
import { ERROR_UNREADABLE_IMAGE } from '@/helpers/image/constants';

// Components
import AddPlantForm from '@/components/AddPlantForm';
import CaptureStage from '@/components/CaptureStage';
import ResultsStage from '@/components/ResultsStage';

// Helpers
import { compressPhoto } from '@/helpers/image';

// Hooks
import { useObjectUrl } from '@/hooks';

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

export interface Props extends React.ComponentProps<'div'> {}

const IdentifyScreen: React.FunctionComponent<Props> = ({ className, ...props }) => {
    const classes = classNames(styles.root, className);
    const errorNoticeClasses = classNames(styles.notice, styles.error);
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>('capture');
    const [photo, setPhoto] = useState<Blob | undefined>(undefined);
    const [results, setResults] = useState<IdentifyResult[]>([]);
    const [picked, setPicked] = useState<IdentifyResult | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    const photoUrl = useObjectUrl(photo);

    const handlePhoto = useCallback(async (nextPhoto: Blob) => {
        setError(undefined);

        try {
            setPhoto(await compressPhoto(nextPhoto));
        } catch (reason) {
            console.error('Failed to process photo', reason);
            setError(ERROR_UNREADABLE_IMAGE);
        }
    }, []);

    const handleIdentifyError = useCallback((message: string) => {
        setError(message);
    }, []);

    const handleIdentify = useCallback(async () => {
        if (!photo) {
            return;
        }
        setPhase('identifying');
        setError(undefined);
        try {
            const result = await identifyPlant(photo);
            setResults(result);
            setPicked(result.at(0));
            setPhase('results');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Identification failed.');
            setPhase('capture');
        }
    }, [photo]);

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
        setError(undefined);

        try {
            const id = await createPlant(input);

            router.push(`/plants/${id}`);
            router.refresh();
        } catch (reason) {
            console.error('Failed to add plant', reason);
            setError('Couldn\'t add your plant. Please try again.');
        }
    }, [router]);

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

    const renderContent = () => {
        return (
            <React.Fragment>
                {renderCaptureStage()}
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

            {error && (
                <div className={errorNoticeClasses} role="status">
                    {error}
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default IdentifyScreen;
