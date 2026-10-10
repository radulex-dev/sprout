import { type CSSProperties } from 'react';

export const countdownRingStyle = (timeout: number): CSSProperties => {
    return {
        animationDuration: `${timeout}ms`
    };
};
