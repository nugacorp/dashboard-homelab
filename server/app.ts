/**
 * Express application factory.
 *
 * Kept separate from index.ts so tests can build an app without binding a port
 * or reading the real environment.
 *
 * Security posture:
 *  - Same-origin by design. The SPA is served by this very process, so there is
 *    no CORS middleware and no `Access-Control-Allow-Origin: *`.
 *  - JSON bodies are size-capped.
 *  - Secrets never leave the process: routes expose configuration *presence*.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ServerContext } from './context.js';
import { createAuthGuard, createAuthRouter } from './routes/auth.js';
import { createHealthRouter } from './routes/health.js';
import { createHermesRouter } from './routes/hermes.js';
import { createHomeAssistantRouter } from './routes/homeAssistant.js';
import { createLogsRouter } from './routes/logs.js';
import { createProxmoxRouter } from './routes/proxmox.js';
import { createUptimeKumaRouter } from './routes/uptimeKuma.js';

/** Where the built SPA lives relative to the compiled server (dist/server -> dist/web). */
function resolveWebDir(ctx: ServerContext): string | null {
  if (ctx.config.webDistDir) return ctx.config.webDistDir;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../web'), // dist/server/app.js -> dist/web
    path.resolve(here, '../dist/web'), // running from source via tsx
  ];
  return candidates.find((c) => existsSync(path.join(c, 'index.html'))) ?? null;
}

export function createApp(ctx: ServerContext): Express {
  const app = express();

  app.disable('x-powered-by');
  if (ctx.config.trustProxy) app.set('trust proxy', 1);

  app.use(express.json({ limit: '64kb' }));

  // Baseline hardening. No external helmet dependency for a handful of headers.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
  });

  // Request log: method, path and status only. Query strings are omitted on
  // purpose so a token accidentally placed in a URL is never written to disk.
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      ctx.logger.debug('request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - started,
      });
    });
    next();
  });

  const api = express.Router();
  api.use(createAuthGuard(ctx));
  api.use('/health', createHealthRouter(ctx));
  api.use('/auth', createAuthRouter(ctx));
  api.use('/proxmox', createProxmoxRouter(ctx));
  api.use('/home-assistant', createHomeAssistantRouter(ctx));
  api.use('/hermes', createHermesRouter(ctx));
  api.use('/uptime-kuma', createUptimeKumaRouter(ctx));
  api.use('/logs', createLogsRouter(ctx));

  api.use((_req, res) => {
    res.status(404).json({
      status: 'unavailable',
      data: null,
      error: { code: 'NOT_FOUND', message: 'Unknown API endpoint.' },
      fetchedAt: new Date().toISOString(),
      source: 'nugaOps',
    });
  });

  app.use('/api', api);

  const webDir = resolveWebDir(ctx);
  if (webDir) {
    app.use(
      express.static(webDir, {
        index: false,
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          // The HTML shell must never be cached, or a deploy leaves clients on
          // an old bundle that references deleted asset hashes.
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store');
        },
      }),
    );
    // SPA fallback for client-side navigation. /api is already handled above.
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(path.join(webDir, 'index.html'));
    });
  } else {
    ctx.logger.warn('No built frontend found; serving the API only. Run `npm run build:web`.');
  }

  // Terminal error handler: log the detail, return something generic.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    ctx.logger.error('Unhandled request error', {
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
    if (res.headersSent) return;
    res.status(500).json({
      status: 'unavailable',
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
      fetchedAt: new Date().toISOString(),
      source: 'nugaOps',
    });
  });

  return app;
}
