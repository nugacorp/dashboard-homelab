/**
 * Local single-user authentication.
 *
 * Design constraints: the dashboard is LAN-only and must not grow a database,
 * so the session is a stateless HMAC-signed token carried in an HttpOnly
 * cookie. Revocation is achieved by rotating SESSION_SECRET, which is an
 * acceptable trade-off for a one-operator homelab tool.
 *
 * Passwords are never stored: DASHBOARD_PASSWORD_HASH holds an scrypt digest
 * produced by `npm run hash-password`.
 */
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

export const SESSION_COOKIE = 'nuga_session';

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

/** `scrypt$N$r$p$salt$hash`, all binary parts base64. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { ...SCRYPT_PARAMS });
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(hashB64!, 'base64');
    // maxmem must be raised because the default cap is below N=16384 r=8.
    actual = scryptSync(password, Buffer.from(saltB64!, 'base64'), expected.length, {
      N,
      r,
      p,
      maxmem: 256 * 1024 * 1024,
    });
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/** Constant-time username comparison so the endpoint does not leak the name. */
export function verifyUsername(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Still burn a comparison to keep the timing profile flat.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

interface SessionPayload {
  sub: string;
  /** Unix seconds. */
  exp: number;
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(username: string, secret: string, ttlSeconds: number): string {
  const payload: SessionPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

/** Returns the username, or null when the token is absent, forged or expired. */
export function verifySessionToken(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body, secret);

  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Minimal RFC 6265 cookie header parser; avoids pulling in cookie-parser. */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}
