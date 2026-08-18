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
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiEnvelope, ApiError, IntegrationKey } from '@shared/api';
import { apiGet } from '../services/api/client';

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

export function useResource<T>(
  path: string,
  source: IntegrationKey | 'nugaOps',
  options: UseResourceOptions<T> = {},
): Resource<T> {
  const { pollMs = 0, isEmpty, enabled = true } = options;

  const [phase, setPhase] = useState<ResourcePhase>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Read inside the effect without making them dependencies.
  const dataRef = useRef<T | null>(null);
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      let envelope: ApiEnvelope<T>;
      try {
        envelope = await apiGet<T>(path, source, controller.signal);
      } catch {
        return; // aborted
      }
      if (cancelled) return;

      if (envelope.status === 'ok' && envelope.data !== null) {
        const empty = isEmptyRef.current?.(envelope.data) ?? false;
        dataRef.current = envelope.data;
        setData(envelope.data);
        setError(null);
        setFetchedAt(envelope.fetchedAt);
        setStale(false);
        setPhase(empty ? 'empty' : 'ok');
        return;
      }

      if (envelope.status === 'not_configured' || envelope.status === 'disabled') {
        dataRef.current = null;
        setData(null);
        setError(envelope.error);
        setStale(false);
        setPhase(envelope.status);
        return;
      }

      // unavailable
      setError(envelope.error);
      if (dataRef.current !== null) {
        setStale(true);
        setPhase('ok');
      } else {
        setPhase('error');
      }
    };

    void load();
    const timer = pollMs > 0 ? window.setInterval(() => void load(), pollMs) : null;

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearInterval(timer);
    };
  }, [path, source, pollMs, enabled, nonce]);

  return { phase, data, error, fetchedAt, stale, refresh };
}
