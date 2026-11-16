export interface IdentifyResult {
    species: string;
    commonName: string;
    confidence: number; // 0..1
}

export interface ApiErrorBody {
    error?: string;
}
