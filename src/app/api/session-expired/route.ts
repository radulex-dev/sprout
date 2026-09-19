import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'better-auth.session_token';
const SECURE_SESSION_COOKIE = '__Secure-better-auth.session_token';

export const GET = (request: NextRequest) => {
    const response = NextResponse.redirect(new URL('/login', request.url));

    response.cookies.delete(SESSION_COOKIE);
    response.cookies.set(SECURE_SESSION_COOKIE, '', {
        maxAge: 0,
        path: '/',
        secure: true
    });

    return response;
};
