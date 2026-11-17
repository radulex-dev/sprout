import type React from 'react';

// Constants
import { LITRES_UNIT, POT_DIAMETER_UNIT } from './constants';
import { MAX_SOIL_VOLUME_LITRES, MIN_SOIL_VOLUME_LITRES } from '@/helpers/pot/constants';

// Types
import type { ContainerSize } from '@/helpers/pot/types';

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
