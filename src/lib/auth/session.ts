import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Auth
import { auth } from '@/lib/auth';

export const requireUser = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    return session;
});
