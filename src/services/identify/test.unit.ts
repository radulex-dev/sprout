import { describe, expect, it, vi } from 'vitest';

// Services
import { identifyPlant } from './index';

type FetchMock = ReturnType<typeof vi.fn<(input: string, init: RequestInit) => Promise<Response>>>;

const stubFetch = (): FetchMock => {
    const fetchMock = vi.fn<(input: string, init: RequestInit) => Promise<Response>>();

    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
};

describe('identifyPlant', () => {
    it('uploads the photo to the identify endpoint', async () => {
        const fetchMock = stubFetch();

        fetchMock.mockResolvedValue({
            ok: true,
            json: () => {
                return Promise.resolve([]);
            }
        } as Response);

        const photo = new Blob(['jpeg'], {
            type: 'image/jpeg'
        });

        await identifyPlant(photo);

        const [input, init] = fetchMock.mock.calls.at(0) ?? [];
        const form = init?.body as FormData;

        expect(input).toBe('/api/identify');
        expect((form.get('images') as Blob).type).toBe('image/jpeg');
    });

    it('surfaces the server error message', async () => {
        const fetchMock = stubFetch();

        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            json: () => {
                return Promise.resolve({
                    error: 'Could not read that image. Try a different photo.'
                });
            }
        } as Response);

        await expect(identifyPlant(new Blob(['jpeg'], {
            type: 'image/jpeg'
        }))).rejects.toThrow('Could not read that image. Try a different photo.');
    });
});
