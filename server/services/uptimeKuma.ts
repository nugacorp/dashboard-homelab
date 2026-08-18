/**
 * Uptime Kuma - reachability only.
 *
 * Uptime Kuma 2.x has no stable, documented REST API for monitor state; the
 * data the UI shows travels over an internal socket.io channel, and /metrics is
 * behind an API key. Scraping either would be a reverse-engineered dependency
 * that breaks on upgrade, so v1 deliberately does two small honest things:
 *
 *   1. reports whether the instance answers HTTP at all, and
 *   2. hands the frontend the URL so it can render a link.
 *
 * The dashboard never claims to know how many monitors are up.
 */
import type { UptimeKumaStatusDto } from '../../shared/api.js';
import { probe, type ProbeResult } from '../http.js';

export class UptimeKumaService {
  readonly #url: string;
  readonly #timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    this.#url = url;
    this.#timeoutMs = timeoutMs;
  }

  async probe(): Promise<ProbeResult> {
    return probe(this.#url, this.#timeoutMs);
  }

  async getStatus(): Promise<UptimeKumaStatusDto> {
    const result = await this.probe();
    return {
      url: this.#url,
      reachable: result.reachable,
      httpStatus: result.httpStatus,
    };
  }
}
