import { Router } from 'express';
import type { ApiEnvelope, UnifiSummaryDto } from '../../shared/api.js';
import { TtlCache } from '../cache.js';
import type { ServerContext } from '../context.js';
import { UpstreamError } from '../errors.js';

const CACHE_TTL_MS = 10_000;

export function createUnifiRouter(ctx: ServerContext): Router {
  const router = Router();
  const cache = new TtlCache(CACHE_TTL_MS);

  router.get('/summary', (_req, res) => {
    void (async () => {
      if (!ctx.unifi) {
        const body: ApiEnvelope<UnifiSummaryDto> = {
          status: 'not_configured',
          data: null,
          error: null,
          fetchedAt: new Date().toISOString(),
          source: 'nugaOps',
        };

        res.status(200).json(body);
        return;
      }

      try {
        const data = await cache.get(
          'unifi-summary',
          () => ctx.unifi!.getSummary(),
        );

        const body: ApiEnvelope<UnifiSummaryDto> = {
          status: 'ok',
          data,
          error: null,
          fetchedAt: new Date().toISOString(),
          source: 'nugaOps',
        };

        res.status(200).json(body);
      } catch (error) {
        const apiError =
          error instanceof UpstreamError
            ? error.toApiError()
            : {
                code: 'UNIFI_QUERY_FAILED',
                message: 'No se pudo consultar UniFi Network.',
              };

        const body: ApiEnvelope<UnifiSummaryDto> = {
          status: 'unavailable',
          data: null,
          error: apiError,
          fetchedAt: new Date().toISOString(),
          source: 'nugaOps',
        };

        res.status(200).json(body);
      }
    })();
  });

  return router;
}
