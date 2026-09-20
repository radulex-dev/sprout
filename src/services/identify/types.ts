// Types
import type { CareSchedule, CareSource } from '@/types';

export interface IdentifyResult {
    species: string;
    commonName: string;
    confidence: number; // 0..1
    defaultCare: CareSchedule;
    careSource: CareSource;
}

export interface ApiErrorBody {
    error?: string;
}
