import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  serial,      
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Enum representing the lifecycle status of a match.
 */
export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

/**
 * matches table
 * Stores core information about a sporting event.
 */
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  sport: varchar('sport', { length: 100 }).notNull(),
  homeTeam: varchar('home_team', { length: 255 }).notNull(),
  awayTeam: varchar('away_team', { length: 255 }).notNull(),
  status: matchStatus('status').notNull().default('scheduled'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * commentary table
 * Stores individual real-time events/commentary entries tied to a match.
 */
export const commentary = pgTable('commentary', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  minute: integer('minute'),
  sequence: integer('sequence').notNull(),
  period: varchar('period', { length: 50 }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  actor: varchar('actor', { length: 255 }),
  team: varchar('team', { length: 255 }),
  message: varchar('message', { length: 1000 }),
  metadata: jsonb('metadata'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Relations
 */
export const matchesRelations = relations(matches, ({ many }) => ({
  commentary: many(commentary),
}));

export const commentaryRelations = relations(commentary, ({ one }) => ({
  match: one(matches, {
    fields: [commentary.matchId],
    references: [matches.id],
  }),
}));