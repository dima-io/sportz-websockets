import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcject_key = process.env.ARCJET_KEY
const arcject_mode = process.env.ARCJET_ENV === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE'

if(!arcject_key) throw new Error("ARCJECT_KEY environment variable is missing")

export const httpArcject = arcject_key ? 
    arcjet({
        key: arcject_key,
        rules: [
            shield({mode: arcject_mode }),
            detectBot({mode: arcject_mode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({mode: arcject_mode, interval: '10s', max: 50})
        ]
    }) : null


export const wsArcjet = arcject_key ? 
    arcjet({
        key: arcject_key,
        rules: [
            shield({mode: arcject_mode }),
            detectBot({mode: arcject_mode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({mode: arcject_mode, interval: '2s', max: 5})
        ]
    }) : null   


  export function securityMiddleware() {
    return async (req, res, next) => {
        if(!httpArcject) return next();

        try {
            const decision = await httpArcject.protect(req)

            if(decision.isDenied()) {
                if(decision.reason.isRateLimit()) {
                    return res.status(429).json({error: 'Too many requests'})
                }

                return res.status(403).json({error: 'Forbidden'})
            }

        } catch(e) {
            console.log('Arcject middleware error', e)
            return res.status(503).json({ error: 'Service unavailable'})
        }

        next();
    }
  }  