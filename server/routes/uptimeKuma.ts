/**
 * /api/uptime-kuma
 *
 * Kuma remains the monitoring engine. NUGA HOME consumes its Prometheus
 * endpoint server-side and exposes only normalised, non-secret DTOs.
 */

import { Router } from 'express';
import type { ServerContext } from '../context.js';
import { notConfigured, serve } from '../respond.js';

const NOT_CONFIGURED_MESSAGE =
  'Uptime Kuma is not configured. Set UPTIME_KUMA_URL to its LAN address.';

const METRICS_NOT_CONFIGURED_MESSAGE =
  'Uptime Kuma metrics are not configured. Set UPTIME_KUMA_API_KEY in the backend.';

export function createUptimeKumaRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    if (!ctx.uptimeKuma) {
      return notConfigured(res, 'uptimeKuma', NOT_CONFIGURED_MESSAGE);
    }

    return void serve(res, 'uptimeKuma', ctx.logger, () =>
      ctx.uptimeKuma!.getStatus(),
    );
  });

  router.get('/monitors', (_req, res) => {
    if (!ctx.uptimeKuma) {
      return notConfigured(res, 'uptimeKuma', NOT_CONFIGURED_MESSAGE);
    }

    if (!ctx.uptimeKuma.metricsConfigured) {
      return notConfigured(res, 'uptimeKuma', METRICS_NOT_CONFIGURED_MESSAGE);
    }

    return void serve(res, 'uptimeKuma', ctx.logger, () =>
      ctx.uptimeKuma!.getMonitors(),
    );
  });

  router.get('/summary', (_req, res) => {
    if (!ctx.uptimeKuma) {
      return notConfigured(res, 'uptimeKuma', NOT_CONFIGURED_MESSAGE);
    }

    if (!ctx.uptimeKuma.metricsConfigured) {
      return notConfigured(res, 'uptimeKuma', METRICS_NOT_CONFIGURED_MESSAGE);
    }

    return void serve(res, 'uptimeKuma', ctx.logger, () =>
      ctx.uptimeKuma!.getSummary(),
    );
  });

  return router;
}
