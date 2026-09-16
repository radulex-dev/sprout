// Constants
import { DAY_MS } from '@/helpers/care/constants';

export const daysUntilDue = (due: number, now: number): number => {
    return Math.ceil((due - now) / DAY_MS);
};
