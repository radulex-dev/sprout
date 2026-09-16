import Compressor from 'compressorjs';

// Constants
import { ERROR_UNREADABLE_IMAGE, JPEG_MIME_TYPE, JPEG_QUALITY, MAX_IMAGE_DIMENSION } from './constants';

export const compressPhoto = (photo: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        new Compressor(photo, {
            mimeType: JPEG_MIME_TYPE,
            quality: JPEG_QUALITY,
            maxWidth: MAX_IMAGE_DIMENSION,
            maxHeight: MAX_IMAGE_DIMENSION,
            // Browsers apply EXIF orientation when decoding (and the data-URL path risks OOM);
            // strict would hand back the original WebP when the re-encode is larger, so keep both off.
            checkOrientation: false,
            strict: false,
            success: resolve,
            error: () => {
                reject(new Error(ERROR_UNREADABLE_IMAGE));
            }
        });
    });
};
