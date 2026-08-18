/**
 * Liveness and readiness.
 *
 * /api/health/live is a pure process check: it never touches an upstream, so a
 * dead Proxmox can never make Docker restart a perfectly healthy container.
 *
 * /api/health/ready probes each configured integration, with the results cached
 * for a few seconds so that polling the endpoint cannot amplify into a burst of
 * upstream traffic. It reports presence and reachability only - never a token.
 */
import { Router } from 'express';
import type {
  IntegrationHealth,
  IntegrationKey,
  LiveResponse,
  ReadyResponse,
} from '../../shared/api.js';
import { TtlCache } from '../cache.js';
import { APP_VERSION } from '../config.js';
import type { ServerContext } from '../context.js';

const PROBE_CACHE_TTL_MS = 10_000;

function notConfiguredHealth(detail: string): IntegrationHealth {
  return { state: 'not_configured', detail, checkedAt: null, latencyMs: null };
}

export function createHealthRouter(ctx: ServerContext): Router {
  const router = Router();
  const cache = new TtlCache(PROBE_CACHE_TTL_MS);

  router.get('/live', (_req, res) => {
    const body: LiveResponse = {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - ctx.startedAt) / 1000),
    };
    res.status(200).json(body);
  });

  router.get('/ready', (_req, res) => {
    void (async () => {
      const integrations = await cache.get('integrations', () => probeAll(ctx));
      const degraded = Object.values(integrations).some((i) => i.state === 'unavailable');
      const body: ReadyResponse = {
        status: degraded ? 'degraded' : 'ok',
        version: APP_VERSION,
        uptimeSeconds: Math.floor((Date.now() - ctx.startedAt) / 1000),
        auth: ctx.config.auth ? 'enabled' : 'disabled',
        integrations,
      };
      // 200 even when degraded: the dashboard process is ready to serve; a
      // broken upstream is information, not a reason to fail the container.
      res.status(200).json(body);
    })();
  });

  return router;
}

async function probeAll(ctx: ServerContext): Promise<Record<IntegrationKey, IntegrationHealth>> {
  const now = () => new Date().toISOString();

  const proxmox = async (): Promise<IntegrationHealth> => {
    if (!ctx.proxmox) {
      return notConfiguredHealth('Set PVE_API_URL, PVE_TOKEN_ID and PVE_TOKEN_SECRET.');
    }
    const started = Date.now();
    try {
      const { version } = await ctx.proxmox.checkAccess();
      return {
        state: 'ok',
        detail: version ? `Proxmox VE ${version}` : 'API token accepted',
        checkedAt: now(),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      return {
        state: 'unavailable',
        detail: err instanceof Error ? err.message : 'Unknown failure',
        checkedAt: now(),
        latencyMs: Date.now() - started,
      };
    }
  };

  const homeAssistant = async (): Promise<IntegrationHealth> => {
    if (!ctx.homeAssistant) return notConfiguredHealth('Set HASS_URL and HASS_TOKEN.');
    const started = Date.now();
    try {
      const { version } = await ctx.homeAssistant.checkAccess();
      return {
        state: 'ok',
        detail: version ? `Home Assistant ${version}` : 'Token accepted',
        checkedAt: now(),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      return {
        state: 'unavailable',
        detail: err instanceof Error ? err.message : 'Unknown failure',
        checkedAt: now(),
        latencyMs: Date.now() - started,
      };
    }
  };

  const hermes = async (): Promise<IntegrationHealth> => {
    if (!ctx.config.hermesEnabled) {
      return {
        state: 'disabled',
        detail: 'HERMES_ENABLED is false.',
        checkedAt: null,
        latencyMs: null,
      };
    }
    if (!ctx.hermes) return notConfiguredHealth('HERMES_ENABLED is true but HERMES_API_URL is unset.');
    const result = await ctx.hermes.probe();
    return {
      state: result.reachable ? 'ok' : 'unavailable',
      detail: result.reachable ? 'Hermes responded' : 'Hermes did not respond',
      checkedAt: now(),
      latencyMs: result.latencyMs,
    };
  };

  const uptimeKuma = async (): Promise<IntegrationHealth> => {
    if (!ctx.uptimeKuma) return notConfiguredHealth('Set UPTIME_KUMA_URL.');
    const result = await ctx.uptimeKuma.probe();
    return {
      state: result.reachable ? 'ok' : 'unavailable',
      detail: result.reachable
        ? `Responded with HTTP ${result.httpStatus}`
        : 'No HTTP response',
      checkedAt: now(),
      latencyMs: result.latencyMs,
    };
  };

  const [p, h, he, u] = await Promise.all([proxmox(), homeAssistant(), hermes(), uptimeKuma()]);
  return { proxmox: p, homeAssistant: h, hermes: he, uptimeKuma: u };
}
