import * as z from 'zod';

export const PushSubscriptionInputSchema = z.object({
    endpoint: z.url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1)
    })
});
