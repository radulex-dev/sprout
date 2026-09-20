import { sql } from 'drizzle-orm';
import { bigint, check, customType, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Schema
export { account, session, user, verification } from './auth-schema';
import { user } from './auth-schema';

// Types
import type { CareKind, CareMatchType, CareSchedule, CareUnit } from '@/types';
import { TableName, type ByteaColumn } from './types';

/** Postgres `bytea` column. node-postgres already maps bytea <-> Buffer. */
const bytea = customType<ByteaColumn>({
    dataType: () => { return 'bytea'; },
    toDriver: (value: Buffer): Buffer => { return value; },
    fromDriver: (value: Buffer): Buffer => { return value; }
});

export const plants = pgTable(
    TableName.Plants,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id')
            .notNull()
            .references(() => { return user.id; }, {
                onDelete: 'cascade'
            }),
        nickname: text('nickname').notNull(),
        species: text('species').notNull(),
        commonName: text('common_name').notNull().default(''),
        photo: bytea('photo'),
        acquiredAt: bigint('acquired_at', {
            mode: 'number'
        }).notNull(),
        care: jsonb('care').$type<CareSchedule>().notNull(),
        lastCare: jsonb('last_care').$type<Record<CareKind, number>>().notNull(),
        lastNotified: jsonb('last_notified')
            .$type<Partial<Record<CareKind, number>>>()
            .notNull()
            .default({}),
        notes: text('notes').notNull().default('')
    },
    (table) => {
        return [index('plants_user_id_idx').on(table.userId)];
    }
);

export const careReference = pgTable(
    TableName.CareReference,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchType: text('match_type').$type<CareMatchType>().notNull(),
        matchKey: text('match_key').notNull(),
        aliasTarget: text('alias_target'),
        waterInterval: integer('water_interval'),
        waterUnit: text('water_unit').$type<CareUnit>(),
        fertilizeInterval: integer('fertilize_interval'),
        fertilizeUnit: text('fertilize_unit').$type<CareUnit>(),
        repotInterval: integer('repot_interval'),
        repotUnit: text('repot_unit').$type<CareUnit>(),
        family: text('family'),
        sourceUrl: text('source_url')
    },
    (table) => {
        return [
            uniqueIndex('care_reference_match_idx').on(table.matchType, table.matchKey),
            check('care_reference_water_range', sql`(${table.waterInterval} is null and ${table.waterUnit} is null) or (${table.waterInterval} is not null and ${table.waterUnit} is not null and ${table.waterUnit} in ('D', 'M', 'Y') and ${table.waterInterval} * case ${table.waterUnit} when 'D' then 1 when 'M' then 30 else 365 end between 2 and 28)`),
            check('care_reference_fertilize_range', sql`(${table.fertilizeInterval} is null and ${table.fertilizeUnit} is null) or (${table.fertilizeInterval} is not null and ${table.fertilizeUnit} is not null and ${table.fertilizeUnit} in ('D', 'M', 'Y') and ${table.fertilizeInterval} * case ${table.fertilizeUnit} when 'D' then 1 when 'M' then 30 else 365 end between 14 and 90)`),
            check('care_reference_repot_range', sql`(${table.repotInterval} is null and ${table.repotUnit} is null) or (${table.repotInterval} is not null and ${table.repotUnit} is not null and ${table.repotUnit} in ('D', 'M', 'Y') and ${table.repotInterval} * case ${table.repotUnit} when 'D' then 1 when 'M' then 30 else 365 end between 180 and 1095)`)
        ];
    }
);

export const pushSubscriptions = pgTable(
    TableName.PushSubscriptions,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id')
            .notNull()
            .references(() => { return user.id; }, {
                onDelete: 'cascade'
            }),
        endpoint: text('endpoint').notNull(),
        p256dh: text('p256dh').notNull(),
        auth: text('auth').notNull(),
        createdAt: bigint('created_at', {
            mode: 'number'
        }).notNull()
    },
    (table) => {
        return [
            uniqueIndex('push_subscriptions_endpoint_idx').on(table.endpoint),
            index('push_subscriptions_user_id_idx').on(table.userId)
        ];
    }
);
