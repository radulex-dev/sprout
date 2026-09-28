import { vi } from 'vitest';

// Types
import { type FetchMock } from './types';

export const stubFetch = (): FetchMock => {
    const fetchMock = vi.fn<(input: string, init: RequestInit) => Promise<Response>>();

    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
};

export const mockResponse = (body: unknown, status: number): Response => {
    const isOk = status >= 200 && status < 300;

    return {
        ok: isOk,
        status,
        text: () => {
            return Promise.resolve(JSON.stringify(body));
        }
    } as unknown as Response;
};
