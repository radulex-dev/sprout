import { describe, expect, it } from 'vitest';

// Constants
import { ML_PER_LITRE, POT_SIZES } from './constants';

// Helpers
import { formatWaterAmount, resolveSoilVolumeMl } from './index';

// Types
import { PotDiameterUnit, PotVolumeUnit } from './types';

describe('resolveSoilVolumeMl', () => {
    it.each([{
        diameter: 9,
        millilitres: 350
    }, {
        diameter: 10.5,
        millilitres: 450
    }, {
        diameter: 12,
        millilitres: 800
    }, {
        diameter: 13,
        millilitres: 1000
    }, {
        diameter: 14,
        millilitres: 1200
    }, {
        diameter: 15,
        millilitres: 1500
    }, {
        diameter: 17,
        millilitres: 2000
    }, {
        diameter: 19,
        millilitres: 3000
    }, {
        diameter: 21,
        millilitres: 4000
    }, {
        diameter: 24,
        millilitres: 5000
    }, {
        diameter: 27,
        millilitres: 7500
    }, {
        diameter: 30,
        millilitres: 10000
    }])('maps a $diameter cm pot to $millilitres ml', ({ diameter, millilitres }) => {
        expect(resolveSoilVolumeMl({
            potDiameter: diameter
        })).toBe(millilitres);
    });

    it.each([{
        litres: 1,
        millilitres: 1000
    }, {
        litres: 12,
        millilitres: 12000
    }, {
        litres: 60,
        millilitres: 60000
    }, {
        litres: 86,
        millilitres: 86000
    }, {
        litres: 100,
        millilitres: 100000
    }, {
        litres: 1000,
        millilitres: 1000000
    }])('maps a $litres L container to $millilitres ml', ({ litres, millilitres }) => {
        expect(resolveSoilVolumeMl({
            soilVolumeLitres: litres
        })).toBe(millilitres);
    });

    it('derives no volume when the size is unset', () => {
        expect(resolveSoilVolumeMl({})).toBeUndefined();
    });

    it('derives no volume for an unrecognised diameter', () => {
        expect(resolveSoilVolumeMl({
            potDiameter: 11
        })).toBeUndefined();
    });

    it('derives the volume from a litre size when no diameter is set', () => {
        expect(resolveSoilVolumeMl({
            soilVolumeLitres: 1000
        })).toBe(1000000);
    });

    it('prefers the diameter when a size carries both', () => {
        expect(resolveSoilVolumeMl({
            potDiameter: 12,
            soilVolumeLitres: 60
        })).toBe(800);
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
        amount: 62500,
        text: '62.5 L'
    }, {
        amount: 100000,
        text: '100 L'
    }])('renders $amount ml as $text', ({ amount, text }) => {
        expect(formatWaterAmount(amount)).toBe(text);
    });
});

describe('POT_SIZES', () => {
    it.each(POT_SIZES)('converts a $diameter cm pot to whole millilitres', ({ diameter, volume }) => {
        expect(resolveSoilVolumeMl({
            potDiameter: diameter
        })).toBe(volume * ML_PER_LITRE);
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
