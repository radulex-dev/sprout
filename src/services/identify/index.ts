// Types
import type { ApiErrorBody, IdentifyResult } from './types';

export const identifyPlant = async (photo: Blob): Promise<IdentifyResult[]> => {
    const form = new FormData();
    form.append('images', photo, 'plant.jpg');

    const response = await fetch('/api/identify', {
        method: 'POST',
        body: form
    });

    if (!response.ok) {
        let error: ApiErrorBody | undefined;
        try {
            error = (await response.json()) as ApiErrorBody;
        } catch {
            // response body was not JSON
        }
        throw new Error(error?.error ?? `Identification failed (HTTP ${response.status}).`);
    }

    return (await response.json()) as IdentifyResult[];
};
