/**
 * Upstream payload -> DTO normalisation.
 *
 * These run the real services against a stand-in HTTP upstream, so they cover
 * zod validation, unit conversion and the "null means unknown" rule end to end.
 * The fixtures below mirror the shape of the real cluster (three nodes named
 * pve-dell / pve-lenovo1 / pve-lenovo2, guests 100/110/120) without pretending
 * to be a snapshot of it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createLogger } from '../server/logger.js';
import { HomeAssistantService } from '../server/services/homeAssistant.js';
import { ProxmoxService } from '../server/services/proxmox.js';
import { startFakeUpstream, type FakeUpstream } from './helpers/server.js';

const logger = createLogger('error');
let upstream: FakeUpstream | null = null;

afterEach(async () => {
  await upstream?.close();
  upstream = null;
});

const GiB = 1024 ** 3;

const PVE_ROUTES = {
  '/api2/json/version': { data: { version: '8.4.1', release: '8.4' } },
  '/api2/json/cluster/status': {
    data: [
      { type: 'cluster', id: 'cluster', name: 'nuga-home', nodes: 3, quorate: 1 },
      { type: 'node', id: 'node/pve-dell', name: 'pve-dell', ip: '192.168.1.99', online: 1 },
      { type: 'node', id: 'node/pve-lenovo1', name: 'pve-lenovo1', ip: '192.168.1.98', online: 1 },
      { type: 'node', id: 'node/pve-lenovo2', name: 'pve-lenovo2', ip: '192.168.1.97', online: 1 },
    ],
  },
  '/api2/json/nodes': {
    data: [
      { node: 'pve-dell', status: 'online', cpu: 0.25, maxcpu: 8, mem: 8 * GiB, maxmem: 16 * GiB, disk: 20 * GiB, maxdisk: 100 * GiB, uptime: 90000 },
      { node: 'pve-lenovo1', status: 'online', cpu: 0.1, maxcpu: 4, mem: 4 * GiB, maxmem: 8 * GiB, disk: 10 * GiB, maxdisk: 100 * GiB, uptime: 90000 },
      { node: 'pve-lenovo2', status: 'offline', cpu: null, maxcpu: 4, mem: null, maxmem: 8 * GiB, disk: null, maxdisk: 100 * GiB, uptime: null },
    ],
  },
  '/api2/json/nodes/pve-dell/status': {
    data: {
      cpuinfo: { cpus: 8, model: 'Intel(R) Core(TM) i5-8500T', sockets: 1 },
      memory: { total: 16 * GiB, used: 8 * GiB },
      rootfs: { total: 100 * GiB, used: 20 * GiB },
      uptime: 90000,
      loadavg: ['0.42', '0.35', '0.30'],
      kversion: 'Linux 6.8.12-4-pve',
      pveversion: 'pve-manager/8.4.1',
      wait: 0.012,
    },
  },
  '/api2/json/nodes/pve-lenovo1/status': {
    data: {
      cpuinfo: { cpus: 4, model: 'Intel(R) Core(TM) i5-7500', sockets: 1 },
      memory: { total: 8 * GiB, used: 4 * GiB },
      rootfs: { total: 100 * GiB, used: 10 * GiB },
      uptime: 90000,
      loadavg: ['0.10', '0.12', '0.09'],
      kversion: 'Linux 6.8.12-4-pve',
      pveversion: 'pve-manager/8.4.1',
      wait: 0,
    },
  },
  '/api2/json/cluster/resources?type=vm': {
    data: [
      { id: 'qemu/100', type: 'qemu', vmid: 100, name: 'home-assistant', node: 'pve-dell', status: 'running', cpu: 0.04, maxcpu: 2, mem: 2 * GiB, maxmem: 4 * GiB, maxdisk: 32 * GiB, uptime: 80000, template: 0 },
      { id: 'qemu/110', type: 'qemu', vmid: 110, name: 'hermes-core', node: 'pve-dell', status: 'running', cpu: 0.02, maxcpu: 2, mem: 1 * GiB, maxmem: 4 * GiB, maxdisk: 32 * GiB, uptime: 70000, template: 0 },
      { id: 'qemu/120', type: 'qemu', vmid: 120, name: 'nuga-ops', node: 'pve-lenovo1', status: 'running', cpu: 0.03, maxcpu: 2, mem: 1 * GiB, maxmem: 4 * GiB, maxdisk: 40 * GiB, uptime: 60000, template: 0 },
      { id: 'qemu/900', type: 'qemu', vmid: 900, name: 'ubuntu-template', node: 'pve-dell', status: 'stopped', cpu: 0, maxcpu: 2, mem: 0, maxmem: 2 * GiB, maxdisk: 8 * GiB, uptime: 0, template: 1 },
      { id: 'lxc/200', type: 'lxc', vmid: 200, name: 'test-ct', node: 'pve-lenovo1', status: 'stopped', cpu: 0, maxcpu: 1, mem: 0, maxmem: 512 * 1024 * 1024, maxdisk: 8 * GiB, uptime: 0, template: 0 },
    ],
  },
  '/api2/json/cluster/resources?type=storage': {
    data: [
      { id: 'storage/pve-dell/local', node: 'pve-dell', storage: 'local', plugintype: 'dir', status: 'available', content: 'iso,vztmpl,backup', disk: 10 * GiB, maxdisk: 100 * GiB, shared: 0 },
      { id: 'storage/pve-dell/local-lvm', node: 'pve-dell', storage: 'local-lvm', plugintype: 'lvmthin', status: 'available', content: 'images,rootdir', disk: 40 * GiB, maxdisk: 200 * GiB, shared: 0 },
    ],
  },
};

describe('Proxmox normalisation', () => {
  const build = (baseUrl: string) =>
    new ProxmoxService(
      {
        baseUrl,
        tokenId: 'nuga@pve!dash',
        tokenSecret: 'secret-value',
        caCert: null,
        caCertPath: null,
        tlsServername: null,
      },
      5000,
      logger,
      0, // no caching, so each assertion sees a fresh call
    );

  it('aggregates the cluster from nodes and guests', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const snapshot = await build(upstream.url).getSnapshot();

    expect(snapshot.cluster.name).toBe('nuga-home');
    expect(snapshot.cluster.quorate).toBe(true);
    expect(snapshot.cluster.nodesTotal).toBe(3);
    expect(snapshot.cluster.nodesOnline).toBe(2);
    expect(snapshot.cluster.version).toBe('8.4.1');

    // Only online nodes contribute capacity: 8 + 4 cores.
    expect(snapshot.cluster.cpuCoresTotal).toBe(12);
    expect(snapshot.cluster.memoryTotalBytes).toBe(24 * GiB);
    expect(snapshot.cluster.memoryUsedBytes).toBe(12 * GiB);

    // Templates are excluded from guest counts.
    expect(snapshot.cluster.guests).toEqual({
      vmsRunning: 3,
      vmsTotal: 3,
      lxcRunning: 0,
      lxcTotal: 1,
    });
  });

  it('converts PVE fractions to percentages', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const snapshot = await build(upstream.url).getSnapshot();

    const dell = snapshot.nodes.find((n) => n.name === 'pve-dell')!;
    expect(dell.cpuUsagePct).toBe(25); // cpu: 0.25
    expect(dell.ioDelayPct).toBe(1.2); // wait: 0.012
    expect(dell.loadAverage).toEqual([0.42, 0.35, 0.3]);
    expect(dell.cpuModel).toContain('i5-8500T');
  });

  it('reports unknown values as null rather than zero', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const snapshot = await build(upstream.url).getSnapshot();

    const offline = snapshot.nodes.find((n) => n.name === 'pve-lenovo2')!;
    expect(offline.online).toBe(false);
    expect(offline.cpuUsagePct).toBeNull();
    expect(offline.memoryUsedBytes).toBeNull();
    // No /status call is made for an offline node, so detail fields stay null.
    expect(offline.kernelVersion).toBeNull();
    expect(offline.ioDelayPct).toBeNull();
  });

  it('never exposes a guest IP address', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const guests = await build(upstream.url).getGuests();
    expect(guests.every((g) => g.ipAddress === null)).toBe(true);
  });

  it('flags templates instead of hiding them', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const guests = await build(upstream.url).getGuests();
    expect(guests.find((g) => g.vmid === 900)?.isTemplate).toBe(true);
    expect(guests.find((g) => g.vmid === 100)?.isTemplate).toBe(false);
  });

  it('derives free space and content types for storage', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    const storage = await build(upstream.url).getStorage();
    const lvm = storage.find((s) => s.storage === 'local-lvm')!;
    expect(lvm.totalBytes).toBe(200 * GiB);
    expect(lvm.availableBytes).toBe(160 * GiB);
    expect(lvm.shared).toBe(false);
    expect(lvm.contentTypes).toEqual(['images', 'rootdir']);
  });

  it('only ever issues GET requests, with a PVEAPIToken header', async () => {
    upstream = await startFakeUpstream(PVE_ROUTES);
    await build(upstream.url).getSnapshot();
    expect(upstream.requests.length).toBeGreaterThan(0);
    expect(upstream.requests.every((r) => r.method === 'GET')).toBe(true);
    expect(upstream.requests.every((r) => r.authorization?.startsWith('PVEAPIToken='))).toBe(true);
  });

  it('degrades gracefully when the endpoint is a standalone node', async () => {
    const routes = { ...PVE_ROUTES };
    delete (routes as Record<string, unknown>)['/api2/json/cluster/status'];
    upstream = await startFakeUpstream(routes);

    const snapshot = await build(upstream.url).getSnapshot();
    expect(snapshot.cluster.name).toBeNull();
    expect(snapshot.cluster.quorate).toBeNull();
    // Node data still works.
    expect(snapshot.nodes).toHaveLength(3);
  });

  it('rejects a payload that does not match the schema', async () => {
    upstream = await startFakeUpstream({ '/api2/json/version': { unexpected: true } });
    await expect(build(upstream.url).checkAccess()).rejects.toMatchObject({
      code: 'UPSTREAM_INVALID_RESPONSE',
    });
  });
});

const HA_ROUTES = {
  '/api/config': { version: '2026.8.1', location_name: 'NUGA HOME' },
  '/api/states': [
    {
      entity_id: 'sun.sun',
      state: 'above_horizon',
      attributes: { friendly_name: 'Sun' },
      last_changed: '2026-08-18T06:00:00+00:00',
    },
    {
      entity_id: 'sensor.processor_use',
      state: '12.4',
      attributes: { friendly_name: 'Processor use', unit_of_measurement: '%' },
      last_changed: '2026-08-18T08:00:00+00:00',
    },
    {
      entity_id: 'sensor.broken_probe',
      state: 'unavailable',
      attributes: { friendly_name: 'Broken probe' },
      last_changed: null,
    },
    {
      entity_id: 'binary_sensor.remote_ui',
      state: 'unknown',
      attributes: { friendly_name: 'Remote UI', device_class: 'connectivity' },
      last_changed: '2026-08-18T07:00:00+00:00',
    },
    {
      entity_id: 'person.ramiro',
      state: 'home',
      attributes: { friendly_name: 'Ramiro' },
      last_changed: '2026-08-18T05:00:00+00:00',
    },
  ],
};

describe('Home Assistant normalisation', () => {
  const build = (baseUrl: string) =>
    new HomeAssistantService({ baseUrl, token: 'long-lived-token' }, 5000, logger, 0);

  it('counts entities, domains and unavailable states separately', async () => {
    upstream = await startFakeUpstream(HA_ROUTES);
    const summary = await build(upstream.url).getSummary();

    expect(summary.version).toBe('2026.8.1');
    expect(summary.locationName).toBe('NUGA HOME');
    expect(summary.entitiesTotal).toBe(5);
    expect(summary.entitiesUnavailable).toBe(1);
    expect(summary.entitiesUnknown).toBe(1);

    const sensors = summary.domains.find((d) => d.domain === 'sensor')!;
    expect(sensors.total).toBe(2);
    expect(sensors.unavailable).toBe(1);
  });

  it('reports a genuine zero for categories with no devices', async () => {
    upstream = await startFakeUpstream(HA_ROUTES);
    const summary = await build(upstream.url).getSummary();

    // This installation has no physical devices yet; zero is the correct answer.
    expect(summary.categories.lights).toBe(0);
    expect(summary.categories.locks).toBe(0);
    expect(summary.categories.cameras).toBe(0);
    expect(summary.categories.sensors).toBe(2);
    expect(summary.categories.persons).toBe(1);
  });

  it('marks unavailable and unknown entities as not available', async () => {
    upstream = await startFakeUpstream(HA_ROUTES);
    const entities = await build(upstream.url).getEntities();

    expect(entities.find((e) => e.entityId === 'sensor.broken_probe')?.available).toBe(false);
    expect(entities.find((e) => e.entityId === 'binary_sensor.remote_ui')?.available).toBe(false);
    expect(entities.find((e) => e.entityId === 'sun.sun')?.available).toBe(true);
    expect(entities.find((e) => e.entityId === 'sensor.processor_use')?.unit).toBe('%');
  });

  it('sends a bearer token and only reads', async () => {
    upstream = await startFakeUpstream(HA_ROUTES);
    await build(upstream.url).getSummary();
    expect(upstream.requests.every((r) => r.method === 'GET')).toBe(true);
    expect(upstream.requests.every((r) => r.authorization === 'Bearer long-lived-token')).toBe(true);
  });
});
