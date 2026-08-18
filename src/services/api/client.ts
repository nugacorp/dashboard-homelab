/**
 * The only way the frontend talks to anything.
 *
 * Every request is same-origin against /api. The browser never contacts a LAN
 * address, never holds a token, and never learns an upstream URL other than the
 * ones the backend explicitly hands over (e.g. the Uptime Kuma link).
 */
import type { ApiEnvelope, ApiError, IntegrationKey } from '@shared/api';

/** Fired when the backend rejects a request for lack of a session. */
export const UNAUTHENTICATED_EVENT = 'nuga:unauthenticated';

function envelopeFor<T>(
  source: ApiEnvelope<T>['source'],
  code: string,
  message: string,
): ApiEnvelope<T> {
  return {
    status: 'unavailable',
    data: null,
    error: { code, message },
    fetchedAt: new Date().toISOString(),
    source,
  };
}

/**
 * Distinguishes an ApiEnvelope from a raw DTO.
 *
 * `status` alone is not enough to decide: `/api/health/ready` also has a
 * `status` field, and it means "ok | degraded", not an envelope state. The
 * presence of `data` and `source` is what actually identifies the wrapper.
 *
 * Exported so tests can assert the contract in both directions — a raw payload
 * must never satisfy this, and an envelope endpoint must always satisfy it.
 */
export function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'data' in value &&
    'source' in value
  );
}

/**
 * Performs a GET and always resolves with an envelope.
 *
 * The backend answers 200 for ok/not_configured/disabled and 503 for an
 * unavailable upstream, but the body carries the envelope in every case, so the
 * HTTP status is informational here rather than control flow.
 */
export async function apiGet<T>(
  path: string,
  source: IntegrationKey | 'nugaOps',
  signal?: AbortSignal,
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      ...(signal ? { signal } : {}),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return envelopeFor<T>(source, 'NETWORK_ERROR', 'No se pudo contactar con el backend de NUGA HOME.');
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT));
    return envelopeFor<T>(source, 'UNAUTHENTICATED', 'Sesión no iniciada.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return envelopeFor<T>(source, 'BAD_RESPONSE', 'El backend devolvió una respuesta ilegible.');
  }

  if (!isEnvelope(body)) {
    return envelopeFor<T>(source, 'BAD_RESPONSE', 'El backend devolvió un formato inesperado.');
  }
  return body as ApiEnvelope<T>;
}

/**
 * Result of a raw (non-envelope) GET.
 *
 * Unlike `apiGetRaw`, this keeps the reason for a failure, which the UI needs
 * in order to say something more useful than "no data".
 */
export type RawResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/**
 * Plain JSON GET for endpoints that deliberately answer with a DTO rather than
 * an envelope: `/health/live`, `/health/ready`, `/auth/session`.
 *
 * Do NOT route these through `apiGet`: their bodies are not envelopes, so the
 * envelope guard would reject a perfectly good response.
 */
export async function apiGetRawResult<T>(
  path: string,
  signal?: AbortSignal,
): Promise<RawResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      ...(signal ? { signal } : {}),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'No se pudo contactar con el backend de NUGA HOME.',
      },
    };
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT));
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Sesión no iniciada.' } };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: 'HTTP_ERROR',
        message: `El backend respondió con HTTP ${response.status}.`,
      },
    };
  }

  try {
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      error: { code: 'BAD_RESPONSE', message: 'El backend devolvió una respuesta ilegible.' },
    };
  }
}

/** Convenience wrapper for callers that only care whether it worked. */
export async function apiGetRaw<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const result = await apiGetRawResult<T>(path, signal);
  return result.ok ? result.data : null;
}

export interface PostResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage: string | null;
}

export async function apiPost<T>(path: string, payload?: unknown): Promise<PostResult<T>> {
  try {
    const response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      credentials: 'same-origin',
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    });

    if (response.status === 401) window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT));

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const errorMessage =
      !response.ok && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: { message?: string } }).error?.message ?? 'Error desconocido.')
        : null;

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? (body as T) : null,
      errorMessage,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: 'No se pudo contactar con el backend de NUGA HOME.',
    };
  }
}
