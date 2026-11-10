// Constants
import { DAY_MS } from './constants';

// Types
import { StructuredMode, type AiEnvironment } from './types';

export const resolveStructuredMode = (raw: string | undefined): StructuredMode => {
    return raw === StructuredMode.BestEffort ? StructuredMode.BestEffort : StructuredMode.Strict;
};

export const buildDayBucket = (now: number): number => {
    return Math.floor(now / DAY_MS);
};

export const isAiConfiguredEnvironment = (environment: AiEnvironment): boolean => {
    return Boolean(environment.baseUrl && environment.model && environment.apiKey);
};
