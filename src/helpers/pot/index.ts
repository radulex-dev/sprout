// Constants
import { ML_PER_VOLUME_UNIT, POT_SIZES, WATER_AMOUNT_RATIO } from './constants';

export const waterAmountMl = (diameter: number | undefined): number | undefined => {
    const size = POT_SIZES.find((entry) => {
        return entry.diameter === diameter;
    });

    if (!size) {
        return;
    }

    return Math.round(size.volume * ML_PER_VOLUME_UNIT[size.volumeUnit] * WATER_AMOUNT_RATIO);
};
