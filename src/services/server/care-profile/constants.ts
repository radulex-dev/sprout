export const STANDARD_POT_ML = 800;
export const UNKNOWN_SOIL_VOLUME_ML = 0;

export const MIN_WATER_DAYS = 2;
export const MAX_WATER_DAYS = 28;
export const MIN_FERTILIZE_DAYS = 14;
export const MAX_FERTILIZE_DAYS = 90;
export const MIN_REPOT_MONTHS = 6;
export const MAX_REPOT_MONTHS = 36;
export const MIN_WATER_AMOUNT_ML = 10;
export const MAX_WATER_AMOUNT_ML = 5000;

export const CARE_INTERVAL_PROMPT_SYSTEM = [
    'You are a horticultural advisor estimating care for an indoor houseplant.',
    'Answer for the species given, not for a lookalike.',
    'Return a watering interval in days for each of the four seasons: spring, summer, autumn and winter.',
    'Keep every interval between 2 and 28 days, and let winter differ from summer when the species needs it.',
    'Report fertilizeEveryDays between 14 and 90 days, or 0 when the plant should never be fertilised.',
    'Report repotEveryMonths between 6 and 36 months, or 0 when the plant should never be repotted.',
    'Report confidence as high, medium or low, and reasoning as one sentence.',
    'Return only the JSON object, with no prose and no markdown.'
].join(' ');

export const WATER_AMOUNT_PROMPT_SYSTEM = [
    'You are a horticultural advisor estimating care for an indoor houseplant.',
    'Answer for the species given, not for a lookalike.',
    'Report waterAmountMl as the volume of one watering for the given soil volume, between 10 and 5000 ml.',
    'Return only the JSON object, with no prose and no markdown.'
].join(' ');

export const CARE_PROMPT_SPECIES_LABEL = 'Species';
export const CARE_PROMPT_SOIL_VOLUME_LABEL = 'Soil volume';
export const CARE_PROMPT_MILLILITRES_UNIT = 'ml';
