import 'server-only';
import type * as z from 'zod';

// Constants
import { AI_CHAT_COMPLETIONS_PATH, AI_REQUEST_TIMEOUT_MS, AI_SCHEMA_NAME, ERROR_CAP_REACHED, ERROR_INVALID_RESPONSE, ERROR_NOT_CONFIGURED, ERROR_REFUSED, ERROR_REQUEST_FAILED } from './constants';

// Helpers
import { isAiConfiguredEnvironment, resolveStructuredMode } from './helpers';

// Services
import { AiChatEnvelopeSchema } from './schema';

// Types
import { StructuredMode, type AiEnvironment, type AiMessage } from './types';

export class AiUnavailableError extends Error {
    constructor(message: string = ERROR_NOT_CONFIGURED) {
        super(message);
        this.name = 'AiUnavailableError';
    }
}

export class AiCapReachedError extends Error {
    constructor(message: string = ERROR_CAP_REACHED) {
        super(message);
        this.name = 'AiCapReachedError';
    }
}

export class AiRequestError extends Error {
    readonly status?: number;

    constructor(message: string = ERROR_REQUEST_FAILED, status?: number) {
        super(message);
        this.name = 'AiRequestError';
        this.status = status;
    }
}

export const readAiEnvironment = (): AiEnvironment => {
    return {
        baseUrl: process.env.AI_BASE_URL ?? '',
        model: process.env.AI_MODEL ?? '',
        apiKey: process.env.AI_API_KEY ?? '',
        mode: resolveStructuredMode(process.env.AI_STRUCTURED_MODE)
    };
};

export const isAiConfigured = (): boolean => {
    return isAiConfiguredEnvironment(readAiEnvironment());
};

export const requestStructured = async <T>(messages: AiMessage[], jsonSchema: Record<string, unknown>, schema: z.ZodType<T>, mode?: StructuredMode): Promise<T> => {
    const environment = readAiEnvironment();

    if (!isAiConfiguredEnvironment(environment)) {
        console.warn(ERROR_NOT_CONFIGURED);

        throw new AiUnavailableError();
    }

    const strictResponseFormat = {
        type: 'json_schema',
        json_schema: {
            name: AI_SCHEMA_NAME,
            strict: true,
            schema: jsonSchema
        }
    };
    const bestEffortResponseFormat = {
        type: 'json_object'
    };
    const responseFormat = (mode ?? environment.mode) === StructuredMode.BestEffort ? bestEffortResponseFormat : strictResponseFormat;

    let response: Response;

    try {
        response = await fetch(`${environment.baseUrl}${AI_CHAT_COMPLETIONS_PATH}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${environment.apiKey}`,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
            body: JSON.stringify({
                model: environment.model,
                messages,
                response_format: responseFormat
            })
        });
    } catch {
        console.warn(ERROR_REQUEST_FAILED);

        throw new AiRequestError();
    }

    if (!response.ok) {
        console.warn(ERROR_REQUEST_FAILED, response.status);

        throw new AiRequestError(ERROR_REQUEST_FAILED, response.status);
    }

    let envelope: unknown;

    try {
        envelope = await response.json();
    } catch {
        console.warn(ERROR_INVALID_RESPONSE);

        throw new AiRequestError(ERROR_INVALID_RESPONSE);
    }

    const parsedEnvelope = AiChatEnvelopeSchema.safeParse(envelope);

    if (!parsedEnvelope.success) {
        console.warn(ERROR_INVALID_RESPONSE);

        throw new AiRequestError(ERROR_INVALID_RESPONSE);
    }

    const [choice] = parsedEnvelope.data.choices;

    if (choice.finish_reason === 'refusal') {
        console.warn(ERROR_REFUSED);

        throw new AiRequestError(ERROR_REFUSED);
    }

    const content = choice.message.content;

    if (!content) {
        console.warn(ERROR_INVALID_RESPONSE);

        throw new AiRequestError(ERROR_INVALID_RESPONSE);
    }

    let payload: unknown;

    try {
        payload = JSON.parse(content);
    } catch {
        console.warn(ERROR_INVALID_RESPONSE);

        throw new AiRequestError(ERROR_INVALID_RESPONSE);
    }

    const parsedPayload = schema.safeParse(payload);

    if (!parsedPayload.success) {
        console.warn(ERROR_INVALID_RESPONSE);

        throw new AiRequestError(ERROR_INVALID_RESPONSE);
    }

    return parsedPayload.data;
};

export { claimAiUsage } from './usage';
