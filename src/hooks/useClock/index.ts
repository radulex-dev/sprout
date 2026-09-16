import { useEffect, useState } from 'react';

// Constants
import { CLOCK_TICK_INTERVAL_MS } from './constants';

export const useClock = (intervalMs = CLOCK_TICK_INTERVAL_MS): number => {
    const [now, setNow] = useState(() => {
        return Date.now();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, intervalMs);

        return () => {
            clearInterval(interval);
        };
    }, [intervalMs]);

    return now;
};
