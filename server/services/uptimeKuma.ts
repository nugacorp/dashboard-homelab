/**
 * Uptime Kuma integration.
 *
 * /status remains a lightweight reachability probe.
 * /metrics is consumed only by the backend with a dedicated API key and is
 * normalised into DTOs owned by NUGA HOME before anything reaches the browser.
 */

import { fetch } from 'undici';
import type {
  UptimeKumaMonitorDto,
  UptimeKumaMonitorState,
  UptimeKumaStatusDto,
  UptimeKumaSummaryDto,
} from '../../shared/api.js';
import { probe, type ProbeResult } from '../http.js';

interface WorkingMonitor {
  id: string;
  name: string;
  type: string;
  target: string | null;
  statusCode: number | null;
  responseTimeMs: number | null;
  average1dMs: number | null;
  average30dMs: number | null;
  average365dMs: number | null;
  certificateValid: boolean | null;
  certificateDaysRemaining: number | null;
}

function parseLabels(raw: string): Record<string, string> {
  const labels: Record<string, string> = {};
  const re = /([A-Za-z_][A-Za-z0-9_]*)="((?:\\.|[^"\\])*)"/g;

  for (const match of raw.matchAll(re)) {
    const key = match[1];
    const encoded = match[2];

    if (!key || encoded === undefined) continue;

    try {
      labels[key] = JSON.parse(`"${encoded}"`) as string;
    } catch {
      labels[key] = encoded;
    }
  }

  return labels;
}

function stateFromCode(code: number | null): UptimeKumaMonitorState {
  switch (code) {
    case 0:
      return 'down';
    case 1:
      return 'up';
    case 2:
      return 'pending';
    case 3:
      return 'maintenance';
    default:
      return 'unknown';
  }
}

function secondsToMs(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  return value * 1000;
}

function currentResponseMs(value: number): number | null {
  // Push monitors currently export -1 because there is no probe latency.
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function targetFromLabels(
  labels: Record<string, string>,
  type: string,
): string | null {
  // PUSH targets may contain a secret push token, so they are never exposed.
  if (type === 'push') return null;

  const rawUrl = labels.monitor_url?.trim();

  if (rawUrl) {
    try {
      const url = new URL(rawUrl);

      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';

      return url.toString();
    } catch {
      // Some non-HTTP monitor types put a hostname rather than a URL here.
      // Fall through to the explicit hostname/port labels instead.
    }
  }

  const hostname = labels.monitor_hostname?.trim();

  const rawPort =
    labels.monitor_port?.trim();

  const port =
    rawPort &&
    rawPort.toLowerCase() !== 'null' &&
    rawPort.toLowerCase() !== 'undefined' &&
    rawPort !== '0'
      ? rawPort
      : null;

  if (!hostname) return null;

  const safeHost =
    hostname.includes(':') &&
    !hostname.startsWith('[')
      ? `[${hostname}]`
      : hostname;

  return port ? `${safeHost}:${port}` : safeHost;
}

export function parseUptimeKumaMetrics(text: string): UptimeKumaMonitorDto[] {
  const monitors = new Map<string, WorkingMonitor>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const match = line.match(
      /^([A-Za-z_:][A-Za-z0-9_:]*)\{(.*)\}\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/,
    );

    if (!match) continue;

    const metric = match[1];
    const labelsRaw = match[2];
    const valueRaw = match[3];

    if (!metric || labelsRaw === undefined || valueRaw === undefined) continue;

    const labels = parseLabels(labelsRaw);
    const id = labels.monitor_id;

    if (!id) continue;

    const value = Number(valueRaw);
    if (!Number.isFinite(value)) continue;

    let monitor = monitors.get(id);

    if (!monitor) {
      monitor = {
        id,
        name: labels.monitor_name ?? `Monitor ${id}`,
        type: labels.monitor_type ?? 'unknown',
        target: targetFromLabels(
          labels,
          labels.monitor_type ?? 'unknown',
        ),
        statusCode: null,
        responseTimeMs: null,
        average1dMs: null,
        average30dMs: null,
        average365dMs: null,
        certificateValid: null,
        certificateDaysRemaining: null,
      };
      monitors.set(id, monitor);
    }

    if (monitor.target === null) {
      monitor.target = targetFromLabels(labels, monitor.type);
    }

    switch (metric) {
      case 'monitor_status':
        monitor.statusCode = value;
        break;

      case 'monitor_response_time':
        monitor.responseTimeMs = currentResponseMs(value);
        break;

      case 'monitor_response_time_seconds':
        if (labels.window === '1d') {
          monitor.average1dMs = secondsToMs(value);
        } else if (labels.window === '30d') {
          monitor.average30dMs = secondsToMs(value);
        } else if (labels.window === '365d') {
          monitor.average365dMs = secondsToMs(value);
        }
        break;

      case 'monitor_cert_is_valid':
        monitor.certificateValid = value === 1;
        break;

      case 'monitor_cert_days_remaining':
        monitor.certificateDaysRemaining = value;
        break;
    }
  }

  return [...monitors.values()]
    .map(
      (monitor): UptimeKumaMonitorDto => ({
        id: monitor.id,
        name: monitor.name,
        type: monitor.type,
        state: stateFromCode(monitor.statusCode),
        target: monitor.target,
        responseTimeMs: monitor.responseTimeMs,
        average1dMs: monitor.average1dMs,
        average30dMs: monitor.average30dMs,
        average365dMs: monitor.average365dMs,
        certificateValid: monitor.certificateValid,
        certificateDaysRemaining: monitor.certificateDaysRemaining,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function summariseUptimeKumaMonitors(
  monitors: UptimeKumaMonitorDto[],
): UptimeKumaSummaryDto {
  const summary: UptimeKumaSummaryDto = {
    total: monitors.length,
    up: 0,
    down: 0,
    pending: 0,
    maintenance: 0,
    unknown: 0,
  };

  for (const monitor of monitors) {
    summary[monitor.state] += 1;
  }

  return summary;
}

export class UptimeKumaService {
  readonly #url: string;
  readonly #apiKey: string | null;
  readonly #timeoutMs: number;

  constructor(url: string, apiKey: string | null, timeoutMs: number) {
    this.#url = url;
    this.#apiKey = apiKey;
    this.#timeoutMs = timeoutMs;
  }

  get metricsConfigured(): boolean {
    return Boolean(this.#apiKey);
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

  async #fetchMetrics(): Promise<string> {
    if (!this.#apiKey) {
      throw new Error('Uptime Kuma metrics API key is not configured.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const authorization = `Basic ${Buffer.from(`:${this.#apiKey}`).toString('base64')}`;

      const response = await fetch(`${this.#url}/metrics`, {
        method: 'GET',
        headers: {
          accept: 'text/plain',
          authorization,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Uptime Kuma metrics returned HTTP ${response.status}.`);
      }

      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }

  async getMonitors(): Promise<UptimeKumaMonitorDto[]> {
    return parseUptimeKumaMetrics(await this.#fetchMetrics());
  }

  async getSummary(): Promise<UptimeKumaSummaryDto> {
    return summariseUptimeKumaMonitors(await this.getMonitors());
  }
}
