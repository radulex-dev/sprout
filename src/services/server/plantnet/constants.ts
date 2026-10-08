// Constants
import { MAX_PHOTO_BYTES } from '@/helpers/image/constants';

export const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/all';
export const PLANTNET_NB_RESULTS = 5;
export const MULTIPART_OVERHEAD_BYTES = 1_048_576;
export const MAX_IDENTIFY_BYTES = MAX_PHOTO_BYTES + MULTIPART_OVERHEAD_BYTES;
export const ERROR_NO_IMAGE = 'No image provided.';
export const ERROR_IMAGE_TOO_LARGE = 'That photo is too large. Upload a smaller one and try again.';
export const ERROR_BAD_IMAGE = 'That photo can\'t be used. Upload a JPEG or PNG and try again.';
export const ERROR_NO_KEY = 'Plant recognition is unavailable right now.';
export const ERROR_BAD_KEY = 'Plant recognition is unavailable right now.';
export const ERROR_NOT_RECOGNISED = 'We couldn\'t recognise that plant. Try a clearer photo.';
export const ERROR_UNREACHABLE = 'Plant recognition is unavailable. Try again in a moment.';
export const ERROR_UNAVAILABLE = 'Plant recognition is unavailable. Try again in a moment.';
