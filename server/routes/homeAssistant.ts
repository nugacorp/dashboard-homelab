/**
 * /api/home-assistant - read-only surface.
 *
 * `POST /services/:domain/:service` exists solely to answer 403 NOT_ENABLED.
 * Home Assistant writes (lights, locks, climate, automations) are out of scope
 * for v1 and no code path in this process can perform one.
 */
import { Router } from 'express';
import type { ServerContext } from '../context.js';
import { notConfigured, notEnabled, serve } from '../respond.js';

const NOT_CONFIGURED_MESSAGE =
  'Home Assistant is not configured. Set HASS_URL and HASS_TOKEN.';

const READ_ONLY_MESSAGE =
  'Home Assistant control is not enabled in this release. NUGA HOME only reads entity states.';

/** Guards the optional ?domain= filter against absurd input. */
const DOMAIN_RE = /^[a-z_]{1,40}$/;

export function createHomeAssistantRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/summary', (_req, res) => {
    if (!ctx.homeAssistant) return notConfigured(res, 'homeAssistant', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'homeAssistant', ctx.logger, () => ctx.homeAssistant!.getSummary());
  });

  router.get('/entities', (req, res) => {
    if (!ctx.homeAssistant) return notConfigured(res, 'homeAssistant', NOT_CONFIGURED_MESSAGE);

    const rawDomain = req.query.domain;
    const domain = typeof rawDomain === 'string' && rawDomain.length > 0 ? rawDomain : null;
    if (domain !== null && !DOMAIN_RE.test(domain)) {
      res.status(400).json({
        status: 'unavailable',
        data: null,
        error: { code: 'BAD_REQUEST', message: 'Invalid domain filter.' },
        fetchedAt: new Date().toISOString(),
        source: 'homeAssistant',
      });
      return;
    }

    return void serve(res, 'homeAssistant', ctx.logger, async () => {
      const entities = await ctx.homeAssistant!.getEntities();
      return domain ? entities.filter((e) => e.domain === domain) : entities;
    });
  });

  router.post('/services/:domain/:service', (_req, res) => notEnabled(res, READ_ONLY_MESSAGE));

  return router;
}
