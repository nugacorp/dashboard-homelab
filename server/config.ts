/**
 * Environment parsing and validation.
 *
 * Rules enforced here:
 *  - Secrets only ever live in this process. Nothing read here is forwarded to
 *    the browser; routes expose *presence*, never values.
 *  - An integration is either fully configured or not configured at all. A
 *    half-configured integration is a startup error, because silently falling
 *    back would produce a dashboard that lies about what it is talking to.
 *  - Any parse failure throws with a message that names the variable but never
 *    prints its value.
 */
import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const APP_VERSION = '1.0.0';

const trimmed = z.string().trim();

/** Treats empty strings the same as unset, which is how compose/env_file behave. */
const optionalString = trimmed.optional().transform((v) => (v === '' ? undefined : v));

const booleanish = trimmed
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : v.toLowerCase()))
  .refine((v) => v === undefined || ['true', 'false', '1', '0', 'yes', 'no'].includes(v), {
    message: 'must be one of: true, false, 1, 0, yes, no',
  })
  .transform((v) => (v === undefined ? undefined : ['true', '1', 'yes'].includes(v)));

const port = trimmed
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
  .refine((v) => v === undefined || (Number.isInteger(v) && v > 0 && v < 65536), {
    message: 'must be an integer between 1 and 65535',
  });

const positiveInt = (max: number) =>
  trimmed
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= max), {
      message: `must be a number between 1 and ${max}`,
    });

/** Rejects anything that is not an absolute http(s) URL. */
const httpUrl = optionalString.refine(
  (v) => {
    if (v === undefined) return true;
    try {
      const u = new URL(v);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'must be an absolute http:// or https:// URL' },
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: port,
  HOST: optionalString,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  UPSTREAM_TIMEOUT_MS: positiveInt(60_000),
  TRUST_PROXY: booleanish,
  WEB_DIST_DIR: optionalString,

  PVE_API_URL: httpUrl,
  PVE_TOKEN_ID: optionalString,
  PVE_TOKEN_SECRET: optionalString,
  PVE_CA_CERT_PATH: optionalString,
  PVE_TLS_SERVERNAME: optionalString,

  HASS_URL: httpUrl,
  HASS_TOKEN: optionalString,

  HERMES_ENABLED: booleanish,
  HERMES_API_URL: httpUrl,
  HERMES_API_KEY: optionalString,

  UPTIME_KUMA_URL: httpUrl,

  DASHBOARD_USERNAME: optionalString,
  DASHBOARD_PASSWORD_HASH: optionalString,
  SESSION_SECRET: optionalString,
  SESSION_TTL_HOURS: positiveInt(24 * 30),
});

export interface ProxmoxConfig {
  /** Origin only, no trailing slash, e.g. https://192.168.1.99:8006 */
  baseUrl: string;
  tokenId: string;
  tokenSecret: string;
  /** PEM contents of the Proxmox cluster CA, when supplied. */
  caCert: string | null;
  caCertPath: string | null;
  /**
   * Hostname to validate the certificate against. Proxmox issues certs for the
   * node hostname (e.g. pve-dell.dell), so connecting by IP needs this override
   * to keep TLS verification ON rather than disabling it.
   */
  tlsServername: string | null;
}

export interface HomeAssistantConfig {
  baseUrl: string;
  token: string;
}

export interface HermesConfig {
  baseUrl: string;
  apiKey: string | null;
}

export interface AuthConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  ttlSeconds: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  upstreamTimeoutMs: number;
  trustProxy: boolean;
  webDistDir: string | null;
  proxmox: ProxmoxConfig | null;
  homeAssistant: HomeAssistantConfig | null;
  hermes: HermesConfig | null;
  /** Distinguishes "flag off" from "flag on but URL missing". */
  hermesEnabled: boolean;
  uptimeKumaUrl: string | null;
  auth: AuthConfig | null;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Strips the trailing slash so path joining stays predictable. */
function normaliseBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, '');
}

/** All-or-nothing check for a group of related variables. */
function requireGroup(
  label: string,
  entries: Record<string, string | undefined>,
): boolean {
  const present = Object.entries(entries).filter(([, v]) => v !== undefined);
  if (present.length === 0) return false;
  const missing = Object.entries(entries)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new ConfigError(
      `${label} is partially configured. Missing: ${missing.join(', ')}. ` +
        'Set all of them or none of them.',
    );
  }
  return true;
}

/** `user@realm!tokenname` — the only shape the PVE API token header accepts. */
const PVE_TOKEN_ID_RE = /^[^\s@!]+@[^\s@!]+![^\s@!]+$/;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new ConfigError(`Invalid environment configuration -> ${details}`);
  }
  const e = parsed.data;

  let proxmox: ProxmoxConfig | null = null;
  if (
    requireGroup('Proxmox', {
      PVE_API_URL: e.PVE_API_URL,
      PVE_TOKEN_ID: e.PVE_TOKEN_ID,
      PVE_TOKEN_SECRET: e.PVE_TOKEN_SECRET,
    })
  ) {
    if (!PVE_TOKEN_ID_RE.test(e.PVE_TOKEN_ID!)) {
      throw new ConfigError(
        'PVE_TOKEN_ID must look like user@realm!tokenname (value not shown).',
      );
    }
    let caCert: string | null = null;
    if (e.PVE_CA_CERT_PATH) {
      try {
        caCert = readFileSync(e.PVE_CA_CERT_PATH, 'utf8');
      } catch (err) {
        throw new ConfigError(
          `PVE_CA_CERT_PATH could not be read: ${e.PVE_CA_CERT_PATH} ` +
            `(${err instanceof Error ? err.message : 'unknown error'})`,
        );
      }
      if (!caCert.includes('BEGIN CERTIFICATE')) {
        throw new ConfigError(
          `PVE_CA_CERT_PATH does not contain a PEM certificate: ${e.PVE_CA_CERT_PATH}`,
        );
      }
    }
    proxmox = {
      baseUrl: normaliseBaseUrl(e.PVE_API_URL!),
      tokenId: e.PVE_TOKEN_ID!,
      tokenSecret: e.PVE_TOKEN_SECRET!,
      caCert,
      caCertPath: e.PVE_CA_CERT_PATH ?? null,
      tlsServername: e.PVE_TLS_SERVERNAME ?? null,
    };
  }

  let homeAssistant: HomeAssistantConfig | null = null;
  if (
    requireGroup('Home Assistant', {
      HASS_URL: e.HASS_URL,
      HASS_TOKEN: e.HASS_TOKEN,
    })
  ) {
    homeAssistant = {
      baseUrl: normaliseBaseUrl(e.HASS_URL!),
      token: e.HASS_TOKEN!,
    };
  }

  const hermesEnabled = e.HERMES_ENABLED ?? false;
  let hermes: HermesConfig | null = null;
  if (hermesEnabled) {
    if (!e.HERMES_API_URL) {
      throw new ConfigError('HERMES_ENABLED is true but HERMES_API_URL is not set.');
    }
    hermes = {
      baseUrl: normaliseBaseUrl(e.HERMES_API_URL),
      apiKey: e.HERMES_API_KEY ?? null,
    };
  }

  let auth: AuthConfig | null = null;
  if (
    requireGroup('Dashboard auth', {
      DASHBOARD_USERNAME: e.DASHBOARD_USERNAME,
      DASHBOARD_PASSWORD_HASH: e.DASHBOARD_PASSWORD_HASH,
      SESSION_SECRET: e.SESSION_SECRET,
    })
  ) {
    if (e.SESSION_SECRET!.length < 32) {
      throw new ConfigError('SESSION_SECRET must be at least 32 characters long.');
    }
    if (!e.DASHBOARD_PASSWORD_HASH!.startsWith('scrypt$')) {
      throw new ConfigError(
        'DASHBOARD_PASSWORD_HASH must be a scrypt hash produced by `npm run hash-password`.',
      );
    }
    auth = {
      username: e.DASHBOARD_USERNAME!,
      passwordHash: e.DASHBOARD_PASSWORD_HASH!,
      sessionSecret: e.SESSION_SECRET!,
      ttlSeconds: (e.SESSION_TTL_HOURS ?? 12) * 3600,
    };
  }

  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT ?? 8080,
    host: e.HOST ?? '0.0.0.0',
    logLevel: e.LOG_LEVEL,
    upstreamTimeoutMs: e.UPSTREAM_TIMEOUT_MS ?? 8000,
    trustProxy: e.TRUST_PROXY ?? false,
    webDistDir: e.WEB_DIST_DIR ?? null,
    proxmox,
    homeAssistant,
    hermes,
    hermesEnabled,
    uptimeKumaUrl: e.UPTIME_KUMA_URL ? normaliseBaseUrl(e.UPTIME_KUMA_URL) : null,
    auth,
  };
}

/** A log-safe view of the configuration: presence only, never values. */
export function describeConfig(config: AppConfig): Record<string, string> {
  return {
    nodeEnv: config.nodeEnv,
    listen: `${config.host}:${config.port}`,
    upstreamTimeoutMs: String(config.upstreamTimeoutMs),
    proxmox: config.proxmox
      ? `configured (${config.proxmox.baseUrl}, ca=${config.proxmox.caCert ? 'yes' : 'no'}, servername=${config.proxmox.tlsServername ?? 'default'})`
      : 'not configured',
    homeAssistant: config.homeAssistant
      ? `configured (${config.homeAssistant.baseUrl})`
      : 'not configured',
    hermes: config.hermes
      ? `enabled (${config.hermes.baseUrl}, apiKey=${config.hermes.apiKey ? 'set' : 'unset'})`
      : config.hermesEnabled
        ? 'enabled but unusable'
        : 'disabled',
    uptimeKuma: config.uptimeKumaUrl ?? 'not configured',
    auth: config.auth ? `enabled (user=${config.auth.username})` : 'DISABLED',
  };
}
