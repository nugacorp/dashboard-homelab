import { afterEach, describe, expect, it } from 'vitest';
import { hashPassword } from '../server/auth.js';
import { startApp, startFailingUpstream, type RunningApp } from './helpers/server.js';

let running: RunningApp | null = null;

afterEach(async () => {
  await running?.close();
  running = null;
});

describe('health endpoints', () => {
  it('reports live without touching any upstream', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/health/live`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });

  it('reports every integration as not_configured on a bare install', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/health/ready`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      auth: string;
      integrations: Record<string, { state: string }>;
    };
    expect(body.status).toBe('ok');
    expect(body.auth).toBe('disabled');
    expect(body.integrations.proxmox?.state).toBe('not_configured');
    expect(body.integrations.homeAssistant?.state).toBe('not_configured');
    expect(body.integrations.hermes?.state).toBe('disabled');
    expect(body.integrations.uptimeKuma?.state).toBe('not_configured');
  });
});

describe('not-configured envelopes', () => {
  it('answers 200 with status not_configured, not an error', async () => {
    running = await startApp({});
    for (const path of [
      '/api/proxmox/cluster',
      '/api/proxmox/nodes',
      '/api/proxmox/vms',
      '/api/proxmox/containers',
      '/api/proxmox/storage',
      '/api/home-assistant/summary',
      '/api/home-assistant/entities',
      '/api/uptime-kuma/status',
    ]) {
      const res = await fetch(`${running.baseUrl}${path}`);
      expect(res.status, path).toBe(200);
      const body = (await res.json()) as { status: string; data: unknown };
      expect(body.status, path).toBe('not_configured');
      expect(body.data, path).toBeNull();
    }
  });

  it('reports hermes as disabled rather than broken', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/hermes/status`);
    const body = (await res.json()) as { status: string; error: { message: string } };
    expect(body.status).toBe('disabled');
    expect(body.error.message).toContain('Hermes API no configurada');
  });

  it('refuses to invent a chat reply when hermes is off', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/hermes/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '¿Qué pasa en el homelab?' }),
    });
    const body = (await res.json()) as { status: string; data: unknown };
    expect(body.status).toBe('disabled');
    expect(body.data).toBeNull();
  });
});

describe('write guard', () => {
  const mutations: Array<[string, string]> = [
    ['POST', '/api/proxmox/vms/100/start'],
    ['POST', '/api/proxmox/vms/100/stop'],
    ['POST', '/api/proxmox/vms/100/reboot'],
    ['POST', '/api/proxmox/vms/100/shutdown'],
    ['POST', '/api/proxmox/containers/200/start'],
    ['POST', '/api/proxmox/containers/200/stop'],
    ['POST', '/api/proxmox/nodes/pve-dell/reboot'],
    ['DELETE', '/api/proxmox/vms/100'],
    ['DELETE', '/api/proxmox/containers/200'],
    ['POST', '/api/home-assistant/services/light/turn_on'],
  ];

  it('answers 403 NOT_ENABLED and never a fabricated success', async () => {
    running = await startApp({
      // Fully configured Proxmox: the guard must hold even then.
      PVE_API_URL: 'https://127.0.0.1:1',
      PVE_TOKEN_ID: 'nuga@pve!dash',
      PVE_TOKEN_SECRET: 'irrelevant',
      HASS_URL: 'http://127.0.0.1:1',
      HASS_TOKEN: 'irrelevant',
    });

    for (const [method, path] of mutations) {
      const res = await fetch(`${running.baseUrl}${path}`, { method });
      expect(res.status, `${method} ${path}`).toBe(403);
      const body = (await res.json()) as { status: string; error: { code: string } };
      expect(body.status, path).toBe('not_enabled');
      expect(body.error.code, path).toBe('NOT_ENABLED');
      expect(JSON.stringify(body), path).not.toContain('success');
    }
  });
});

describe('upstream failure isolation', () => {
  it('returns 503 for the broken integration while the rest stay healthy', async () => {
    const failing = await startFailingUpstream(500);
    try {
      running = await startApp({ HASS_URL: failing.url, HASS_TOKEN: 'token-value' });

      const broken = await fetch(`${running.baseUrl}/api/home-assistant/summary`);
      expect(broken.status).toBe(503);
      const body = (await broken.json()) as { status: string; error: { code: string; message: string } };
      expect(body.status).toBe('unavailable');
      expect(body.error.code).toBe('UPSTREAM_HTTP');
      // The upstream body must never be echoed back to the browser.
      expect(JSON.stringify(body)).not.toContain('SHOULD-NEVER-APPEAR');

      // The process itself is still fine and other routes still answer.
      const live = await fetch(`${running.baseUrl}/api/health/live`);
      expect(live.status).toBe(200);
      const proxmox = await fetch(`${running.baseUrl}/api/proxmox/cluster`);
      expect(proxmox.status).toBe(200);
    } finally {
      await failing.close();
    }
  });

  it('maps a 401 from the upstream to UPSTREAM_AUTH', async () => {
    const failing = await startFailingUpstream(401);
    try {
      running = await startApp({ HASS_URL: failing.url, HASS_TOKEN: 'token-value' });
      const res = await fetch(`${running.baseUrl}/api/home-assistant/summary`);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('UPSTREAM_AUTH');
    } finally {
      await failing.close();
    }
  });
});

describe('input validation', () => {
  it('rejects an absurd Home Assistant domain filter', async () => {
    running = await startApp({ HASS_URL: 'http://127.0.0.1:1', HASS_TOKEN: 'x' });
    const res = await fetch(
      `${running.baseUrl}/api/home-assistant/entities?domain=${encodeURIComponent('../../etc/passwd')}`,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects an empty or oversized hermes prompt', async () => {
    running = await startApp({
      HERMES_ENABLED: 'true',
      HERMES_API_URL: 'http://127.0.0.1:1',
    });
    for (const message of ['', '   ', 'x'.repeat(5000)]) {
      const res = await fetch(`${running.baseUrl}/api/hermes/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      expect(res.status).toBe(400);
    }
  });

  it('answers 404 with an envelope for an unknown API path', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/does-not-exist`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('authentication', () => {
  const authEnv = {
    DASHBOARD_USERNAME: 'ramiro',
    DASHBOARD_PASSWORD_HASH: hashPassword('a-sufficiently-long-password'),
    SESSION_SECRET: 'z'.repeat(48),
  };

  it('protects data routes but leaves health public', async () => {
    running = await startApp(authEnv);

    const guarded = await fetch(`${running.baseUrl}/api/proxmox/cluster`);
    expect(guarded.status).toBe(401);

    expect((await fetch(`${running.baseUrl}/api/health/live`)).status).toBe(200);
    expect((await fetch(`${running.baseUrl}/api/health/ready`)).status).toBe(200);
  });

  it('rejects wrong credentials and accepts the right ones', async () => {
    running = await startApp(authEnv);

    const bad = await fetch(`${running.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'ramiro', password: 'nope' }),
    });
    expect(bad.status).toBe(401);

    const good = await fetch(`${running.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'ramiro', password: 'a-sufficiently-long-password' }),
    });
    expect(good.status).toBe(200);

    const setCookie = good.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('nuga_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');

    const cookie = setCookie.split(';')[0]!;
    const authed = await fetch(`${running.baseUrl}/api/proxmox/cluster`, {
      headers: { cookie },
    });
    expect(authed.status).toBe(200);
  });

  it('reports authRequired in the session endpoint', async () => {
    running = await startApp(authEnv);
    const res = await fetch(`${running.baseUrl}/api/auth/session`);
    expect(await res.json()).toMatchObject({ authenticated: false, authRequired: true });
  });
});

describe('response headers', () => {
  it('sets baseline hardening headers and hides the framework', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/health/live`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    expect(res.headers.get('x-powered-by')).toBeNull();
    // Same-origin by design: no CORS wildcard anywhere.
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
