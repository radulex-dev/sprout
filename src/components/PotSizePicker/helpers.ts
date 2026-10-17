import type React from 'react';

// Constants
import { DOSE_PILL_MIN_BOTTOM_REM, LITRE_BAR_HEIGHT_REM, LITRES_UNIT, POT_DIAMETER_UNIT } from './constants';
import { MAX_SOIL_VOLUME_LITRES, MIN_SOIL_VOLUME_LITRES } from '@/helpers/pot/constants';

// Helpers
import { formatWaterAmount } from '@/helpers/pot';

// Types
import type { ContainerSize } from '@/helpers/pot/types';

export const hasContainerSize = (size?: ContainerSize): boolean => {
    return size?.potDiameter !== undefined || size?.soilVolumeLitres !== undefined;
};

export const formatContainerSize = (size?: ContainerSize): string | undefined => {
    if (size?.soilVolumeLitres !== undefined) {
        return `${size.soilVolumeLitres} ${LITRES_UNIT}`;
    }

    if (size?.potDiameter !== undefined) {
        return `${size.potDiameter} ${POT_DIAMETER_UNIT}`;
    }

    return;
};

export const formatPotOptionName = (diameter: number): string => {
    return `Select ${diameter} ${POT_DIAMETER_UNIT} pot`;
};

export const formatRoundAmountSentence = (diameter: number, amount: number): string => {
    return `${formatPotOptionName(diameter)} · about ${formatWaterAmount(amount)}`;
};

export const formatLitresAmount = (amount: number): string => {
    return `about ${formatWaterAmount(amount)}`;
};

export const parseSoilVolumeLitres = (text: string): number | undefined => {
    const trimmed = text.trim();

    if (!/^\d+$/.test(trimmed)) {
        return;
    }

    const litres = Number(trimmed);

    if (litres < MIN_SOIL_VOLUME_LITRES || litres > MAX_SOIL_VOLUME_LITRES) {
        return;
    }

    return litres;
};

const litreFillPercent = (litres: number | undefined): number => {
    if (litres === undefined) {
        return 0;
    }

    return Math.round(Math.min(Math.sqrt(litres / MAX_SOIL_VOLUME_LITRES), 1) * 1000) / 10;
};

export const litreFillStyle = (litres: number | undefined): React.CSSProperties => {
    return {
        height: `${litreFillPercent(litres)}%`
    };
};

export const doseTickStyle = (mark: number): React.CSSProperties => {
    return {
        bottom: `${mark}%`
    };
};

export const dosePillStyle = (litres: number | undefined): React.CSSProperties => {
    const bottom = Math.max(litreFillPercent(litres), Math.round((DOSE_PILL_MIN_BOTTOM_REM / LITRE_BAR_HEIGHT_REM) * 1000) / 10);

    return {
        bottom: `${bottom}%`
    };
};
