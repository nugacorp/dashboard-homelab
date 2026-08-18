/**
 * Proxmox VE integration - STRICTLY READ-ONLY.
 *
 * Only GET requests are issued. There is no start/stop/reboot/migrate/snapshot
 * code path in this file, by design: the API token this dashboard uses is meant
 * to hold PVEAuditor and nothing more.
 *
 * Every upstream payload is parsed with zod before it is mapped to our DTOs.
 * Fields Proxmox does not provide (guest IPs, CPU package temperatures) are
 * returned as null rather than invented.
 */
import { z } from 'zod';
import type {
  ProxmoxClusterDto,
  ProxmoxGuestCounts,
  ProxmoxGuestDto,
  ProxmoxGuestStatus,
  ProxmoxNodeDto,
  ProxmoxStorageDto,
} from '../../shared/api.js';
import { TtlCache } from '../cache.js';
import type { ProxmoxConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { createTlsAgent, probe, requestJson, type ProbeResult } from '../http.js';
import type { Logger } from '../logger.js';

const LABEL = 'Proxmox';

/** PVE node names are hostnames; anything else must not reach a URL path. */
const NODE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;

/* --------------------------------------------------------- upstream schemas */

/** PVE wraps every payload in { data: ... }. */
const envelope = <T extends z.ZodTypeAny>(inner: T) => z.object({ data: inner });

/** PVE returns numbers as numbers, but occasionally as numeric strings. */
const numeric = z.union([z.number(), z.string()]).nullish().transform((v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
});

const versionSchema = envelope(
  z.object({
    version: z.string().nullish(),
    release: z.string().nullish(),
  }),
);

const clusterStatusSchema = envelope(
  z.array(
    z.object({
      type: z.string(),
      id: z.string().nullish(),
      name: z.string().nullish(),
      nodes: numeric,
      quorate: numeric,
      online: numeric,
      ip: z.string().nullish(),
      local: numeric,
    }),
  ),
);

const nodesSchema = envelope(
  z.array(
    z.object({
      node: z.string(),
      status: z.string().nullish(),
      cpu: numeric,
      maxcpu: numeric,
      mem: numeric,
      maxmem: numeric,
      disk: numeric,
      maxdisk: numeric,
      uptime: numeric,
    }),
  ),
);

const nodeStatusSchema = envelope(
  z.object({
    cpuinfo: z
      .object({ cpus: numeric, model: z.string().nullish(), sockets: numeric })
      .nullish(),
    memory: z.object({ total: numeric, used: numeric }).nullish(),
    rootfs: z.object({ total: numeric, used: numeric }).nullish(),
    uptime: numeric,
    loadavg: z.array(z.union([z.number(), z.string()])).nullish(),
    kversion: z.string().nullish(),
    pveversion: z.string().nullish(),
    wait: numeric,
  }),
);

const guestResourceSchema = envelope(
  z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      vmid: numeric,
      name: z.string().nullish(),
      node: z.string().nullish(),
      status: z.string().nullish(),
      cpu: numeric,
      maxcpu: numeric,
      mem: numeric,
      maxmem: numeric,
      maxdisk: numeric,
      uptime: numeric,
      template: numeric,
    }),
  ),
);

const storageResourceSchema = envelope(
  z.array(
    z.object({
      id: z.string(),
      storage: z.string().nullish(),
      node: z.string().nullish(),
      plugintype: z.string().nullish(),
      type: z.string().nullish(),
      status: z.string().nullish(),
      content: z.string().nullish(),
      disk: numeric,
      maxdisk: numeric,
      shared: numeric,
    }),
  ),
);

/* ------------------------------------------------------------- normalisers */

function toPct(fraction: number | null): number | null {
  if (fraction === null) return null;
  return Math.round(fraction * 1000) / 10;
}

function toGuestStatus(raw: string | null | undefined): ProxmoxGuestStatus {
  switch (raw) {
    case 'running':
      return 'running';
    case 'stopped':
      return 'stopped';
    case 'paused':
    case 'suspended':
      return 'paused';
    default:
      return 'unknown';
  }
}

function emptyCounts(): ProxmoxGuestCounts {
  return { vmsRunning: 0, vmsTotal: 0, lxcRunning: 0, lxcTotal: 0 };
}

function countGuests(guests: ProxmoxGuestDto[]): ProxmoxGuestCounts {
  const counts = emptyCounts();
  for (const g of guests) {
    if (g.isTemplate) continue;
    if (g.type === 'qemu') {
      counts.vmsTotal += 1;
      if (g.status === 'running') counts.vmsRunning += 1;
    } else {
      counts.lxcTotal += 1;
      if (g.status === 'running') counts.lxcRunning += 1;
    }
  }
  return counts;
}

function parseLoadAverage(raw: unknown): [number, number, number] | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const values = raw.slice(0, 3).map((v) => Number(v));
  if (values.some((v) => !Number.isFinite(v))) return null;
  return [values[0]!, values[1]!, values[2]!];
}

/* ------------------------------------------------------------------ service */

export interface ProxmoxSnapshot {
  cluster: ProxmoxClusterDto;
  nodes: ProxmoxNodeDto[];
  guests: ProxmoxGuestDto[];
}

export class ProxmoxService {
  readonly #config: ProxmoxConfig;
  readonly #timeoutMs: number;
  readonly #logger: Logger;
  readonly #dispatcher: ReturnType<typeof createTlsAgent>;
  readonly #cache: TtlCache;

  constructor(config: ProxmoxConfig, timeoutMs: number, logger: Logger, cacheTtlMs = 5000) {
    this.#config = config;
    this.#timeoutMs = timeoutMs;
    this.#logger = logger;
    this.#dispatcher = createTlsAgent({
      caCert: config.caCert,
      servername: config.tlsServername,
      timeoutMs,
    });
    this.#cache = new TtlCache(cacheTtlMs);
  }

  get #authHeader(): string {
    return `PVEAPIToken=${this.#config.tokenId}=${this.#config.tokenSecret}`;
  }

  async #get<T extends z.ZodTypeAny>(path: string, schema: T): Promise<z.infer<T>> {
    const url = `${this.#config.baseUrl}/api2/json${path}`;
    const raw = await requestJson(url, {
      method: 'GET',
      headers: { authorization: this.#authHeader },
      timeoutMs: this.#timeoutMs,
      dispatcher: this.#dispatcher,
      label: LABEL,
    });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      this.#logger.warn('Proxmox response failed validation', {
        path,
        issues: parsed.error.issues.slice(0, 3).map((i) => i.path.join('.')).join(','),
      });
      throw new UpstreamError(
        'UPSTREAM_INVALID_RESPONSE',
        `${LABEL} returned an unexpected payload for ${path}.`,
      );
    }
    return parsed.data;
  }

  /** Unauthenticated reachability probe used by /api/health/ready. */
  async probe(): Promise<ProbeResult> {
    return probe(`${this.#config.baseUrl}/api2/json/version`, this.#timeoutMs, this.#dispatcher);
  }

  /** Authenticated check: proves the token works and the privileges are enough. */
  async checkAccess(): Promise<{ version: string | null }> {
    const version = await this.#get('/version', versionSchema);
    return { version: version.data.version ?? null };
  }

  async getGuests(): Promise<ProxmoxGuestDto[]> {
    return this.#cache.get('guests', async () => {
      const res = await this.#get('/cluster/resources?type=vm', guestResourceSchema);
      return res.data
        .filter((r) => r.type === 'qemu' || r.type === 'lxc')
        .map<ProxmoxGuestDto>((r) => ({
          vmid: r.vmid ?? 0,
          name: r.name ?? `guest-${r.vmid ?? 0}`,
          node: r.node ?? 'unknown',
          type: r.type === 'lxc' ? 'lxc' : 'qemu',
          status: toGuestStatus(r.status),
          cpuCores: r.maxcpu,
          cpuUsagePct: toPct(r.cpu),
          memoryUsedBytes: r.mem,
          memoryTotalBytes: r.maxmem,
          diskTotalBytes: r.maxdisk,
          uptimeSeconds: r.uptime,
          isTemplate: r.template === 1,
          ipAddress: null,
        }))
        .sort((a, b) => a.vmid - b.vmid);
    });
  }

  async getStorage(): Promise<ProxmoxStorageDto[]> {
    return this.#cache.get('storage', async () => {
      const res = await this.#get('/cluster/resources?type=storage', storageResourceSchema);
      return res.data
        .map<ProxmoxStorageDto>((r) => ({
          id: r.id,
          storage: r.storage ?? r.id,
          node: r.node ?? 'unknown',
          type: r.plugintype ?? r.type ?? 'unknown',
          status: r.status ?? null,
          totalBytes: r.maxdisk,
          usedBytes: r.disk,
          availableBytes:
            r.maxdisk !== null && r.disk !== null ? Math.max(0, r.maxdisk - r.disk) : null,
          shared: r.shared === 1,
          contentTypes: (r.content ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        }))
        .sort((a, b) => a.node.localeCompare(b.node) || a.storage.localeCompare(b.storage));
    });
  }

  /**
   * Cluster + per-node detail + guests in one shot. Node detail is fetched in
   * parallel and a single failing node degrades that node only.
   */
  async getSnapshot(): Promise<ProxmoxSnapshot> {
    return this.#cache.get('snapshot', async () => {
      const [clusterStatus, nodeList, guests, version] = await Promise.all([
        this.#getClusterStatusSafe(),
        this.#get('/nodes', nodesSchema),
        this.getGuests(),
        this.#getVersionSafe(),
      ]);

      const guestsByNode = new Map<string, ProxmoxGuestDto[]>();
      for (const g of guests) {
        const list = guestsByNode.get(g.node) ?? [];
        list.push(g);
        guestsByNode.set(g.node, list);
      }

      const clusterEntry = clusterStatus?.find((e) => e.type === 'cluster') ?? null;
      const nodeEntries = clusterStatus?.filter((e) => e.type === 'node') ?? [];
      const ipByNode = new Map<string, string>();
      for (const entry of nodeEntries) {
        if (entry.name && entry.ip) ipByNode.set(entry.name, entry.ip);
      }

      const details = await Promise.all(
        nodeList.data.map(async (n) => {
          if (n.status !== 'online') return null;
          try {
            return await this.#getNodeStatus(n.node);
          } catch (err) {
            this.#logger.warn('Proxmox node detail unavailable', {
              node: n.node,
              reason: err instanceof Error ? err.message : 'unknown',
            });
            return null;
          }
        }),
      );

      const nodes = nodeList.data.map<ProxmoxNodeDto>((n, index) => {
        const detail = details[index];
        const nodeGuests = guestsByNode.get(n.node) ?? [];
        return {
          id: `node/${n.node}`,
          name: n.node,
          online: n.status === 'online',
          ip: ipByNode.get(n.node) ?? null,
          cpuModel: detail?.data.cpuinfo?.model ?? null,
          cpuCores: detail?.data.cpuinfo?.cpus ?? n.maxcpu,
          cpuUsagePct: toPct(n.cpu),
          memoryTotalBytes: detail?.data.memory?.total ?? n.maxmem,
          memoryUsedBytes: detail?.data.memory?.used ?? n.mem,
          rootfsTotalBytes: detail?.data.rootfs?.total ?? n.maxdisk,
          rootfsUsedBytes: detail?.data.rootfs?.used ?? n.disk,
          uptimeSeconds: detail?.data.uptime ?? n.uptime,
          loadAverage: parseLoadAverage(detail?.data.loadavg),
          kernelVersion: detail?.data.kversion ?? null,
          pveVersion: detail?.data.pveversion ?? null,
          ioDelayPct: toPct(detail?.data.wait ?? null),
          guests: countGuests(nodeGuests),
        };
      });

      const onlineNodes = nodes.filter((n) => n.online);
      const cpuCoresTotal = onlineNodes.reduce((sum, n) => sum + (n.cpuCores ?? 0), 0);
      const weightedCpu = onlineNodes.reduce(
        (sum, n) => sum + (n.cpuUsagePct ?? 0) * (n.cpuCores ?? 0),
        0,
      );

      const cluster: ProxmoxClusterDto = {
        name: clusterEntry?.name ?? null,
        quorate: clusterEntry ? clusterEntry.quorate === 1 : null,
        nodesOnline: onlineNodes.length,
        nodesTotal: nodes.length,
        version,
        cpuCoresTotal,
        cpuUsagePct:
          cpuCoresTotal > 0 ? Math.round((weightedCpu / cpuCoresTotal) * 10) / 10 : null,
        memoryTotalBytes: onlineNodes.reduce((s, n) => s + (n.memoryTotalBytes ?? 0), 0),
        memoryUsedBytes: onlineNodes.reduce((s, n) => s + (n.memoryUsedBytes ?? 0), 0),
        guests: countGuests(guests),
      };

      return { cluster, nodes, guests };
    });
  }

  async #getNodeStatus(node: string) {
    if (!NODE_NAME_RE.test(node)) {
      throw new UpstreamError(
        'UPSTREAM_INVALID_RESPONSE',
        `${LABEL} returned an unusable node name.`,
      );
    }
    return this.#get(`/nodes/${encodeURIComponent(node)}/status`, nodeStatusSchema);
  }

  /**
   * `/cluster/status` is unavailable on standalone hosts. That is a legitimate
   * topology, not an error, so we degrade to "no cluster metadata".
   */
  async #getClusterStatusSafe() {
    try {
      const res = await this.#get('/cluster/status', clusterStatusSchema);
      return res.data;
    } catch (err) {
      this.#logger.debug('Proxmox cluster status unavailable', {
        reason: err instanceof Error ? err.message : 'unknown',
      });
      return null;
    }
  }

  async #getVersionSafe(): Promise<string | null> {
    try {
      const res = await this.#get('/version', versionSchema);
      return res.data.version ?? null;
    } catch {
      return null;
    }
  }
}
