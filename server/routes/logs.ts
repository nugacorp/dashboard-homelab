/**
 * /api/logs
 *
 * Recent NUGA HOME application events only.
 *
 * This does not read Docker, journald or arbitrary host files. Entries are
 * already redacted by the application logger before they reach this route.
 */

import { Router } from 'express';
import type { NugaLogLevel } from '../../shared/api.js';
import type { ServerContext } from '../context.js';

const LEVELS = new Set<NugaLogLevel>([
  'debug',
  'info',
  'warn',
  'error',
]);

export function createLogsRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const requestedLevel =
      typeof req.query.level === 'string'
        ? req.query.level.toLowerCase()
        : null;

    const requestedLimit =
      typeof req.query.limit === 'string'
        ? Number(req.query.limit)
        : 250;

    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(500, Math.floor(requestedLimit))
        : 250;

    let entries = ctx.logger.entries();

    if (
      requestedLevel &&
      LEVELS.has(requestedLevel as NugaLogLevel)
    ) {
      entries = entries.filter(
        (entry) => entry.level === requestedLevel,
      );
    }

    entries = entries.slice(-limit);

    res.json({
      status: 'ok',
      data: entries,
      error: null,
      fetchedAt: new Date().toISOString(),
      source: 'nugaOps',
    });
  });

  return router;
}
