// Database
import type { aiCareInterval, aiUsage, aiWaterAmount, careReference, plants, pushSubscriptions } from './schema';

export enum TableName {
    Plants = 'plants',
    CareReference = 'care_reference',
    PushSubscriptions = 'push_subscriptions',
    AiUsage = 'ai_usage',
    AiCareInterval = 'ai_care_interval',
    AiWaterAmount = 'ai_water_amount',
    User = 'user',
    Session = 'session',
    Account = 'account',
    Verification = 'verification'
}

export interface ByteaColumn {
    data: Buffer;
    driverData: Buffer;
}

export type PlantRow = typeof plants.$inferSelect;
export type PlantListRow = Omit<PlantRow, 'photo'> & {
    hasPhoto: boolean;
};
export type CareReferenceRow = typeof careReference.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type AiUsageRow = typeof aiUsage.$inferSelect;
export type AiCareIntervalRow = typeof aiCareInterval.$inferSelect;
export type AiWaterAmountRow = typeof aiWaterAmount.$inferSelect;
