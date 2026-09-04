/**
 * UniFi Network official local API integration — STRICTLY READ-ONLY.
 *
 * The service exposes a closed allow-list of GET paths only. No generic
 * upstream proxy exists and no actions/configuration endpoints are reachable
 * through this class.
 */
import { z } from 'zod';
import type {
  UnifiClientDto,
  UnifiDeviceDto,
  UnifiNetworkDto,
  UnifiSummaryDto,
  UnifiWanDto,
} from '../../shared/api.js';
import type { UnifiConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { createTlsAgent, requestJson } from '../http.js';
import type { Logger } from '../logger.js';

const LABEL = 'UniFi Network';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const numeric = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const infoSchema = z
  .object({
    applicationVersion: z.string().nullish(),
  })
  .passthrough();

const siteSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullish(),
  })
  .passthrough();

const deviceSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullish(),
    model: z.string().nullish(),
    ipAddress: z.string().nullish(),
    state: z.string().nullish(),
    firmwareVersion: z.string().nullish(),
    firmwareUpdatable: z.boolean().nullish(),
  })
  .passthrough();

const deviceStatsSchema = z
  .object({
    uptimeSec: numeric,
    cpuUtilizationPct: numeric,
    memoryUtilizationPct: numeric,
    uplink: z
      .object({
        txRateBps: numeric,
        rxRateBps: numeric,
      })
      .nullish(),
  })
  .passthrough();

const clientSchema = z
  .object({
    id: z.string().uuid(),
    type: z.string().nullish(),
    name: z.string().nullish(),
    ipAddress: z.string().nullish(),
    macAddress: z.string().nullish(),
    connectedAt: z.string().nullish(),
  })
  .passthrough();

const networkSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullish(),
    management: z.string().nullish(),
    enabled: z.boolean().nullish(),
    vlanId: numeric,
    default: z.boolean().nullish(),
  })
  .passthrough();

const wanSchema = z
  .object({
    id: z.string().nullish(),
    name: z.string().nullish(),
  })
  .passthrough();

const listSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      data: z.array(item),
      count: numeric.optional(),
      totalCount: numeric.optional(),
    })
    .passthrough();

function assertAllowedPath(path: string): void {
  const allowed =
    path === '/v1/info' ||
    path === '/v1/sites?limit=200' ||
    /^\/v1\/sites\/[0-9a-f-]+\/(devices|clients|networks|wifi\/broadcasts|wans)\?limit=200$/i.test(
      path,
    ) ||
    /^\/v1\/sites\/[0-9a-f-]+\/devices\/[0-9a-f-]+\/statistics\/latest$/i.test(path);

  if (!allowed) {
    throw new Error(`UniFi path is not in the read-only allow-list: ${path}`);
  }
}

function requireUuid(value: string, label: string): string {
  if (!UUID_RE.test(value)) {
    throw new UpstreamError(
      'UPSTREAM_INVALID_RESPONSE',
      `UniFi Network returned an invalid ${label}.`,
    );
  }
  return value;
}

export class UnifiService {
  readonly #dispatcher: ReturnType<typeof createTlsAgent>;

  constructor(
    private readonly config: UnifiConfig,
    private readonly timeoutMs: number,
    private readonly logger: Logger,
  ) {
    this.#dispatcher = createTlsAgent({
      caCert: config.caCert,
      servername: config.tlsServername,
      timeoutMs,
    });
  }

  async #get<T extends z.ZodTypeAny>(
    path: string,
    schema: T,
  ): Promise<z.infer<T>> {
    assertAllowedPath(path);

    const raw = await requestJson(`${this.config.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
      },
      timeoutMs: this.timeoutMs,
      dispatcher: this.#dispatcher,
      label: LABEL,
    });

    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn('UniFi response failed validation', { path });
      throw new UpstreamError(
        'UPSTREAM_INVALID_RESPONSE',
        `${LABEL} returned an unexpected payload for ${path}.`,
      );
    }

    return parsed.data;
  }

  async getSummary(): Promise<UnifiSummaryDto> {
    const [info, sites] = await Promise.all([
      this.#get('/v1/info', infoSchema),
      this.#get('/v1/sites?limit=200', listSchema(siteSchema)),
    ]);

    const site = sites.data[0];

    if (!site) {
      throw new UpstreamError(
        'UPSTREAM_INVALID_RESPONSE',
        'UniFi Network returned no local sites.',
      );
    }

    const siteId = requireUuid(site.id, 'site ID');

    const [deviceList, clientList, networkList, wifiList, wanList] =
      await Promise.all([
        this.#get(
          `/v1/sites/${siteId}/devices?limit=200`,
          listSchema(deviceSchema),
        ),
        this.#get(
          `/v1/sites/${siteId}/clients?limit=200`,
          listSchema(clientSchema),
        ),
        this.#get(
          `/v1/sites/${siteId}/networks?limit=200`,
          listSchema(networkSchema),
        ),
        this.#get(
          `/v1/sites/${siteId}/wifi/broadcasts?limit=200`,
          listSchema(z.object({}).passthrough()),
        ),
        this.#get(
          `/v1/sites/${siteId}/wans?limit=200`,
          listSchema(wanSchema),
        ),
      ]);

    const devices: UnifiDeviceDto[] = await Promise.all(
      deviceList.data.map(async (device) => {
        const deviceId = requireUuid(device.id, 'device ID');

        let stats: z.infer<typeof deviceStatsSchema> | null = null;

        try {
          stats = await this.#get(
            `/v1/sites/${siteId}/devices/${deviceId}/statistics/latest`,
            deviceStatsSchema,
          );
        } catch (error) {
          this.logger.warn('UniFi device statistics unavailable', {
            deviceId,
            reason: error instanceof Error ? error.message : 'unknown',
          });
        }

        return {
          id: device.id,
          name: device.name ?? null,
          model: device.model ?? null,
          ipAddress: device.ipAddress ?? null,
          state: device.state ?? null,
          firmwareVersion: device.firmwareVersion ?? null,
          firmwareUpdatable: device.firmwareUpdatable ?? null,
          uptimeSec: stats?.uptimeSec ?? null,
          cpuUtilizationPct: stats?.cpuUtilizationPct ?? null,
          memoryUtilizationPct: stats?.memoryUtilizationPct ?? null,
          txRateBps: stats?.uplink?.txRateBps ?? null,
          rxRateBps: stats?.uplink?.rxRateBps ?? null,
        };
      }),
    );

    const clients: UnifiClientDto[] = clientList.data.map((client) => ({
      id: client.id,
      type: client.type ?? null,
      name: client.name ?? null,
      ipAddress: client.ipAddress ?? null,
      macAddress: client.macAddress ?? null,
      connectedAt: client.connectedAt ?? null,
    }));

    const networks: UnifiNetworkDto[] = networkList.data.map((network) => ({
      id: network.id,
      name: network.name ?? null,
      management: network.management ?? null,
      enabled: network.enabled ?? null,
      vlanId: network.vlanId ?? null,
      default: network.default ?? null,
    }));

    const wans: UnifiWanDto[] = wanList.data.map((wan) => ({
      id: wan.id ?? null,
      name: wan.name ?? null,
    }));

    return {
      applicationVersion: info.applicationVersion ?? null,
      siteId,
      siteName: site.name ?? null,
      devices,
      clients,
      networks,
      wans,
      wifiBroadcastCount: wifiList.data.length,
      checkedAt: new Date().toISOString(),
    };
  }
}
