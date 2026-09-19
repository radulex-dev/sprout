import type { DateDuration } from '@internationalized/date';
import type { PopoverPositionerProps } from '@base-ui/react/popover';

export const SELECT_DATE_TEXT = 'Select date…';
export const PREVIOUS_MONTH_LABEL = 'Previous month';
export const NEXT_MONTH_LABEL = 'Next month';
export const DEFAULT_LOCALE = 'en-US';
export const DATE_SELECT_SIDE_OFFSET = 4;
export const DATE_SELECT_COLLISION_PADDING = 8;
export const DAYS_IN_WEEK = 7;
export const MONTH_TITLE_FORMAT: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric'
};
export const WEEKDAY_FORMAT: Intl.DateTimeFormatOptions = {
    weekday: 'short'
};
export const DAY_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
};
export const NEXT_MONTH_STEP: DateDuration = {
    months: 1
};
export const PREVIOUS_MONTH_STEP: DateDuration = {
    months: -1
};
export const DATE_SELECT_COLLISION_AVOIDANCE: PopoverPositionerProps['collisionAvoidance'] = {
    side: 'flip',
    align: 'shift'
};
