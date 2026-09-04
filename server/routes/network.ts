import { Router } from 'express';
import type { ApiEnvelope, NetworkStatusDto } from '../../shared/api.js';
import type { ServerContext } from '../context.js';
import { TtlCache } from '../cache.js';

const CACHE_TTL_MS = 10_000;

export function createNetworkRouter(ctx: ServerContext): Router {
  const router = Router();
  const cache = new TtlCache(CACHE_TTL_MS);

  router.get('/status', (_req, res) => {
    void (async () => {
      if (!ctx.network) {
        const body: ApiEnvelope<NetworkStatusDto> = {
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
          'network-status',
          () => ctx.network!.getStatus(),
        );

        const body: ApiEnvelope<NetworkStatusDto> = {
          status: 'ok',
          data,
          error: null,
          fetchedAt: new Date().toISOString(),
          source: 'nugaOps',
        };

        res.status(200).json(body);
      } catch {
        const body: ApiEnvelope<NetworkStatusDto> = {
          status: 'unavailable',
          data: null,
          error: {
            code: 'NETWORK_PROBE_FAILED',
            message: 'No se pudo obtener el estado de red local.',
          },
          fetchedAt: new Date().toISOString(),
          source: 'nugaOps',
        };

        res.status(200).json(body);
      }
    })();
  });

  return router;
}
