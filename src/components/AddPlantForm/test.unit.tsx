import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Constants
import { CARE_HINT, PROFILE_CAPPED, PROFILE_LOADING, PROFILE_UNAVAILABLE, STANDARD_POT_WARNING } from './constants';

// Components
import AddPlantForm from './index';

// Database
import { loadCareIntervals, loadWaterAmount } from '@/lib/db/actions';

// Types
import { CareProfileStatus, type LoadWaterAmountResult } from '@/lib/db/actions/types';

vi.mock('@/lib/db/actions');

const props: React.ComponentProps<typeof AddPlantForm> = {
    onCancel: vi.fn(),
    onSave: vi.fn(),
    photo: new Blob(),
    result: {
        commonName: 'Swiss Cheese Plant',
        confidence: 0.92,
        species: 'Monstera deliciosa'
    }
};

describe('<AddPlantForm />', () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn(() => {
            return 'blob:preview';
        });
        URL.revokeObjectURL = vi.fn();
        vi.mocked(loadCareIntervals).mockReset();
        vi.mocked(loadCareIntervals).mockResolvedValue({
            status: CareProfileStatus.Ok,
            care: {
                waterEveryDaysSpring: 5,
                waterEveryDaysSummer: 5,
                waterEveryDaysAutumn: 5,
                waterEveryDaysWinter: 5,
                waterAmountMl: 0,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            }
        });
        vi.mocked(loadWaterAmount).mockReset();
        vi.mocked(loadWaterAmount).mockResolvedValue({
            status: CareProfileStatus.Ok,
            waterAmountMl: 80
        });
    });

    it('asks for the intervals exactly once on mount', async () => {
        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');

        expect(loadCareIntervals).toHaveBeenCalledTimes(1);
        expect(loadCareIntervals).toHaveBeenCalledWith({
            species: 'Monstera deliciosa'
        });
        expect(loadWaterAmount).not.toHaveBeenCalled();
    });

    it('shows the estimating row instead of the frequency fields while loading', () => {
        vi.mocked(loadCareIntervals).mockReturnValue(new Promise(vi.fn()));

        render(<AddPlantForm {...props} />);

        expect(screen.getByRole('status')).toHaveTextContent(PROFILE_LOADING);
        expect(screen.queryAllByRole('combobox')).toHaveLength(0);
        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeDisabled();
    });

    it('prefills the frequency fields from the loaded intervals', async () => {
        render(<AddPlantForm {...props} />);

        const fields = await screen.findAllByRole('combobox');

        expect(fields.map((field) => {
            return field.textContent;
        })).toEqual(['5 days', '5 days', '5 days', '5 days', '30 days', '18 months']);
        expect(screen.getByText(CARE_HINT)).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeEnabled();
    });

    it('renders the capped sentence and blocks the submit', async () => {
        vi.mocked(loadCareIntervals).mockResolvedValue({
            status: CareProfileStatus.Capped
        });

        render(<AddPlantForm {...props} />);

        expect(await screen.findByText(PROFILE_CAPPED)).toBeInTheDocument();
        expect(screen.queryAllByRole('combobox')).toHaveLength(0);
        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeDisabled();
    });

    it('renders the unavailable sentence and blocks the submit', async () => {
        vi.mocked(loadCareIntervals).mockResolvedValue({
            status: CareProfileStatus.Unavailable
        });

        render(<AddPlantForm {...props} />);

        expect(await screen.findByText(PROFILE_UNAVAILABLE)).toBeInTheDocument();
        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeDisabled();
    });

    it('does not save while the intervals are not ok', async () => {
        const user = userEvent.setup();

        vi.mocked(loadCareIntervals).mockResolvedValue({
            status: CareProfileStatus.Unavailable
        });

        render(<AddPlantForm {...props} />);

        await user.click(await screen.findByRole('button', {
            name: 'Add to my plants'
        }));

        expect(props.onSave).not.toHaveBeenCalled();
    });

    it('warns about the standard pot only while no size is set', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        expect(await screen.findByText(STANDARD_POT_WARNING)).toBeInTheDocument();

        await user.click(screen.getByRole('radio', {
            name: 'Select 12 cm pot'
        }));

        await waitFor(() => {
            expect(screen.queryByText(STANDARD_POT_WARNING)).not.toBeInTheDocument();
        });
    });

    it('shows the warning again after clearing the pot size', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        expect(await screen.findByText(STANDARD_POT_WARNING)).toBeInTheDocument();

        await user.click(screen.getByRole('radio', {
            name: 'Select 12 cm pot'
        }));

        await waitFor(() => {
            expect(screen.queryByText(STANDARD_POT_WARNING)).not.toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', {
            name: 'Clear pot size'
        }));

        expect(await screen.findByText(STANDARD_POT_WARNING)).toBeInTheDocument();
    });

    it('makes no request when the pot size changes', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('radio', {
            name: 'Select 14 cm pot'
        }));

        expect(screen.getByRole('radio', {
            name: 'Select 14 cm pot'
        })).toBeChecked();
        expect(loadCareIntervals).toHaveBeenCalledTimes(1);
        expect(loadWaterAmount).not.toHaveBeenCalled();
    });

    it('makes no request when litres are typed', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('radio', {
            name: 'Litres'
        }));

        const litresField = screen.getByRole('textbox', {
            name: 'Soil volume in litres'
        });

        await user.type(litresField, '120');

        expect(litresField).toHaveValue('120');
        expect(loadCareIntervals).toHaveBeenCalledTimes(1);
        expect(loadWaterAmount).not.toHaveBeenCalled();
    });

    it('asks for the amount once on submit and saves the returned amount', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        await waitFor(() => {
            expect(props.onSave).toHaveBeenCalledTimes(1);
        });
        expect(loadWaterAmount).toHaveBeenCalledTimes(1);
        expect(loadWaterAmount).toHaveBeenCalledWith({
            species: 'Monstera deliciosa',
            soilVolumeMl: undefined
        });
        expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
            care: {
                waterEveryDaysSpring: 5,
                waterEveryDaysSummer: 5,
                waterEveryDaysAutumn: 5,
                waterEveryDaysWinter: 5,
                waterAmountMl: 80,
                fertilizeEveryDays: 30,
                repotEveryMonths: 18
            },
            species: 'Monstera deliciosa'
        }));
    });

    it('asks for the amount with the selected size on submit', async () => {
        const user = userEvent.setup();

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('radio', {
            name: 'Select 14 cm pot'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        await waitFor(() => {
            expect(props.onSave).toHaveBeenCalledTimes(1);
        });
        expect(loadWaterAmount).toHaveBeenCalledWith({
            species: 'Monstera deliciosa',
            soilVolumeMl: 1200
        });
        expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
            potDiameter: 14,
            care: expect.objectContaining({
                waterAmountMl: 80
            })
        }));
    });

    it('does not save and shows the capped sentence when the amount is capped', async () => {
        const user = userEvent.setup();

        vi.mocked(loadWaterAmount).mockResolvedValue({
            status: CareProfileStatus.Capped
        });

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        expect(await screen.findByText(PROFILE_CAPPED)).toBeInTheDocument();
        expect(props.onSave).not.toHaveBeenCalled();
    });

    it('does not save and shows the unavailable sentence when the amount is unavailable', async () => {
        const user = userEvent.setup();

        vi.mocked(loadWaterAmount).mockResolvedValue({
            status: CareProfileStatus.Unavailable
        });

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        expect(await screen.findByText(PROFILE_UNAVAILABLE)).toBeInTheDocument();
        expect(props.onSave).not.toHaveBeenCalled();
    });

    it('disables the submit while the amount is in flight', async () => {
        const user = userEvent.setup();

        vi.mocked(loadWaterAmount).mockReturnValue(new Promise<LoadWaterAmountResult>(vi.fn()));

        render(<AddPlantForm {...props} />);

        await screen.findAllByRole('combobox');
        await user.click(screen.getByRole('button', {
            name: 'Add to my plants'
        }));

        expect(screen.getByRole('button', {
            name: 'Add to my plants'
        })).toBeDisabled();
    });
});
