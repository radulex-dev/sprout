// Database
import type { careReference, plants, pushSubscriptions } from './schema';

export enum TableName {
    Plants = 'plants',
    CareReference = 'care_reference',
    PushSubscriptions = 'push_subscriptions',
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
