import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { CARE_HINT_FAMILY, CARE_HINT_GENUS, CARE_HINT_NONE } from './constants';

// Components
import AddPlantForm from './index';

// Services
import type { IdentifyResult } from '@/services/identify/types';

// Types
import { CareSource, type CareSchedule } from '@/types';

const RESOLVED_CARE: CareSchedule = {
    fertilizeEveryDays: 30,
    repotEveryMonths: 18,
    waterEveryDays: 5
};

const makeResult = (careSource: CareSource): IdentifyResult => {
    return {
        careSource,
        commonName: 'Swiss Cheese Plant',
        confidence: 0.92,
        defaultCare: RESOLVED_CARE,
        species: 'Monstera deliciosa'
    };
};

const props: React.ComponentProps<typeof AddPlantForm> = {
    onCancel: vi.fn(),
    onSave: vi.fn(),
    photo: new Blob(),
    result: makeResult(CareSource.Genus)
};

describe('AddPlantForm', () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn(() => {
            return 'blob:preview';
        });
        URL.revokeObjectURL = vi.fn();
    });

    it('shows the plant-informed hint when care data came from the genus', () => {
        render(<AddPlantForm {...props} />);

        expect(screen.getByText(CARE_HINT_GENUS)).toBeInTheDocument();
    });

    it('shows the family hint when only the family matched', () => {
        render(<AddPlantForm {...props} result={makeResult(CareSource.Family)} />);

        expect(screen.getByText(CARE_HINT_FAMILY)).toBeInTheDocument();
    });

    it('tells the user to set the frequencies when we hold no data for the plant', () => {
        render(<AddPlantForm {...props} result={makeResult(CareSource.None)} />);

        expect(screen.getByText(CARE_HINT_NONE)).toBeInTheDocument();
    });

    it('no longer claims the defaults are based on the identified species', () => {
        render(<AddPlantForm {...props} />);

        expect(screen.queryByText(/based on the identified species/)).not.toBeInTheDocument();
    });

    it('prefills the care fields from the resolved schedule', () => {
        render(<AddPlantForm {...props} />);

        const values = screen.getAllByRole('combobox').map((field) => {
            return field.textContent;
        });

        expect(values).toEqual(['5 days', '30 days', '18 months']);
    });

    it('shows exactly one hint for the resolved source', () => {
        render(<AddPlantForm {...props} result={makeResult(CareSource.Family)} />);

        expect(screen.queryByText(CARE_HINT_GENUS)).not.toBeInTheDocument();
        expect(screen.queryByText(CARE_HINT_NONE)).not.toBeInTheDocument();
    });
});
