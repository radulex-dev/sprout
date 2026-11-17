// Types
import { CareSeason } from '@/types';

export const seasonForTimestamp = (timestamp: number): CareSeason => {
    const month = new Date(timestamp).getUTCMonth();

    switch (month) {
        case 2:
        case 3:
        case 4: {
            return CareSeason.Spring;
        }
        case 5:
        case 6:
        case 7: {
            return CareSeason.Summer;
        }
        case 8:
        case 9:
        case 10: {
            return CareSeason.Autumn;
        }
        default: {
            return CareSeason.Winter;
        }
    }
};
