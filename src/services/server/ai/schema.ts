import * as z from 'zod';

export const AiChatEnvelopeSchema = z.object({
    choices: z.array(z.object({
        message: z.object({
            content: z.string().nullable()
        }),
        finish_reason: z.string()
    })).min(1)
});
