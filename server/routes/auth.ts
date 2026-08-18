/**
 * /api/auth - local single-user login.
 *
 * When no credentials are configured the dashboard runs in LAN-open mode:
 * /session reports `authRequired: false` and the guard middleware lets requests
 * through. That is a deliberate first-run affordance, and the server logs a
 * warning about it at boot.
 */
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { SessionResponse } from '../../shared/api.js';
import {
  createSessionToken,
  parseCookies,
  SESSION_COOKIE,
  verifyPassword,
  verifySessionToken,
  verifyUsername,
} from '../auth.js';
import type { ServerContext } from '../context.js';

const loginSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(512),
});

/** Naive fixed-window limiter, per source IP. Enough for a LAN login form. */
class LoginThrottle {
  #hits = new Map<string, { count: number; resetAt: number }>();
  readonly #limit: number;
  readonly #windowMs: number;

  constructor(limit = 10, windowMs = 5 * 60 * 1000) {
    this.#limit = limit;
    this.#windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.#hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.#hits.set(key, { count: 1, resetAt: now + this.#windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.#limit;
  }

  reset(key: string): void {
    this.#hits.delete(key);
  }
}

export function currentUser(req: Request, ctx: ServerContext): string | null {
  if (!ctx.config.auth) return null;
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE], ctx.config.auth.sessionSecret);
}

/**
 * Blocks unauthenticated API access when credentials are configured.
 * Health endpoints stay public so Docker and Uptime Kuma can reach them.
 */
export function createAuthGuard(ctx: ServerContext) {
  return function authGuard(req: Request, res: Response, next: NextFunction): void {
    if (!ctx.config.auth) return next();
    if (req.path.startsWith('/health') || req.path.startsWith('/auth')) return next();
    if (currentUser(req, ctx)) return next();

    res.status(401).json({
      status: 'unavailable',
      data: null,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      fetchedAt: new Date().toISOString(),
      source: 'nugaOps',
    });
  };
}

export function createAuthRouter(ctx: ServerContext): Router {
  const router = Router();
  const throttle = new LoginThrottle();

  router.get('/session', (req, res) => {
    const body: SessionResponse = {
      authenticated: ctx.config.auth ? currentUser(req, ctx) !== null : true,
      username: currentUser(req, ctx),
      authRequired: ctx.config.auth !== null,
    };
    res.status(200).json(body);
  });

  router.post('/login', (req, res) => {
    const auth = ctx.config.auth;
    if (!auth) {
      res.status(400).json({
        error: { code: 'AUTH_DISABLED', message: 'No dashboard credentials are configured.' },
      });
      return;
    }

    const key = req.ip ?? 'unknown';
    if (!throttle.check(key)) {
      ctx.logger.warn('Login throttled', { ip: key });
      res.status(429).json({
        error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Try again later.' },
      });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'username and password are required.' },
      });
      return;
    }

    const userOk = verifyUsername(parsed.data.username, auth.username);
    const passOk = verifyPassword(parsed.data.password, auth.passwordHash);
    if (!userOk || !passOk) {
      ctx.logger.warn('Failed login attempt', { ip: key });
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' },
      });
      return;
    }

    throttle.reset(key);
    const token = createSessionToken(auth.username, auth.sessionSecret, auth.ttlSeconds);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      // Only mark Secure behind TLS; on plain-HTTP LAN the browser would drop it.
      secure: req.protocol === 'https',
      path: '/',
      maxAge: auth.ttlSeconds * 1000,
    });
    ctx.logger.info('Login succeeded', { user: auth.username, ip: key });

    const body: SessionResponse = {
      authenticated: true,
      username: auth.username,
      authRequired: true,
    };
    res.status(200).json(body);
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    const body: SessionResponse = {
      authenticated: false,
      username: null,
      authRequired: ctx.config.auth !== null,
    };
    res.status(200).json(body);
  });

  return router;
}
