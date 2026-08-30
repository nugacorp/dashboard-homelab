/**
 * Minimal structured logger with secret redaction.
 *
 * Every string that reaches a log line goes through `redact()`. That is a
 * defence in depth measure: call sites are already expected not to log secrets,
 * but a token that leaks into an upstream error message would otherwise end up
 * in the container logs verbatim.
 *
 * A bounded in-memory ring buffer keeps recent already-redacted application
 * events available to the authenticated NUGA HOME UI. It is intentionally not
 * a Docker/journald reader and never touches /var/run/docker.sock.
 */

import type { NugaLogEntryDto, NugaLogLevel } from '../shared/api.js';

export type LogLevel = NugaLogLevel;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Values registered here are replaced by [REDACTED] anywhere they appear. */
const secrets = new Set<string>();

export function registerSecret(value: string | null | undefined): void {
  // Very short values would cause false positives across unrelated text.
  if (value && value.length >= 8) secrets.add(value);
}

const PATTERNS: Array<[RegExp, string]> = [
  // Proxmox API token header: PVEAPIToken=user@realm!name=<uuid>
  [/(PVEAPIToken=[^\s=]+=)[^\s,;"']+/gi, '$1[REDACTED]'],
  // Any Authorization / Bearer material.
  [/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]'],
  [/(authorization"?\s*[:=]\s*"?)[^\s",}]+/gi, '$1[REDACTED]'],
  // Long-lived access tokens are JWTs.
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]'],
  // token=... / api_key=... / password=... in query strings or bodies.
  [/((?:token|api[_-]?key|password|secret)"?\s*[:=]\s*"?)[^\s",}&]+/gi, '$1[REDACTED]'],
];

export function redact(input: string): string {
  let out = input;

  for (const secret of secrets) {
    if (out.includes(secret)) {
      out = out.split(secret).join('[REDACTED]');
    }
  }

  for (const [re, replacement] of PATTERNS) {
    out = out.replace(re, replacement);
  }

  return out;
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;

  /** Snapshot of recent already-redacted entries, oldest first. */
  entries(): NugaLogEntryDto[];
}

export function createLogger(
  level: LogLevel = 'info',
  maxEntries = 250,
): Logger {
  const threshold = LEVEL_ORDER[level];
  const buffer: NugaLogEntryDto[] = [];
  const capacity = Math.max(1, Math.min(1000, Math.floor(maxEntries)));

  const emit = (
    lvl: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) => {
    if (LEVEL_ORDER[lvl] < threshold) return;

    const timestamp = new Date().toISOString();
    const safeMessage = redact(message);

    const safeContext = Object.fromEntries(
      Object.entries(context ?? {}).map(([key, value]) => [
        key,
        redact(stringify(value)),
      ]),
    );

    buffer.push({
      timestamp,
      level: lvl,
      message: safeMessage,
      context: safeContext,
    });

    if (buffer.length > capacity) {
      buffer.splice(0, buffer.length - capacity);
    }

    const parts = [
      timestamp,
      lvl.toUpperCase().padEnd(5),
      safeMessage,
    ];

    if (Object.keys(safeContext).length > 0) {
      parts.push(
        Object.entries(safeContext)
          .map(([key, value]) => `${key}=${value}`)
          .join(' '),
      );
    }

    const line = parts.join(' ');

    if (lvl === 'error' || lvl === 'warn') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  };

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),

    entries: () =>
      buffer.map((entry) => ({
        ...entry,
        context: { ...entry.context },
      })),
  };
}
