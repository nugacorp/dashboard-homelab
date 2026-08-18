/**
 * Test helpers: spin up the real Express app, and stand in for upstreams with a
 * plain HTTP server. Nothing is mocked at the module level, so these exercise
 * the actual routing, validation and normalisation code.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createApp } from '../../server/app.js';
import { loadConfig } from '../../server/config.js';
import { createContext } from '../../server/context.js';
import { createLogger } from '../../server/logger.js';

export interface RunningApp {
  baseUrl: string;
  close: () => Promise<void>;
}

/** Boots the dashboard backend on an ephemeral port with the given env. */
export async function startApp(env: NodeJS.ProcessEnv): Promise<RunningApp> {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'error', ...env });
  const ctx = createContext(config, createLogger('error'));
  const app = createApp(ctx);

  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('no address');

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export type Handler = (req: IncomingMessage, res: ServerResponse) => void;

export interface FakeUpstream {
  url: string;
  /** Paths that were requested, in order. Useful to assert we only ever GET. */
  requests: Array<{ method: string; url: string; authorization: string | undefined }>;
  close: () => Promise<void>;
}

/** A stand-in upstream that answers from a path -> JSON map. */
export async function startFakeUpstream(
  routes: Record<string, unknown>,
  options: { status?: number } = {},
): Promise<FakeUpstream> {
  const requests: FakeUpstream['requests'] = [];

  const server = createServer((req, res) => {
    requests.push({
      method: req.method ?? 'GET',
      url: req.url ?? '',
      authorization: req.headers.authorization,
    });

    const key = req.url ?? '';
    const payload = routes[key];
    if (payload === undefined) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found', path: key }));
      return;
    }
    res.writeHead(options.status ?? 200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(payload));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('no address');

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** An upstream that always answers with the given status and no useful body. */
export async function startFailingUpstream(status: number): Promise<FakeUpstream> {
  const requests: FakeUpstream['requests'] = [];
  const server = createServer((req, res) => {
    requests.push({
      method: req.method ?? 'GET',
      url: req.url ?? '',
      authorization: req.headers.authorization,
    });
    res.writeHead(status, { 'content-type': 'application/json' });
    // Deliberately include a secret-looking string to prove we never echo bodies.
    res.end(JSON.stringify({ error: 'upstream detail', leaked: 'SHOULD-NEVER-APPEAR' }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('no address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
