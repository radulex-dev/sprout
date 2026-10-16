export const formatPotOptionName = (diameter: number): string => {
    return `${diameter} cm pot`;
};

export const formatWaterAmount = (diameter: number, amount: number): string => {
    return `${formatPotOptionName(diameter)} · about ${amount} ml per watering`;
};
