// Database
import type { careReference, plants } from './schema';

export enum TableName {
    Plants = 'plants',
    CareReference = 'care_reference',
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
export type CareReferenceRow = typeof careReference.$inferSelect;
