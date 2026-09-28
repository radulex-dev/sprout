export interface UmamiPayload {
    url?: string;
    [key: string]: unknown;
}

export type UmamiBeforeSend = (type: string, payload: UmamiPayload) => UmamiPayload | undefined;

declare global {
    interface Window {
        sproutBeforeSend?: UmamiBeforeSend;
    }
}
