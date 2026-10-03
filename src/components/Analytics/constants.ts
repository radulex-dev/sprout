export const PLANT_DETAIL_PATTERN = /^\/plants\/[^/]+\/?$/;
export const PLANT_DETAIL_NORMALISED = '/plants/[id]';
export const RESET_PASSWORD_PATTERN = /^\/reset-password\/[^/]+\/?$/;
export const RESET_PASSWORD_NORMALISED = '/reset-password/[token]';

export const URL_NORMALISATIONS = [{
    pattern: PLANT_DETAIL_PATTERN,
    normalised: PLANT_DETAIL_NORMALISED
}, {
    pattern: RESET_PASSWORD_PATTERN,
    normalised: RESET_PASSWORD_NORMALISED
}] as const;

export const UMAMI_BEFORE_SEND_GLOBAL = 'sproutBeforeSend' as const;
export const UMAMI_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
