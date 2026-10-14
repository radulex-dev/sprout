'use client';

import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';

// Constants
import { POSTHOG_ENVIRONMENT, POSTHOG_HOST, POSTHOG_PROJECT_TOKEN } from './constants';

// Auth
import { authClient } from '@/lib/auth/auth-client';

const PostHog: React.FunctionComponent = () => {
    const { data: session, isPending } = authClient.useSession();
    const hasIdentifiedRef = useRef(false);
    const userId = session?.user.id;
    const email = session?.user.email;

    useEffect(() => {
        if (!POSTHOG_PROJECT_TOKEN) {
            return;
        }

        posthog.init(POSTHOG_PROJECT_TOKEN, {
            api_host: POSTHOG_HOST,
            defaults: '2026-05-30'
        });
        posthog.register({
            environment: POSTHOG_ENVIRONMENT
        });
    }, []);

    useEffect(() => {
        if (!POSTHOG_PROJECT_TOKEN || isPending) {
            return;
        }

        if (userId) {
            posthog.identify(userId, {
                email
            });
            hasIdentifiedRef.current = true;
        } else if (hasIdentifiedRef.current) {
            posthog.reset();
            hasIdentifiedRef.current = false;
        }
    }, [email, isPending, userId]);

    return;
};

export default PostHog;
