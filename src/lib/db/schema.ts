import { bigint, boolean, customType, index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Schema
export { account, session, user, verification } from './auth-schema';
import { user } from './auth-schema';

// Types
import type { CareKind, CareProfileConfidence, CareSchedule } from '@/types';
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
        potDiameter: real('pot_diameter'),
        soilVolumeLitres: integer('soil_volume_litres'),
        acquiredAt: bigint('acquired_at', {
            mode: 'number'
        }).notNull(),
        care: jsonb('care').$type<CareSchedule>().notNull(),
        lastCare: jsonb('last_care').$type<Partial<Record<CareKind, number>>>().notNull(),
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
        active: boolean('active').notNull().default(true),
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

export const aiCareInterval = pgTable(
    TableName.AiCareInterval,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        speciesKey: text('species_key').notNull(),
        waterSpring: integer('water_spring').notNull(),
        waterSummer: integer('water_summer').notNull(),
        waterAutumn: integer('water_autumn').notNull(),
        waterWinter: integer('water_winter').notNull(),
        fertilizeEveryDays: integer('fertilize_every_days'),
        repotEveryMonths: integer('repot_every_months'),
        confidence: text('confidence').$type<CareProfileConfidence>().notNull(),
        model: text('model').notNull(),
        createdAt: bigint('created_at', {
            mode: 'number'
        }).notNull()
    },
    (table) => {
        return [uniqueIndex('ai_care_interval_species_idx').on(table.speciesKey)];
    }
);

export const aiWaterAmount = pgTable(
    TableName.AiWaterAmount,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        speciesKey: text('species_key').notNull(),
        soilVolumeMl: integer('soil_volume_ml').notNull(),
        waterAmountMl: integer('water_amount_ml').notNull(),
        model: text('model').notNull(),
        createdAt: bigint('created_at', {
            mode: 'number'
        }).notNull()
    },
    (table) => {
        return [uniqueIndex('ai_water_amount_lookup_idx').on(table.speciesKey, table.soilVolumeMl)];
    }
);

export const aiUsage = pgTable(
    TableName.AiUsage,
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id')
            .notNull()
            .references(() => { return user.id; }, {
                onDelete: 'cascade'
            }),
        day: integer('day').notNull(),
        calls: integer('calls').notNull().default(0),
        createdAt: bigint('created_at', {
            mode: 'number'
        }).notNull()
    },
    (table) => {
        return [uniqueIndex('ai_usage_user_day_idx').on(table.userId, table.day)];
    }
);
