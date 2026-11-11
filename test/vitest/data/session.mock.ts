// Auth
import type { auth } from '@/lib/auth';

type AuthSession = NonNullable<Awaited<NonNullable<ReturnType<typeof auth.api.getSession>>>>;

export const VERIFIED_SESSION: AuthSession = {
    session: {
        id: 'session-1',
        createdAt: new Date(1700000000000),
        updatedAt: new Date(1700000000000),
        userId: 'user-1',
        expiresAt: new Date(1700003600000),
        token: 'session-token'
    },
    user: {
        id: 'user-1',
        createdAt: new Date(1700000000000),
        updatedAt: new Date(1700000000000),
        email: 'user-1@example.com',
        emailVerified: true,
        name: 'Sprout user'
    }
};

export const UNVERIFIED_SESSION: AuthSession = {
    ...VERIFIED_SESSION,
    user: {
        ...VERIFIED_SESSION.user,
        emailVerified: false
    }
};
