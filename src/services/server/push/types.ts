export interface PushSubscriptionInput {
    endpoint: string;
    keys: { p256dh: string; auth: string; };
}

export interface PushPayload {
    title: string;
    body: string;
    tag?: string;
    url?: string;
}

export interface PushSendResult {
    sent: number;
    removed: number;
}

export enum PushOutcome {
    Sent = 'sent',
    Removed = 'removed',
    Failed = 'failed'
}
