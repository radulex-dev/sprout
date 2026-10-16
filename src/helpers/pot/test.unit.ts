import { describe, expect, it } from 'vitest';

// Constants
import { ML_PER_LITRE, POT_SIZES, WATER_AMOUNT_RATIO } from './constants';

// Helpers
import { getWaterAmountMl } from './index';

// Types
import { PotDiameterUnit, PotVolumeUnit } from './types';

describe('waterAmountMl', () => {
    it.each([
        [9, 70],
        [10.5, 90],
        [12, 160],
        [13, 200],
        [14, 240],
        [15, 300],
        [17, 400],
        [19, 600],
        [21, 800],
        [24, 1000],
        [27, 1500],
        [30, 2000]
    ])('maps a %s cm pot to %s ml', (diameter, ml) => {
        expect(getWaterAmountMl(diameter)).toBe(ml);
    });

    it('derives no amount when the diameter is unset', () => {
        expect(getWaterAmountMl(undefined)).toBeUndefined();
    });

    it('derives no amount for an unrecognised diameter', () => {
        expect(getWaterAmountMl(11)).toBeUndefined();
    });
});

describe('POT_SIZES', () => {
    it.each(POT_SIZES)('rounds the amount for a $diameter cm pot to ten millilitres', ({ diameter, volume }) => {
        const amount = getWaterAmountMl(diameter);

        expect(amount).toBe(Math.round(volume * ML_PER_LITRE * WATER_AMOUNT_RATIO));
        expect(Number(amount) % 10).toBe(0);
    });

    it('lists twelve sizes in ascending order', () => {
        expect(POT_SIZES).toHaveLength(12);

        const diameters = POT_SIZES.map((size) => {
            return size.diameter;
        });

        expect(diameters).toEqual(diameters.toSorted((left, right) => {
            return left - right;
        }));
        expect(POT_SIZES.at(0)).toEqual({
            diameter: 9,
            diameterUnit: PotDiameterUnit.Centimetres,
            volume: 0.35,
            volumeUnit: PotVolumeUnit.Litres
        });
        expect(POT_SIZES.at(-1)).toEqual({
            diameter: 30,
            diameterUnit: PotDiameterUnit.Centimetres,
            volume: 10,
            volumeUnit: PotVolumeUnit.Litres
        });
    });

    it('measures every size in centimetres and litres', () => {
        const diameterUnits = POT_SIZES.map((size) => {
            return size.diameterUnit;
        });
        const volumeUnits = POT_SIZES.map((size) => {
            return size.volumeUnit;
        });

        expect(new Set(diameterUnits)).toEqual(new Set([PotDiameterUnit.Centimetres]));
        expect(new Set(volumeUnits)).toEqual(new Set([PotVolumeUnit.Litres]));
    });
});
