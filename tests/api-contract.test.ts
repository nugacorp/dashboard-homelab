/**
 * Envelope vs raw: the boundary the IntegrationsCard bug fell through.
 *
 * `/api/health/ready` deliberately answers with a plain ReadyResponse rather
 * than an ApiEnvelope. The frontend originally consumed it with the envelope
 * client, whose guard rejected the body — so a fully healthy backend rendered
 * "El backend devolvió un formato inesperado." in the integrations card.
 *
 * The trap is that ReadyResponse *does* have a `status` field, so a looser
 * guard would have been worse: the payload would have been mistaken for an
 * envelope with `status: "ok"` and no `data`.
 *
 * These tests pin both halves of the contract against the real Express app,
 * and statically check that each hook is pointed at the right kind of endpoint.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReadyResponse } from '../shared/api.js';
// The production predicate, not a copy of it.
import { isEnvelope } from '../src/services/api/client';
import { startApp, type RunningApp } from './helpers/server.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Endpoints that answer with a bare DTO. Keep in sync with the backend. */
const RAW_ENDPOINTS = ['/health/live', '/health/ready', '/auth/session'];

/** A representative envelope endpoint from each router. */
const ENVELOPE_ENDPOINTS = [
  '/proxmox/cluster',
  '/proxmox/nodes',
  '/proxmox/vms',
  '/proxmox/containers',
  '/proxmox/storage',
  '/home-assistant/summary',
  '/home-assistant/entities',
  '/hermes/status',
  '/hermes/models',
  '/uptime-kuma/status',
  '/uptime-kuma/monitors',
  '/uptime-kuma/summary',
];

let running: RunningApp | null = null;

afterEach(async () => {
  await running?.close();
  running = null;
});

describe('raw endpoints are not envelopes', () => {
  it('/api/health/ready must NOT satisfy the envelope guard', async () => {
    running = await startApp({});
    const res = await fetch(`${running.baseUrl}/api/health/ready`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as unknown;

    // This is the assertion that would have caught the bug: consuming this
    // body with apiGet() yields BAD_RESPONSE, never the real payload.
    expect(isEnvelope(body)).toBe(false);

    // And it is a valid ReadyResponse, so the failure was purely a transport
    // mismatch on our side rather than a backend defect.
    const ready = body as ReadyResponse;
    expect(ready.status).toBe('ok');
    expect(typeof ready.version).toBe('string');
    expect(typeof ready.uptimeSeconds).toBe('number');
    expect(['enabled', 'disabled']).toContain(ready.auth);
    expect(Object.keys(ready.integrations).sort()).toEqual([
      'hermes',
      'homeAssistant',
      'proxmox',
      'uptimeKuma',
    ]);
  });

  it('the ready payload has a `status` that is not an envelope status', async () => {
    running = await startApp({});
    const body = (await (await fetch(`${running.baseUrl}/api/health/ready`)).json()) as Record<
      string,
      unknown
    >;
    // Present, which is exactly why the guard cannot key on `status` alone...
    expect(body).toHaveProperty('status');
    // ...and absent, which is what actually distinguishes the two shapes.
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('source');
  });

  it('every raw endpoint fails the envelope guard', async () => {
    running = await startApp({});
    for (const endpoint of RAW_ENDPOINTS) {
      const body = (await (await fetch(`${running.baseUrl}/api${endpoint}`)).json()) as unknown;
      expect(isEnvelope(body), endpoint).toBe(false);
    }
  });
});

describe('envelope endpoints are envelopes', () => {
  it('every envelope endpoint satisfies the guard, configured or not', async () => {
    running = await startApp({});
    for (const endpoint of ENVELOPE_ENDPOINTS) {
      const res = await fetch(`${running.baseUrl}/api${endpoint}`);
      const body = (await res.json()) as unknown;
      expect(isEnvelope(body), endpoint).toBe(true);
    }
  });

  it('holds for the unavailable path too, not just the happy one', async () => {
    // A configured-but-unreachable upstream still answers with an envelope.
    running = await startApp({ HASS_URL: 'http://127.0.0.1:1', HASS_TOKEN: 'irrelevant' });
    const res = await fetch(`${running.baseUrl}/api/home-assistant/summary`);
    expect(res.status).toBe(503);
    expect(isEnvelope(await res.json())).toBe(true);
  });
});

/* ------------------------------------------------------- static wiring ---- */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const frontendSources = walk(path.join(ROOT, 'src')).map((file) => ({
  path: path.relative(ROOT, file).replace(/\\/g, '/'),
  source: readFileSync(file, 'utf8'),
}));

/** Collects the endpoint literal passed to a given hook, across the tree. */
function callsTo(hook: string): Array<{ file: string; endpoint: string }> {
  const found: Array<{ file: string; endpoint: string }> = [];
  const pattern = new RegExp(`\\b${hook}\\s*(?:<[^>]*>)?\\s*\\(\\s*'([^']+)'`, 'g');
  for (const { path: file, source } of frontendSources) {
    for (const match of source.matchAll(pattern)) {
      found.push({ file, endpoint: match[1]! });
    }
  }
  return found;
}

describe('hooks are pointed at the right transport', () => {
  it('finds the hook call sites it is meant to police', () => {
    expect(callsTo('useResource').length).toBeGreaterThan(0);
    expect(callsTo('useRawResource').length).toBeGreaterThan(0);
  });

  it('useResource is never pointed at a raw endpoint', () => {
    const offenders = callsTo('useResource').filter((c) => RAW_ENDPOINTS.includes(c.endpoint));
    expect(offenders).toEqual([]);
  });

  it('useRawResource is only pointed at raw endpoints', () => {
    const offenders = callsTo('useRawResource').filter((c) => !RAW_ENDPOINTS.includes(c.endpoint));
    expect(offenders).toEqual([]);
  });

  it('the readiness payload is consumed through the raw hook', () => {
    const readyCalls = [...callsTo('useResource'), ...callsTo('useRawResource')].filter(
      (c) => c.endpoint === '/health/ready',
    );
    expect(readyCalls).toHaveLength(1);
    expect(callsTo('useRawResource').map((c) => c.endpoint)).toContain('/health/ready');
  });
});
