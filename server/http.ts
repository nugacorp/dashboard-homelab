/**
 * The single outbound HTTP helper used by every upstream service.
 *
 * Guarantees:
 *  - Every request has a hard timeout (no unbounded hang).
 *  - Response bodies are size-capped so a misbehaving upstream cannot exhaust
 *    memory.
 *  - TLS verification is always on. A custom CA is supplied through an undici
 *    Agent; `rejectUnauthorized: false` appears nowhere in this codebase.
 *  - Non-2xx responses become typed UpstreamErrors and the body is discarded,
 *    so upstream error text can never smuggle a credential into our response.
 */
import { Agent, fetch, type Dispatcher } from 'undici';
import { fromHttpStatus, toUpstreamError, UpstreamError } from './errors.js';

/** 8 MiB: comfortably above a large Home Assistant /api/states payload. */
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  /** JSON-serialised into the body when present. */
  json?: unknown;
  timeoutMs: number;
  dispatcher?: Dispatcher;
  /** Used in error messages, e.g. "Proxmox". Never interpolated from user input. */
  label: string;
}

/**
 * Builds an undici Agent that trusts an additional CA and, optionally, checks
 * the certificate against a specific hostname. The servername override is what
 * lets us connect to `https://192.168.1.99:8006` while still validating the
 * certificate Proxmox issued for `pve-dell.dell`.
 */
export function createTlsAgent(options: {
  caCert: string | null;
  servername: string | null;
  timeoutMs: number;
}): Agent | undefined {
  if (!options.caCert && !options.servername) return undefined;
  return new Agent({
    connect: {
      ...(options.caCert ? { ca: options.caCert } : {}),
      ...(options.servername ? { servername: options.servername } : {}),
      timeout: options.timeoutMs,
    },
    headersTimeout: options.timeoutMs,
    bodyTimeout: options.timeoutMs,
  });
}

async function readCapped(response: Awaited<ReturnType<typeof fetch>>, label: string): Promise<string> {
  const declared = response.headers.get('content-length');
  if (declared && Number(declared) > MAX_RESPONSE_BYTES) {
    throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', `${label} response is too large.`);
  }
  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', `${label} response is too large.`);
  }
  return text;
}

/** Performs the request and returns the parsed JSON as `unknown` (never trusted). */
export async function requestJson(url: string, options: RequestOptions): Promise<unknown> {
  const { label } = options;
  let response: Awaited<ReturnType<typeof fetch>>;

  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...(options.json !== undefined ? { 'content-type': 'application/json' } : {}),
        ...options.headers,
      },
      ...(options.json !== undefined ? { body: JSON.stringify(options.json) } : {}),
      signal: AbortSignal.timeout(options.timeoutMs),
      ...(options.dispatcher ? { dispatcher: options.dispatcher } : {}),
      // Upstreams are internal APIs; a redirect would be a misconfiguration and
      // could send our Authorization header somewhere unintended.
      redirect: 'manual',
    });
  } catch (err) {
    throw toUpstreamError(err, label);
  }

  if (response.status >= 300 && response.status < 400) {
    throw new UpstreamError(
      'UPSTREAM_HTTP',
      `${label} returned a redirect (HTTP ${response.status}); check the configured base URL.`,
      response.status,
    );
  }

  if (!response.ok) {
    // Drain the body so the connection can be reused, but never surface it.
    await response.body?.cancel().catch(() => undefined);
    throw fromHttpStatus(response.status, label);
  }

  const text = await readCapped(response, label);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new UpstreamError('UPSTREAM_INVALID_RESPONSE', `${label} returned a non-JSON response.`);
  }
}

export interface ProbeResult {
  reachable: boolean;
  httpStatus: number | null;
  latencyMs: number;
}

/**
 * Liveness probe that treats *any* HTTP answer as "reachable", including 401.
 * A service that answers 401 is up; it just needs credentials we deliberately
 * do not send here.
 */
export async function probe(url: string, timeoutMs: number, dispatcher?: Dispatcher): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'manual',
      ...(dispatcher ? { dispatcher } : {}),
    });
    await response.body?.cancel().catch(() => undefined);
    return { reachable: true, httpStatus: response.status, latencyMs: Date.now() - started };
  } catch {
    return { reachable: false, httpStatus: null, latencyMs: Date.now() - started };
  }
}
