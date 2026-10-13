import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import IdentifyResultCard from './index';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Types
import { CareSource } from '@/types';

const CALLER_CLASS_NAME = 'caller-class-name';

const props: React.ComponentProps<typeof IdentifyResultCard> = {
    result: {
        careSource: CareSource.Genus,
        commonName: 'Swiss Cheese Plant',
        confidence: 0.92,
        defaultCare: {
            fertilizeEveryDays: 30,
            repotEveryMonths: 18,
            waterEveryDays: 5
        },
        species: 'Monstera deliciosa'
    },
    selected: false,
    onSelect: vi.fn()
};

describe('<IdentifyResultCard />', () => {
    it('shows the common name, the species and the rounded confidence', () => {
        render(<IdentifyResultCard {...props} />);

        expect(screen.getByText('Swiss Cheese Plant')).toBeInTheDocument();
        expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('falls back to the species when the result has no common name', () => {
        const result: IdentifyResult = {
            careSource: CareSource.Genus,
            commonName: '',
            confidence: 0.92,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 5
            },
            species: 'Monstera deliciosa'
        };

        render(<IdentifyResultCard {...props} result={result} />);

        expect(screen.getAllByText('Monstera deliciosa')).toHaveLength(2);
    });

    it.each([{
        confidence: 0,
        expected: '0%'
    }, {
        confidence: 0.333,
        expected: '33%'
    }, {
        confidence: 0.999,
        expected: '100%'
    }, {
        confidence: 1,
        expected: '100%'
    }])('renders $expected for a confidence of $confidence', ({ confidence, expected }) => {
        const result: IdentifyResult = {
            careSource: CareSource.Genus,
            commonName: 'Swiss Cheese Plant',
            confidence,
            defaultCare: {
                fertilizeEveryDays: 30,
                repotEveryMonths: 18,
                waterEveryDays: 5
            },
            species: 'Monstera deliciosa'
        };

        render(<IdentifyResultCard {...props} result={result} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('renders the selected state with the same content', () => {
        render(<IdentifyResultCard {...props} selected />);

        expect(screen.getByText('Swiss Cheese Plant')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('keeps the caller class on the card button', () => {
        render(<IdentifyResultCard {...props} className={CALLER_CLASS_NAME} />);

        expect(screen.getByRole('button')).toHaveClass(CALLER_CLASS_NAME);
    });
});
