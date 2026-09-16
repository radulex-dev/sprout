export enum CareKind {
    Water = 'water',
    Fertilize = 'fertilize',
    Repot = 'repot'
}

export interface CareSchedule {
    waterEveryDays: number;
    fertilizeEveryDays: number;
    repotEveryMonths: number;
}

export interface Plant {
    id: string;
    nickname: string;
    species: string;
    commonName: string;
    photo?: string;
    acquiredAt: number;
    care: CareSchedule;
    lastCare: Record<CareKind, number>;
    lastNotified: Partial<Record<CareKind, number>>;
    notes: string;
}
export interface PlantInput {
    nickname: string;
    species: string;
    commonName: string;
    care: CareSchedule;
    photo?: Blob;
    acquiredAt: number;
    lastCare?: Partial<Record<CareKind, number>>;
}

export type LastCareDates = Partial<Record<CareKind, string>>;
