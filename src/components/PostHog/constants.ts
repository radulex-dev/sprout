export const POSTHOG_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'PRD' : 'local';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
export const POSTHOG_PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
