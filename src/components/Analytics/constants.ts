export const PLANT_DETAIL_PATTERN = /^\/plants\/[^/]+\/?$/;
export const PLANT_DETAIL_NORMALISED = '/plants/[id]';

export const UMAMI_BEFORE_SEND_GLOBAL = 'sproutBeforeSend' as const;
export const UMAMI_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
