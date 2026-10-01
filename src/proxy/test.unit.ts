import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

const { proxy } = await import('../proxy');

describe('proxy', () => {
    it('lets a signed-out user reach a reset-password link', () => {
        const response = proxy(new NextRequest('http://localhost:3000/reset-password/abc'));

        expect(response.headers.get('location')).toBeNull();
        expect(response.status).toBe(200);
    });

    it('lets a signed-out user reach forgot-password', () => {
        const response = proxy(new NextRequest('http://localhost:3000/forgot-password'));

        expect(response.headers.get('location')).toBeNull();
        expect(response.status).toBe(200);
    });

    it('redirects a signed-out user from a private page to login', () => {
        const response = proxy(new NextRequest('http://localhost:3000/plants'));

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects a signed-in user away from login', () => {
        const response = proxy(new NextRequest('http://localhost:3000/login', {
            headers: {
                cookie: 'better-auth.session_token=session-token-value'
            }
        }));

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('lets a signed-in user reach a reset-password link', () => {
        const response = proxy(new NextRequest('http://localhost:3000/reset-password/abc', {
            headers: {
                cookie: 'better-auth.session_token=session-token-value'
            }
        }));

        expect(response.headers.get('location')).toBeNull();
        expect(response.status).toBe(200);
    });
});
