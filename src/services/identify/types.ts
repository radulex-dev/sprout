// Types
import type { CareSchedule } from '@/types';

export interface IdentifyResult {
    species: string;
    commonName: string;
    confidence: number; // 0..1
    defaultCare: CareSchedule;
}

export interface ApiErrorBody {
    error?: string;
}
