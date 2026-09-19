import type Compressor from 'compressorjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { ERROR_IMAGE_TOO_LARGE, ERROR_UNREADABLE_IMAGE, JPEG_QUALITY, MAX_IMAGE_DIMENSION, MAX_PHOTO_BYTES } from './constants';

// Helpers
import { compressPhoto } from './index';

const compressor = vi.hoisted((): { file?: Blob; options?: Compressor.Options; } => {
    return {};
});

vi.mock('compressorjs', () => {
    return {
        default: function compressorMock(file: Blob, options: Compressor.Options) {
            compressor.file = file;
            compressor.options = options;
        }
    };
});

describe('compressPhoto', () => {
    beforeEach(() => {
        compressor.file = undefined;
        compressor.options = undefined;
    });

    it('compresses to a bounded JPEG', async () => {
        const photo = new Blob(['webp'], {
            type: 'image/jpeg'
        });
        const promise = compressPhoto(photo);

        expect(compressor.file).toBe(photo);
        expect(compressor.options?.mimeType).toBe('image/jpeg');
        expect(compressor.options?.quality).toBe(JPEG_QUALITY);
        expect(compressor.options?.maxWidth).toBe(MAX_IMAGE_DIMENSION);
        expect(compressor.options?.maxHeight).toBe(MAX_IMAGE_DIMENSION);
        expect(compressor.options?.checkOrientation).toBe(false);
        expect(compressor.options?.strict).toBe(false);

        const compressed = new Blob(['compressed'], {
            type: 'image/jpeg'
        });

        compressor.options?.success?.(compressed);

        await expect(promise).resolves.toBe(compressed);
    });

    it('rejects with a readable message when the image cannot be read', async () => {
        const promise = compressPhoto(new Blob(['nope'], {
            type: 'image/jpeg'
        }));

        compressor.options?.error?.(new Error('canvas exploded'));

        await expect(promise).rejects.toThrow(ERROR_UNREADABLE_IMAGE);
    });

    it('rejects a photo that is still too large to upload after compression', async () => {
        const promise = compressPhoto(new Blob(['huge'], {
            type: 'image/jpeg'
        }));

        compressor.options?.success?.(new Blob([new Uint8Array(MAX_PHOTO_BYTES + 1)], {
            type: 'image/jpeg'
        }));

        await expect(promise).rejects.toThrow(ERROR_IMAGE_TOO_LARGE);
    });
});
