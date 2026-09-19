export const formatDaysAgo = (daysAgo: number): string => {
    if (daysAgo <= 0) {
        return 'today';
    }

    if (daysAgo === 1) {
        return 'yesterday';
    }

    return `${daysAgo} days ago`;
};
