/**
 * /api/hermes
 *
 * Feature-gated backend proxy for Hermes Agent.
 * No Hermes credential is ever accepted from or returned to the browser.
 */

import { Router } from 'express';
import { z } from 'zod';
import type {
  HermesModelsDto,
  HermesStatusDto,
} from '../../shared/api.js';
import type { ServerContext } from '../context.js';
import {
  disabled,
  ok,
  serve,
} from '../respond.js';
import { MAX_MESSAGE_LENGTH } from '../services/hermes.js';

const DISABLED_MESSAGE =
  'Hermes API no configurada. Set HERMES_ENABLED=true, HERMES_API_URL and HERMES_API_KEY.';

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

function emptyStatus(enabled: boolean): HermesStatusDto {
  return {
    enabled,
    reachable: null,
    version: null,
    platform: null,
    gatewayState: null,
    provider: null,
    model: null,
    connectedPlatforms: [],
    activeAgents: null,
    gatewayBusy: null,
  };
}

export function createHermesRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    if (!ctx.hermes) {
      if (!ctx.config.hermesEnabled) {
        return disabled<HermesStatusDto>(
          res,
          'hermes',
          DISABLED_MESSAGE,
        );
      }

      return ok(
        res,
        'hermes',
        emptyStatus(true),
      );
    }

    return void serve(
      res,
      'hermes',
      ctx.logger,
      () => ctx.hermes!.getStatus(),
    );
  });

  router.get('/models', (_req, res) => {
    if (!ctx.hermes) {
      return disabled<HermesModelsDto>(
        res,
        'hermes',
        DISABLED_MESSAGE,
      );
    }

    return void serve(
      res,
      'hermes',
      ctx.logger,
      () => ctx.hermes!.getModels(),
    );
  });

  router.post('/chat', (req, res) => {
    if (!ctx.hermes) {
      return disabled(
        res,
        'hermes',
        DISABLED_MESSAGE,
      );
    }

    const parsed = chatRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: 'unavailable',
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message:
            `message must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters.`,
        },
        fetchedAt: new Date().toISOString(),
        source: 'hermes',
      });

      return;
    }

    return void serve(
      res,
      'hermes',
      ctx.logger,
      () => ctx.hermes!.chat(parsed.data.message),
    );
  });

  return router;
}
