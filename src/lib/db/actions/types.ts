// Types
import type { CareSchedule } from '@/types';

export enum CareProfileStatus {
    Loading = 'loading',
    Ok = 'ok',
    Unavailable = 'unavailable',
    Capped = 'capped'
}

export interface LoadCareIntervalsRequest {
    species: string;
}

export interface LoadWaterAmountRequest {
    species: string;
    soilVolumeMl?: number;
}

export interface LoadCareIntervalsOk {
    status: CareProfileStatus.Ok;
    care: CareSchedule;
}

export interface LoadCareIntervalsUnavailable {
    status: CareProfileStatus.Unavailable;
}

export interface LoadCareIntervalsCapped {
    status: CareProfileStatus.Capped;
}

export type LoadCareIntervalsResult = LoadCareIntervalsOk | LoadCareIntervalsUnavailable | LoadCareIntervalsCapped;

export interface LoadWaterAmountOk {
    status: CareProfileStatus.Ok;
    waterAmountMl: number;
}

export interface LoadWaterAmountUnavailable {
    status: CareProfileStatus.Unavailable;
}

export interface LoadWaterAmountCapped {
    status: CareProfileStatus.Capped;
}

export type LoadWaterAmountResult = LoadWaterAmountOk | LoadWaterAmountUnavailable | LoadWaterAmountCapped;
