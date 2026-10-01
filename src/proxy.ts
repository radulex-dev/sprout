import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

// Constants
import { RESET_PASSWORD_PATH } from '@/lib/auth/constants';

// Optimistic, cookie-only auth check. Real session validation happens in
// server components / server actions via `requireUser`.
export const proxy = (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const isLoggedIn = Boolean(getSessionCookie(request));
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isPublicPage = isAuthPage || pathname === '/forgot-password' || pathname.startsWith(`${RESET_PASSWORD_PATH}/`);

    if (!isLoggedIn && !isPublicPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
};

// Matcher must be a plain string constant for Turbopack to statically analyze
// it, so `unicorn/prefer-string-raw` is disabled for this file in eslint.config.mjs.
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico|webmanifest|js)$).*)']
};
