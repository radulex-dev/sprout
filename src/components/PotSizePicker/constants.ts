// Constants
import { MAX_SOIL_VOLUME_LITRES, MIN_SOIL_VOLUME_LITRES } from '@/helpers/pot/constants';

export const POT_SIZE_LABEL = 'Pot size';
export const POT_SIZE_HINT = 'Optional · Measure across the top of the pot, in cm.';
export const POT_CLEAR_LABEL = 'Clear pot size';
export const SET_POT_SIZE_LABEL = 'Set pot size';

export const ROUND_SHAPE_LABEL = 'Round pot';
export const LONG_SHAPE_LABEL = 'Litres';
export const SHAPE_GROUP_LABEL = 'Container shape';

export const LITRES_FIELD_LABEL = 'Soil volume in litres';
export const LITRES_UNIT = 'L';
export const POT_DIAMETER_UNIT = 'cm';
export const LITRES_INFO_LABEL = 'About the soil volume';
export const POT_DIAMETER_INFO_LABEL = 'About measuring the pot diameter';

export const LITRES_ERROR = `Enter a whole number of litres between ${MIN_SOIL_VOLUME_LITRES} and ${MAX_SOIL_VOLUME_LITRES}.`;

export const LITRE_BAR_HEIGHT_REM = 8.5;
export const DOSE_MARKS: readonly number[] = [20, 40, 60, 80];
export const DOSE_PILL_MIN_BOTTOM_REM = 0.75;

export const POT_WIDTH_REM_PER_CM = 0.09167;

export const POT_GLYPH_VIEW_BOX = '0 0 64 60';
export const POT_GLYPH_BODY_PATH = 'M9 16H55L47 57H17Z';
export const POT_GLYPH_RIM_X = 4;
export const POT_GLYPH_RIM_Y = 5;
export const POT_GLYPH_RIM_WIDTH = 56;
export const POT_GLYPH_RIM_HEIGHT = 13;
export const POT_GLYPH_RIM_RADIUS = 4;
