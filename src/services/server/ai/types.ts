import type * as z from 'zod';

// Services
import type { AiChatEnvelopeSchema } from './schema';

export enum StructuredMode {
    Strict = 'strict',
    BestEffort = 'best-effort'
}

export interface AiEnvironment {
    baseUrl: string;
    model: string;
    apiKey: string;
    mode: StructuredMode;
}

export interface AiMessage {
    role: string;
    content: string;
}

export type AiChatEnvelope = z.infer<typeof AiChatEnvelopeSchema>;
