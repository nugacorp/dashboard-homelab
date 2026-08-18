/**
 * /api/hermes - feature gated.
 *
 * With HERMES_ENABLED=false (the default) both endpoints report `disabled`.
 * The chat endpoint never synthesises an answer: no upstream, no reply.
 */
import { Router } from 'express';
import { z } from 'zod';
import type { HermesStatusDto } from '../../shared/api.js';
import type { ServerContext } from '../context.js';
import { UpstreamError } from '../errors.js';
import { disabled, ok, serve, unavailable } from '../respond.js';
import { MAX_MESSAGE_LENGTH } from '../services/hermes.js';

const DISABLED_MESSAGE = 'Hermes API no configurada. Set HERMES_ENABLED=true and HERMES_API_URL.';

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export function createHermesRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    if (!ctx.hermes) {
      // Report the flag state truthfully rather than an empty error.
      const payload: HermesStatusDto = {
        enabled: ctx.config.hermesEnabled,
        reachable: null,
        version: null,
      };
      if (!ctx.config.hermesEnabled) return disabled(res, 'hermes', DISABLED_MESSAGE);
      return ok(res, 'hermes', payload);
    }
    return void serve(res, 'hermes', ctx.logger, () => ctx.hermes!.getStatus());
  });

  router.post('/chat', (req, res) => {
    if (!ctx.hermes) return disabled(res, 'hermes', DISABLED_MESSAGE);

    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: 'unavailable',
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message: `message must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters.`,
        },
        fetchedAt: new Date().toISOString(),
        source: 'hermes',
      });
      return;
    }

    void (async () => {
      try {
        ok(res, 'hermes', await ctx.hermes!.chat(parsed.data.message));
      } catch (err) {
        if (err instanceof UpstreamError) {
          ctx.logger.warn('Hermes chat failed', { code: err.code });
          unavailable(res, 'hermes', err);
          return;
        }
        ctx.logger.error('Hermes chat crashed', {
          error: err instanceof Error ? err.name : String(err),
        });
        unavailable(
          res,
          'hermes',
          new UpstreamError('UPSTREAM_UNREACHABLE', 'Hermes request failed unexpectedly.'),
        );
      }
    })();
  });

  return router;
}
