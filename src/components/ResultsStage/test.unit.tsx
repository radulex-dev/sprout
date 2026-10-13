import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import ResultsStage from './index';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Types
import { CareSource } from '@/types';

const props: React.ComponentProps<typeof ResultsStage> = {
    results: [{
        careSource: CareSource.Genus,
        commonName: 'Swiss Cheese Plant',
        confidence: 0.92,
        defaultCare: {
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            waterEveryDays: 5
        },
        species: 'Monstera deliciosa'
    }],
    picked: undefined,
    onPick: vi.fn(),
    onReset: vi.fn(),
    onContinue: vi.fn()
};

describe('<ResultsStage />', () => {
    it('renders a card per result with the rounded confidence', () => {
        const results: IdentifyResult[] = [{
            careSource: CareSource.Genus,
            commonName: 'Swiss Cheese Plant',
            confidence: 0.92,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 5
            },
            species: 'Monstera deliciosa'
        }, {
            careSource: CareSource.Family,
            commonName: 'Peace Lily',
            confidence: 0.71,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 5
            },
            species: 'Spathiphyllum wallisii'
        }];

        render(<ResultsStage {...props} results={results} />);

        expect(screen.getByRole('heading', {
            name: 'Best matches'
        })).toBeInTheDocument();
        expect(screen.getByText('Swiss Cheese Plant')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('Peace Lily')).toBeInTheDocument();
        expect(screen.getByText('71%')).toBeInTheDocument();
    });

    it('renders the stage chrome without cards when there are no results', () => {
        render(<ResultsStage {...props} results={[]} />);

        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        expect(screen.getByRole('button', {
            name: 'Retake'
        })).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: /Continue/
        })).toBeDisabled();
    });

    it('enables Continue once a result is picked', () => {
        render(<ResultsStage {...props} picked={props.results.at(0)} />);

        expect(screen.getByRole('button', {
            name: /Continue/
        })).toBeEnabled();
    });
});
