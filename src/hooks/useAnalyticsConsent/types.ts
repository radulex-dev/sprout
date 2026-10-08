export interface AnalyticsConsentState {
    isLoaded: boolean;
    consent: boolean | undefined;
    accept: () => void;
    decline: () => void;
}
