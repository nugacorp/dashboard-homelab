/**
 * /api/uptime-kuma - reachability + link target.
 *
 * See services/uptimeKuma.ts for why monitor data is deliberately not scraped.
 */
import { Router } from 'express';
import type { ServerContext } from '../context.js';
import { notConfigured, serve } from '../respond.js';

const NOT_CONFIGURED_MESSAGE =
  'Uptime Kuma is not configured. Set UPTIME_KUMA_URL to its LAN address.';

export function createUptimeKumaRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    if (!ctx.uptimeKuma) return notConfigured(res, 'uptimeKuma', NOT_CONFIGURED_MESSAGE);
    return void serve(res, 'uptimeKuma', ctx.logger, () => ctx.uptimeKuma!.getStatus());
  });

  return router;
}
