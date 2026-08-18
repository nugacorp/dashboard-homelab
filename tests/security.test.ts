import { createHmac, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createSessionToken,
  hashPassword,
  parseCookies,
  verifyPassword,
  verifySessionToken,
  verifyUsername,
} from '../server/auth.js';
import { createLogger, redact, registerSecret } from '../server/logger.js';

/**
 * Builds a JWT-shaped string at runtime.
 *
 * The redaction test needs a token that genuinely matches the JWT pattern, but
 * a complete JWT literal in the source trips secret scanners (and rightly so —
 * a scanner cannot tell a fixture from a leak by looking at it). Assembling it
 * here from a synthetic header, payload and HMAC keeps the pattern exact while
 * leaving nothing credential-shaped in the committed file.
 *
 * The signing key is random per run, so the result authenticates to nothing.
 */
function buildSyntheticJwt(): string {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({ sub: 'synthetic-fixture', iat: 0 });
  const signature = createHmac('sha256', randomBytes(32))
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

describe('password hashing', () => {
  it('produces a verifiable scrypt digest and never stores the password', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(stored).not.toContain('correct horse');
    expect(verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(verifyPassword('wrong password entirely', stored)).toBe(false);
  });

  it('salts, so the same password hashes differently every time', () => {
    expect(hashPassword('same-password-twice')).not.toBe(hashPassword('same-password-twice'));
  });

  it('rejects malformed stored hashes rather than throwing', () => {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(verifyPassword('x', 'scrypt$a$b$c$d$e')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });
});

describe('username comparison', () => {
  it('matches exactly and rejects near misses', () => {
    expect(verifyUsername('ramiro', 'ramiro')).toBe(true);
    expect(verifyUsername('ramir', 'ramiro')).toBe(false);
    expect(verifyUsername('Ramiro', 'ramiro')).toBe(false);
  });
});

describe('session tokens', () => {
  const secret = 'a'.repeat(48);

  it('round-trips the username', () => {
    const token = createSessionToken('ramiro', secret, 3600);
    expect(verifySessionToken(token, secret)).toBe('ramiro');
  });

  it('rejects a token signed with another secret', () => {
    const token = createSessionToken('ramiro', secret, 3600);
    expect(verifySessionToken(token, 'b'.repeat(48))).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = createSessionToken('ramiro', secret, 3600);
    const [body, signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: 'root', exp: Math.floor(Date.now() / 1000) + 3600 }),
      'utf8',
    ).toString('base64url');
    expect(verifySessionToken(`${forgedBody}.${signature}`, secret)).toBeNull();
    expect(verifySessionToken(`${body}.deadbeef`, secret)).toBeNull();
  });

  it('rejects an expired token', () => {
    expect(verifySessionToken(createSessionToken('ramiro', secret, -1), secret)).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(verifySessionToken(undefined, secret)).toBeNull();
    expect(verifySessionToken('', secret)).toBeNull();
    expect(verifySessionToken('nodot', secret)).toBeNull();
  });
});

describe('cookie parsing', () => {
  it('reads a value among several cookies', () => {
    const cookies = parseCookies('other=1; nuga_session=abc.def; another=2');
    expect(cookies['nuga_session']).toBe('abc.def');
  });

  it('tolerates an empty or absent header', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
    expect(parseCookies('malformed')).toEqual({});
  });
});

describe('log redaction', () => {
  it('masks a registered secret wherever it appears', () => {
    registerSecret('4f3c2b1a-secret-token-value');
    expect(redact('token=4f3c2b1a-secret-token-value trailing')).not.toContain(
      '4f3c2b1a-secret-token-value',
    );
  });

  it('masks a Proxmox API token header even when never registered', () => {
    const line = 'authorization: PVEAPIToken=nuga@pve!dash=11111111-2222-3333-4444-555555555555';
    const out = redact(line);
    expect(out).not.toContain('11111111-2222-3333-4444-555555555555');
    expect(out).toContain('[REDACTED]');
  });

  it('masks bearer tokens and JWTs', () => {
    expect(redact('Bearer abcdefghijklmnop')).toContain('[REDACTED]');

    const jwt = buildSyntheticJwt();
    // Guard the guard: if the generator ever stopped producing a real JWT
    // shape, the assertion below would pass vacuously and the regex would go
    // untested. A Home Assistant long-lived token has exactly this shape.
    expect(jwt.startsWith('eyJ')).toBe(true);
    expect(jwt.split('.')).toHaveLength(3);
    for (const segment of jwt.split('.')) {
      expect(segment.length).toBeGreaterThanOrEqual(13);
      expect(segment).toMatch(/^[A-Za-z0-9_-]+$/);
    }

    const out = redact(`authorization header carried ${jwt} inline`);
    expect(out).toContain('[REDACTED_JWT]');
    expect(out).not.toContain(jwt);
    // Surrounding text must survive: redaction replaces the token, not the line.
    expect(out).toContain('authorization header carried');
    expect(out).toContain('inline');
  });

  it('applies redaction to the emitted log line', () => {
    registerSecret('another-super-secret-value');
    const written: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string) => {
      written.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      createLogger('info').info('upstream said', { detail: 'another-super-secret-value' });
    } finally {
      process.stdout.write = original;
    }
    expect(written.join('')).not.toContain('another-super-secret-value');
    expect(written.join('')).toContain('[REDACTED]');
  });
});
