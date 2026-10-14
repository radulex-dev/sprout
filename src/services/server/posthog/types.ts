export interface PostHogCookieState {
    distinct_id?: string;
}

export enum PostHogEvent {
    PlantCreated = 'plant_created',
    PlantIdentified = 'plant_identified'
}
