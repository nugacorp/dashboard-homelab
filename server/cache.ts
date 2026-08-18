/**
 * Tiny in-memory TTL cache with request coalescing.
 *
 * Several dashboard cards poll the same upstream data. Without this, one open
 * browser tab would translate into a handful of Proxmox API calls per refresh
 * cycle. Entries are per-process and disappear on restart, which is exactly
 * what we want: no database, no stale state across deploys.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  #entries = new Map<string, Entry<unknown>>();
  #inflight = new Map<string, Promise<unknown>>();
  #ttlMs: number;

  constructor(ttlMs: number) {
    this.#ttlMs = ttlMs;
  }

  /**
   * Returns the cached value, or runs `producer` once for concurrent callers.
   * Failures are never cached, so a transient upstream error does not pin the
   * dashboard to an error state for the whole TTL.
   */
  async get<T>(key: string, producer: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.#entries.get(key);
    if (hit && hit.expiresAt > now) return hit.value as T;

    const pending = this.#inflight.get(key);
    if (pending) return pending as Promise<T>;

    const task = producer()
      .then((value) => {
        this.#entries.set(key, { value, expiresAt: Date.now() + this.#ttlMs });
        return value;
      })
      .finally(() => {
        this.#inflight.delete(key);
      });

    this.#inflight.set(key, task);
    return task;
  }

  clear(): void {
    this.#entries.clear();
  }
}
