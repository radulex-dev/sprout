import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return;
    }

    const { captureException, readPostHogDistinctId } = await import('@/services/server/posthog');

    captureException(error, readPostHogDistinctId(request.headers.cookie));
};
