// Types
import { CareSeason } from '@/types';

export const seasonForTimestamp = (timestamp: number): CareSeason => {
    const month = new Date(timestamp).getUTCMonth();

    switch (month) {
        case 3:
        case 4:
        case 5: {
            return CareSeason.Summer;
        }
        case 6:
        case 7:
        case 8: {
            return CareSeason.Autumn;
        }
        case 9:
        case 10:
        case 11: {
            return CareSeason.Winter;
        }
        default: {
            return CareSeason.Spring;
        }
    }
};
