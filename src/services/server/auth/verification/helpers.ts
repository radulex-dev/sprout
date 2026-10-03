// Constants
import { VERIFY_THROTTLE_SECONDS } from '@/lib/auth/constants';

export const isMarkerRecent = (createdAt: Date, now: number): boolean => {
    return now - createdAt.getTime() <= VERIFY_THROTTLE_SECONDS * 1000;
};
