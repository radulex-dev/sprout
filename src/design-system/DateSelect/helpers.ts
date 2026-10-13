import { getLocalTimeZone, parseDate, startOfMonth, today, type CalendarDate } from '@internationalized/date';

export const monthOf = (value: string | undefined): CalendarDate => {
    return startOfMonth(value ? parseDate(value) : today(getLocalTimeZone()));
};
