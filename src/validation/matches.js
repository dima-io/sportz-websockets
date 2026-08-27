import { z } from 'zod';

/**
 * Canonical match status values (lowercase), mirroring the `match_status`
 * Postgres enum defined in src/db/schema.js.
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

/**
 * Query params for GET /matches (list endpoint).
 * `limit` is optional; when provided it is coerced to a number,
 * must be a positive integer, and capped at 100.
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

/**
 * Path params for routes like GET /matches/:id.
 * `id` is required and coerced to a positive integer.
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Body schema for POST /matches (create a match).
 */
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'sport must be a non-empty string'),
    homeTeam: z.string().min(1, 'homeTeam must be a non-empty string'),
    awayTeam: z.string().min(1, 'awayTeam must be a non-empty string'),
    startTime: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'startTime must be a valid ISO date string',
      }),
    endTime: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'endTime must be a valid ISO date string',
      }),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (Date.parse(data.endTime) <= Date.parse(data.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be chronologically after startTime',
        path: ['endTime'],
      });
    }
  });

/**
 * Body schema for updating a match's score, e.g. PATCH /matches/:id/score.
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});