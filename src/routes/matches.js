import { createMany, desc } from 'drizzle-orm';
import { Router } from 'express';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/match-status.js'

const matchesRoutes = Router();

const MAX_LIMIT = 100;

matchesRoutes.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

   if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
   }

   const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

   try {
    const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);
    return res.status(200).json({ data });
   } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
   }
});

matchesRoutes.post('/', async (req, res) => {
    const parse = createMatchSchema.safeParse(req.body);

    if (!parse.success) {
        return res.status(400).json({ error: parse.error.message });
    }

    const { startTime, endTime, homeScore, awayScore } = parse.data;

    try {
        const [event] = await db.insert(matches).values({
            ...parse.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        console.log('broadcastMatchCreated exists?', typeof res.app.locals.broadcastMatchCreated)

        if (res.app.locals.broadcastMatchCreated) {
            console.log('broadcast called');
            res.app.locals.broadcastMatchCreated(event)
        }

        res.status(201).json({ data: event });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default matchesRoutes;
