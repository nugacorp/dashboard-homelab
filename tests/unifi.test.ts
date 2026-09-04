import { afterEach, describe, expect, it } from 'vitest';
import { startApp, startFakeUpstream, type FakeUpstream, type RunningApp } from './helpers/server.js';

const SITE_ID = '497f6eca-6276-4993-bfeb-53cbbbba6f08';
const DEVICE_ID = '4de4adb9-21ee-47e3-aeb4-8cf8ed6c109a';
const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const NETWORK_ID = '7596498d-2f36-4dc2-8d9e-7596498d2f36';

let app: RunningApp | null = null;
let upstream: FakeUpstream | null = null;

afterEach(async () => {
  await app?.close();
  await upstream?.close();
  app = null;
  upstream = null;
});

describe('UniFi Network integration', () => {
  it('is honest when not configured', async () => {
    app = await startApp({});

    const response = await fetch(`${app.baseUrl}/api/unifi/summary`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('not_configured');
    expect(body.data).toBeNull();
  });

  it('uses only GET requests and maps the official API payload', async () => {
    upstream = await startFakeUpstream({
      '/v1/info': {
        applicationVersion: '10.6.101',
      },
      '/v1/sites?limit=200': {
        data: [{ id: SITE_ID, name: 'Default' }],
      },
      [`/v1/sites/${SITE_ID}/devices?limit=200`]: {
        data: [
          {
            id: DEVICE_ID,
            name: 'Cloud Gateway Max',
            model: 'UCG-Max',
            ipAddress: '192.0.2.1',
            state: 'ONLINE',
            firmwareVersion: '4.4.0',
            firmwareUpdatable: false,
          },
        ],
      },
      [`/v1/sites/${SITE_ID}/devices/${DEVICE_ID}/statistics/latest`]: {
        uptimeSec: 1000,
        cpuUtilizationPct: 12.5,
        memoryUtilizationPct: 40.2,
        uplink: {
          txRateBps: 1000000,
          rxRateBps: 2000000,
        },
      },
      [`/v1/sites/${SITE_ID}/clients?limit=200`]: {
        data: [
          {
            id: CLIENT_ID,
            type: 'WIRED',
            name: 'test-client',
            ipAddress: '192.0.2.2',
            macAddress: '00:11:22:33:44:55',
          },
        ],
      },
      [`/v1/sites/${SITE_ID}/networks?limit=200`]: {
        data: [
          {
            id: NETWORK_ID,
            name: 'Default',
            management: 'GATEWAY',
            enabled: true,
            vlanId: 1,
            default: true,
          },
        ],
      },
      [`/v1/sites/${SITE_ID}/wifi/broadcasts?limit=200`]: {
        data: [],
      },
      [`/v1/sites/${SITE_ID}/wans?limit=200`]: {
        data: [{ id: 'wan-1', name: 'WAN1' }],
      },
    });

    app = await startApp({
      UNIFI_API_URL: upstream.url,
      UNIFI_API_KEY: 'test-unifi-api-key',
    });

    const response = await fetch(`${app.baseUrl}/api/unifi/summary`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.data.applicationVersion).toBe('10.6.101');
    expect(body.data.siteName).toBe('Default');
    expect(body.data.devices).toHaveLength(1);
    expect(body.data.clients).toHaveLength(1);
    expect(body.data.networks).toHaveLength(1);
    expect(body.data.wans).toHaveLength(1);
    expect(body.data.wifiBroadcastCount).toBe(0);

    expect(upstream.requests.length).toBeGreaterThanOrEqual(7);
    expect(upstream.requests.every((request) => request.method === 'GET')).toBe(true);
    expect(
      upstream.requests.every(
        (request) => request.xApiKey === 'test-unifi-api-key',
      ),
    ).toBe(true);
    expect(
      upstream.requests.some((request) => request.url.includes('/actions')),
    ).toBe(false);
  });
});
