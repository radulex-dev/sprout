// Constants
import { MAX_PHOTO_BYTES } from '@/helpers/image/constants';
import { HttpStatus } from '@/lib/http/constants';
import { ERROR_BAD_IMAGE, ERROR_BAD_KEY, ERROR_IMAGE_TOO_LARGE, ERROR_NO_IMAGE, ERROR_NO_KEY, ERROR_NOT_RECOGNISED, ERROR_UNAVAILABLE, ERROR_UNREACHABLE, MAX_IDENTIFY_BYTES, PLANTNET_API_URL, PLANTNET_NB_RESULTS } from './constants';

// Helpers
import { resolveCare } from '@/helpers/care/resolve';

// Services
import { loadCareReference } from '@/services/server/care-reference';
import type { IdentifyResult } from '@/services/identify/types';

// Types
import { CareSource } from '@/types';
import type { PlantNetErrorBody, PlantNetResponse } from './types';

export class PlantNetError extends Error {
    readonly httpStatus: HttpStatus;

    constructor(message: string, httpStatus: HttpStatus) {
        super(message);
        this.name = 'PlantNetError';
        this.httpStatus = httpStatus;
    }
}

export const readIdentifyForm = async (request: Request): Promise<FormData> => {
    const contentType = request.headers.get('content-type') ?? '';
    const declaredLength = Number(request.headers.get('content-length'));

    if (Number.isFinite(declaredLength) && declaredLength > MAX_IDENTIFY_BYTES) {
        throw new PlantNetError(ERROR_IMAGE_TOO_LARGE, HttpStatus.PayloadTooLarge);
    }

    const body = request.body;

    if (!body) {
        throw new PlantNetError(ERROR_NO_IMAGE, HttpStatus.BadRequest);
    }

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    for (; ;) {
        const { done: isDone, value } = await reader.read();

        if (isDone) {
            break;
        }

        total += value.byteLength;

        if (total > MAX_IDENTIFY_BYTES) {
            await reader.cancel();

            throw new PlantNetError(ERROR_IMAGE_TOO_LARGE, HttpStatus.PayloadTooLarge);
        }

        chunks.push(value);
    }

    return new Response(Buffer.concat(chunks), {
        headers: {
            'content-type': contentType
        }
    }).formData();
};

const readPlantNetMessage = async (response: Response): Promise<string | undefined> => {
    try {
        const body = (await response.json()) as PlantNetErrorBody;

        return body.message ?? undefined;
    } catch {
        return undefined;
    }
};

export const identifySpecies = async (form: FormData): Promise<IdentifyResult[]> => {
    const image = form.get('images');
    if (!(image instanceof File)) {
        throw new PlantNetError(ERROR_NO_IMAGE, HttpStatus.BadRequest);
    }

    if (image.size > MAX_PHOTO_BYTES) {
        throw new PlantNetError(ERROR_IMAGE_TOO_LARGE, HttpStatus.PayloadTooLarge);
    }

    const apiKey = process.env.PLANTNET_API_KEY ?? '';

    if (!apiKey) {
        throw new PlantNetError(ERROR_NO_KEY, HttpStatus.BadRequest);
    }

    const body = new FormData();
    body.append('images', image, 'plant.jpg');
    body.append('organs', 'auto');

    let response: Response;
    try {
        response = await fetch(
            `${PLANTNET_API_URL}?api-key=${encodeURIComponent(apiKey)}&nb-results=${PLANTNET_NB_RESULTS}`,
            {
                method: 'POST',
                body
            }
        );
    } catch {
        // network-level failure (DNS, offline, connection reset)
        throw new PlantNetError(ERROR_UNREACHABLE, HttpStatus.BadGateway);
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new PlantNetError(ERROR_NOT_RECOGNISED, HttpStatus.BadRequest);
        }

        const message = await readPlantNetMessage(response);

        console.error('PlantNet request failed', response.status, message);

        if (response.status === 401) {
            throw new PlantNetError(ERROR_BAD_KEY, HttpStatus.BadRequest);
        }

        if (response.status === 400) {
            throw new PlantNetError(ERROR_BAD_IMAGE, HttpStatus.BadRequest);
        }

        throw new PlantNetError(ERROR_UNAVAILABLE, HttpStatus.BadGateway);
    }

    const data = (await response.json()) as PlantNetResponse;
    const reference = await loadCareReference();

    return (data.results ?? []).map((result) => {
        const species = result.species?.scientificNameWithoutAuthor ?? 'Unknown species';
        const commonName = result.species?.commonNames?.at(0) ?? '';
        const genus = result.species?.genus?.scientificNameWithoutAuthor ?? undefined;
        const family = result.species?.family?.scientificNameWithoutAuthor ?? undefined;
        const resolved = resolveCare(reference, {
            genus,
            species,
            family
        });

        if (resolved.source === CareSource.None) {
            console.warn('No care data for identified plant', {
                family,
                genus,
                species
            });
        }

        return {
            species,
            commonName,
            confidence: result.score ?? 0,
            defaultCare: resolved.care,
            careSource: resolved.source
        };
    });
};
