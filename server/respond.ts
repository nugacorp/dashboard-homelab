/**
 * Envelope helpers shared by every data route.
 *
 * Two rules encoded here:
 *
 *  1. A failing upstream never becomes a 500. It becomes a 503 carrying a typed
 *     envelope, so one dead integration cannot take the dashboard down.
 *  2. "Not configured" is a successful answer (HTTP 200) about our own state,
 *     not an error. The frontend distinguishes the two on `status`, and reads
 *     the body regardless of the HTTP code.
 */
import type { Response } from 'express';
import type { ApiEnvelope, IntegrationKey, NotEnabledResponse } from '../shared/api.js';
import { UpstreamError } from './errors.js';
import type { Logger } from './logger.js';

type Source = IntegrationKey | 'nugaOps';

export function ok<T>(res: Response, source: Source, data: T): void {
  const body: ApiEnvelope<T> = {
    status: 'ok',
    data,
    error: null,
    fetchedAt: new Date().toISOString(),
    source,
  };
  res.status(200).json(body);
}

export function notConfigured<T>(res: Response, source: Source, message: string): void {
  const body: ApiEnvelope<T> = {
    status: 'not_configured',
    data: null,
    error: { code: 'NOT_CONFIGURED', message },
    fetchedAt: new Date().toISOString(),
    source,
  };
  res.status(200).json(body);
}

export function disabled<T>(res: Response, source: Source, message: string): void {
  const body: ApiEnvelope<T> = {
    status: 'disabled',
    data: null,
    error: { code: 'DISABLED', message },
    fetchedAt: new Date().toISOString(),
    source,
  };
  res.status(200).json(body);
}

export function unavailable<T>(res: Response, source: Source, error: UpstreamError): void {
  const body: ApiEnvelope<T> = {
    status: 'unavailable',
    data: null,
    error: error.toApiError(),
    fetchedAt: new Date().toISOString(),
    source,
  };
  res.status(503).json(body);
}

/**
 * Runs a data producer and maps any failure onto the envelope. Unknown errors
 * are logged in full server-side but reported generically to the browser.
 */
export async function serve<T>(
  res: Response,
  source: Source,
  logger: Logger,
  producer: () => Promise<T>,
): Promise<void> {
  try {
    ok(res, source, await producer());
  } catch (err) {
    if (err instanceof UpstreamError) {
      logger.warn('Upstream request failed', { source, code: err.code, message: err.message });
      unavailable(res, source, err);
      return;
    }
    logger.error('Unhandled integration error', {
      source,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
    unavailable(
      res,
      source,
      new UpstreamError('UPSTREAM_UNREACHABLE', 'The integration failed unexpectedly.'),
    );
  }
}

/**
 * Answer for every mutating endpoint in v1. Returning 403 with an explicit code
 * is the whole point: the UI must be unable to mistake this for success.
 */
export function notEnabled(res: Response, message: string): void {
  const body: NotEnabledResponse = {
    status: 'not_enabled',
    error: { code: 'NOT_ENABLED', message },
  };
  res.status(403).json(body);
}
