/**
 * The state machine every card and page renders against.
 *
 * The point is to keep five situations distinguishable, because collapsing them
 * is exactly how a dashboard starts lying:
 *
 *   loading         we do not know yet
 *   ok              real data arrived
 *   empty           real data arrived and there is genuinely nothing (0 !== unknown)
 *   not_configured  the integration was never set up
 *   disabled        the integration exists but is switched off by a flag
 *   error           configured, but the last attempt failed
 *
 * A refresh that fails while we already hold good data does NOT wipe the view:
 * the previous data stays on screen and is flagged `stale`.
 *
 * Two transports share this machinery:
 *
 *   useResource     for /api endpoints that answer with an ApiEnvelope
 *   useRawResource  for /api endpoints that answer with a plain DTO
 *
 * That split is not cosmetic. `/api/health/ready` returns a raw ReadyResponse
 * whose own `status` field means something completely different from an
 * envelope's `status`, so feeding it through the envelope client produced a
 * "formato inesperado" error on a perfectly healthy backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError, IntegrationKey } from '@shared/api';
import { apiGet, apiGetRawResult } from '../services/api/client';

export type ResourcePhase = 'loading' | 'ok' | 'empty' | 'not_configured' | 'disabled' | 'error';

export interface Resource<T> {
  phase: ResourcePhase;
  data: T | null;
  error: ApiError | null;
  /** ISO-8601 of the last *successful* load. */
  fetchedAt: string | null;
  /** True when the newest attempt failed but we are still showing older data. */
  stale: boolean;
  refresh: () => void;
}

export interface UseResourceOptions<T> {
  /** Poll interval in ms. Omit or set to 0 to load once. */
  pollMs?: number;
  /** Lets a caller declare what "there is nothing here" means for this payload. */
  isEmpty?: (data: T) => boolean;
  /** Skip fetching entirely (e.g. while unauthenticated). */
  enabled?: boolean;
}

/**
 * What one attempt concluded, independent of transport. Both hooks below
 * normalise onto this so the polling, staleness and phase logic exists once.
 */
type Outcome<T> =
  | { kind: 'data'; data: T; fetchedAt: string }
  | { kind: 'state'; phase: 'not_configured' | 'disabled'; error: ApiError | null }
  | { kind: 'failure'; error: ApiError | null };

function usePolledResource<T>(
  /** Identity of the request; changing it restarts the effect. */
  key: string,
  load: (signal: AbortSignal) => Promise<Outcome<T>>,
  options: UseResourceOptions<T>,
): Resource<T> {
  const { pollMs = 0, isEmpty, enabled = true } = options;

  const [phase, setPhase] = useState<ResourcePhase>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Read the latest closures inside the effect without making them deps.
  const dataRef = useRef<T | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      let outcome: Outcome<T>;
      try {
        outcome = await loadRef.current(controller.signal);
      } catch {
        return; // aborted
      }
      if (cancelled) return;

      if (outcome.kind === 'data') {
        const empty = isEmptyRef.current?.(outcome.data) ?? false;
        dataRef.current = outcome.data;
        setData(outcome.data);
        setError(null);
        setFetchedAt(outcome.fetchedAt);
        setStale(false);
        setPhase(empty ? 'empty' : 'ok');
        return;
      }

      if (outcome.kind === 'state') {
        dataRef.current = null;
        setData(null);
        setError(outcome.error);
        setStale(false);
        setPhase(outcome.phase);
        return;
      }

      setError(outcome.error);
      if (dataRef.current !== null) {
        // Keep the last good view rather than blanking it on one bad poll.
        setStale(true);
        setPhase('ok');
      } else {
        setPhase('error');
      }
    };

    void run();
    const timer = pollMs > 0 ? window.setInterval(() => void run(), pollMs) : null;

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearInterval(timer);
    };
  }, [key, pollMs, enabled, nonce]);

  return { phase, data, error, fetchedAt, stale, refresh };
}

/** For endpoints that answer with an ApiEnvelope. */
export function useResource<T>(
  path: string,
  source: IntegrationKey | 'nugaOps',
  options: UseResourceOptions<T> = {},
): Resource<T> {
  const load = async (signal: AbortSignal): Promise<Outcome<T>> => {
    const envelope = await apiGet<T>(path, source, signal);

    if (envelope.status === 'ok' && envelope.data !== null) {
      return { kind: 'data', data: envelope.data, fetchedAt: envelope.fetchedAt };
    }
    if (envelope.status === 'not_configured' || envelope.status === 'disabled') {
      return { kind: 'state', phase: envelope.status, error: envelope.error };
    }
    return { kind: 'failure', error: envelope.error };
  };

  return usePolledResource<T>(`envelope:${source}:${path}`, load, options);
}

/**
 * For endpoints that answer with a plain DTO rather than an envelope:
 * `/health/ready`, `/health/live`, `/auth/session`.
 *
 * These have no not_configured / disabled states — that information lives
 * inside the payload — so the phase set here is loading / ok / empty / error.
 * `fetchedAt` is stamped client-side on success, because a raw payload carries
 * no server timestamp.
 */
export function useRawResource<T>(
  path: string,
  options: UseResourceOptions<T> = {},
): Resource<T> {
  const load = async (signal: AbortSignal): Promise<Outcome<T>> => {
    const result = await apiGetRawResult<T>(path, signal);
    return result.ok
      ? { kind: 'data', data: result.data, fetchedAt: new Date().toISOString() }
      : { kind: 'failure', error: result.error };
  };

  return usePolledResource<T>(`raw:${path}`, load, options);
}
