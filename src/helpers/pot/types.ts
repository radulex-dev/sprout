export enum PotDiameterUnit {
    Centimetres = 'cm'
}

export enum PotVolumeUnit {
    Litres = 'l'
}

export interface PotSize {
    diameter: number;
    diameterUnit: PotDiameterUnit;
    volume: number;
    volumeUnit: PotVolumeUnit;
}
