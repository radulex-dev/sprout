import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Auth
import { assertVerified } from '@/lib/auth/errors';
import { auth } from '@/lib/auth';

export const requireUser = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/api/session-expired');
    }

    return session;
});

export const requireVerifiedUser = async () => {
    const session = await requireUser();

    assertVerified(session.user.emailVerified);

    return session;
};
