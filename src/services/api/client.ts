/**
 * The only way the frontend talks to anything.
 *
 * Every request is same-origin against /api. The browser never contacts a LAN
 * address, never holds a token, and never learns an upstream URL other than the
 * ones the backend explicitly hands over (e.g. the Uptime Kuma link).
 */
import type { ApiEnvelope, IntegrationKey } from '@shared/api';

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

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
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

/** Plain JSON GET for endpoints that are not envelope-shaped (health, session). */
export async function apiGetRaw<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(`/api${path}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      ...(signal ? { signal } : {}),
    });
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT));
      return null;
    }
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return null;
  }
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
