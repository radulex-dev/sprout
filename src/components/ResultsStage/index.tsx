'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

// Constants
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';
import IdentifyResultCard from './IdentifyResultCard';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Styles
import styles from './styles.module.css';

export interface Props {
    results: IdentifyResult[];
    picked: IdentifyResult | undefined;
    onPick: (result: IdentifyResult) => void;
    onReset: () => void;
    onContinue: () => void;
}

const ResultsStage: React.FunctionComponent<Props> = ({ results, picked, onPick, onReset, onContinue }) => {
    return (
        <React.Fragment>
            <h2 className={styles.sectionTitle}>Best matches</h2>
            <ul className={styles.resultsList}>
                {results.map((result, index) => {
                    return (
                        <li key={`${result.commonName}-${index}`}>
                            <IdentifyResultCard result={result} selected={picked?.species === result.species} onSelect={onPick} />
                        </li>
                    );
                })}
            </ul>
            <div className={styles.shutterRow}>
                <Button variant={ButtonVariant.Secondary} grow onClick={onReset}>
                    Retake
                </Button>
                <Button grow onClick={onContinue} disabled={!picked}>
                    Continue
                    <ArrowRight size="1rem" aria-hidden />
                </Button>
            </div>
        </React.Fragment>
    );
};

export default ResultsStage;
