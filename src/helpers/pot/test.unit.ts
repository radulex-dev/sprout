import { describe, expect, it } from 'vitest';

// Constants
import { ML_PER_LITRE, POT_SIZES, WATER_AMOUNT_RATIO } from './constants';

// Helpers
import { formatWaterAmount, getWaterAmountMl } from './index';

// Types
import { PotDiameterUnit, PotVolumeUnit } from './types';

describe('getWaterAmountMl', () => {
    it.each([
        [9, 35],
        [10.5, 45],
        [12, 80],
        [13, 100],
        [14, 120],
        [15, 150],
        [17, 200],
        [19, 300],
        [21, 400],
        [24, 500],
        [27, 750],
        [30, 1000]
    ])('maps a %s cm pot to %s ml', (diameter, ml) => {
        expect(getWaterAmountMl({
            potDiameter: diameter
        })).toBe(ml);
    });

    it.each([
        [1, 100],
        [12, 1200],
        [60, 6000],
        [86, 8600],
        [100, 10_000],
        [1000, 100_000]
    ])('maps a %s L container to %s ml', (litres, ml) => {
        expect(getWaterAmountMl({
            soilVolumeLitres: litres
        })).toBe(ml);
    });

    it('derives no amount when the size is unset', () => {
        expect(getWaterAmountMl({})).toBeUndefined();
    });

    it('derives no amount for an unrecognised diameter', () => {
        expect(getWaterAmountMl({
            potDiameter: 11
        })).toBeUndefined();
    });

    it('derives the amount from a litre size when no diameter is set', () => {
        expect(getWaterAmountMl({
            soilVolumeLitres: 1000
        })).toBe(100_000);
    });

    it('prefers the diameter when a size carries both', () => {
        expect(getWaterAmountMl({
            potDiameter: 12,
            soilVolumeLitres: 60
        })).toBe(80);
    });
});

describe('formatWaterAmount', () => {
    it.each([{
        amount: 80,
        text: '80 ml'
    }, {
        amount: 1000,
        text: '1 000 ml'
    }, {
        amount: 1001,
        text: '1 L'
    }, {
        amount: 1200,
        text: '1.2 L'
    }, {
        amount: 6000,
        text: '6 L'
    }, {
        amount: 62_500,
        text: '62.5 L'
    }, {
        amount: 100_000,
        text: '100 L'
    }])('renders $amount ml as $text', ({ amount, text }) => {
        expect(formatWaterAmount(amount)).toBe(text);
    });
});

describe('POT_SIZES', () => {
    it.each(POT_SIZES)('derives a whole number of millilitres for a $diameter cm pot', ({ diameter, volume }) => {
        const amount = getWaterAmountMl({
            potDiameter: diameter
        });

        expect(amount).toBe(Math.round(volume * ML_PER_LITRE * WATER_AMOUNT_RATIO));
        expect(Number.isSafeInteger(amount)).toBe(true);
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
