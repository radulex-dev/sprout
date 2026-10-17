// Types
import { PotDiameterUnit, PotVolumeUnit, type PotSize } from './types';

export const POT_SIZES: readonly PotSize[] = [{
    diameter: 9,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 0.35,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 10.5,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 0.45,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 12,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 0.8,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 13,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 1,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 14,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 1.2,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 15,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 1.5,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 17,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 2,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 19,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 3,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 21,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 4,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 24,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 5,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 27,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 7.5,
    volumeUnit: PotVolumeUnit.Litres
}, {
    diameter: 30,
    diameterUnit: PotDiameterUnit.Centimetres,
    volume: 10,
    volumeUnit: PotVolumeUnit.Litres
}];

export const WATER_AMOUNT_RATIO = 0.1;
export const ML_PER_LITRE = 1000;

export const MIN_SOIL_VOLUME_LITRES = 1;
export const MAX_SOIL_VOLUME_LITRES = 1000;

export const ML_PER_VOLUME_UNIT: Record<PotVolumeUnit, number> = {
    [PotVolumeUnit.Litres]: ML_PER_LITRE
};
