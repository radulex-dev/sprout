// Constants
import { ML_PER_LITRE, ML_PER_VOLUME_UNIT, POT_SIZES } from './constants';

// Types
import type { ContainerSize } from './types';

export const hasContainerSize = (size?: ContainerSize): boolean => {
    return size?.potDiameter !== undefined || size?.soilVolumeLitres !== undefined;
};

export const resolveSoilVolumeMl = (size?: ContainerSize): number | undefined => {
    if (size?.potDiameter !== undefined) {
        const pot = POT_SIZES.find((entry) => {
            return entry.diameter === size.potDiameter;
        });

        if (!pot) {
            return;
        }

        return pot.volume * ML_PER_VOLUME_UNIT[pot.volumeUnit];
    }

    if (size?.soilVolumeLitres !== undefined) {
        return size.soilVolumeLitres * ML_PER_LITRE;
    }

    return;
};

const formatMillilitres = (amount: number): string => {
    return `${String(amount).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ' ')} ml`;
};

const formatLitres = (amount: number): string => {
    const tenths = Math.round((amount / ML_PER_LITRE) * 10);

    return `${(tenths / 10).toFixed(1).replace(/\.0$/, '')} L`;
};

export const formatWaterAmount = (amount: number): string => {
    if (amount <= ML_PER_LITRE) {
        return formatMillilitres(amount);
    }

    return formatLitres(amount);
};
