/**
 * Home Assistant integration - STRICTLY READ-ONLY for v1.
 *
 * Only GET /api/, GET /api/config and GET /api/states are used. There is no
 * `callService` here and no POST path of any kind: turning a light on from the
 * dashboard is deliberately out of scope until the write story is designed.
 *
 * Note on the base URL: this installation answers on port 80
 * (http://192.168.1.158/api/), not the default 8123, which is why the port is
 * part of HASS_URL rather than being assumed.
 */
import { z } from 'zod';
import type {
  HomeAssistantCategoryCounts,
  HomeAssistantDomainDto,
  HomeAssistantEntityDto,
  HomeAssistantSummaryDto,
} from '../../shared/api.js';
import { TtlCache } from '../cache.js';
import type { HomeAssistantConfig } from '../config.js';
import { UpstreamError } from '../errors.js';
import { probe, requestJson, type ProbeResult } from '../http.js';
import type { Logger } from '../logger.js';

const LABEL = 'Home Assistant';

const configSchema = z.object({
  version: z.string().nullish(),
  location_name: z.string().nullish(),
});

const stateSchema = z.object({
  entity_id: z.string(),
  state: z.string(),
  attributes: z.record(z.unknown()).nullish(),
  last_changed: z.string().nullish(),
});

const statesSchema = z.array(stateSchema);

/** States Home Assistant uses to mean "no usable value". */
const UNAVAILABLE = 'unavailable';
const UNKNOWN = 'unknown';

function attrString(attributes: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = attributes?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function emptyCategories(): HomeAssistantCategoryCounts {
  return {
    lights: 0,
    switches: 0,
    sensors: 0,
    binarySensors: 0,
    climate: 0,
    locks: 0,
    cameras: 0,
    mediaPlayers: 0,
    persons: 0,
    automations: 0,
  };
}

const DOMAIN_TO_CATEGORY: Record<string, keyof HomeAssistantCategoryCounts> = {
  light: 'lights',
  switch: 'switches',
  sensor: 'sensors',
  binary_sensor: 'binarySensors',
  climate: 'climate',
  lock: 'locks',
  camera: 'cameras',
  media_player: 'mediaPlayers',
  person: 'persons',
  automation: 'automations',
};

export class HomeAssistantService {
  readonly #config: HomeAssistantConfig;
  readonly #timeoutMs: number;
  readonly #logger: Logger;
  readonly #cache: TtlCache;

  constructor(config: HomeAssistantConfig, timeoutMs: number, logger: Logger, cacheTtlMs = 5000) {
    this.#config = config;
    this.#timeoutMs = timeoutMs;
    this.#logger = logger;
    this.#cache = new TtlCache(cacheTtlMs);
  }

  async #get<T extends z.ZodTypeAny>(path: string, schema: T): Promise<z.infer<T>> {
    const raw = await requestJson(`${this.#config.baseUrl}${path}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${this.#config.token}` },
      timeoutMs: this.#timeoutMs,
      label: LABEL,
    });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      this.#logger.warn('Home Assistant response failed validation', {
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

  async probe(): Promise<ProbeResult> {
    return probe(`${this.#config.baseUrl}/api/`, this.#timeoutMs);
  }

  /** Authenticated check that the long-lived token is accepted. */
  async checkAccess(): Promise<{ version: string | null }> {
    const config = await this.#get('/api/config', configSchema);
    return { version: config.version ?? null };
  }

  async getEntities(): Promise<HomeAssistantEntityDto[]> {
    return this.#cache.get('states', async () => {
      const states = await this.#get('/api/states', statesSchema);
      return states
        .map<HomeAssistantEntityDto>((s) => {
          const domain = s.entity_id.split('.')[0] ?? 'unknown';
          return {
            entityId: s.entity_id,
            domain,
            friendlyName: attrString(s.attributes, 'friendly_name') ?? s.entity_id,
            state: s.state,
            unit: attrString(s.attributes, 'unit_of_measurement'),
            deviceClass: attrString(s.attributes, 'device_class'),
            lastChanged: s.last_changed ?? null,
            available: s.state !== UNAVAILABLE && s.state !== UNKNOWN,
          };
        })
        .sort((a, b) => a.entityId.localeCompare(b.entityId));
    });
  }

  async getSummary(): Promise<HomeAssistantSummaryDto> {
    return this.#cache.get('summary', async () => {
      const [config, entities] = await Promise.all([
        this.#get('/api/config', configSchema),
        this.getEntities(),
      ]);

      const byDomain = new Map<string, HomeAssistantDomainDto>();
      const categories = emptyCategories();
      let unavailable = 0;
      let unknown = 0;

      for (const entity of entities) {
        const bucket = byDomain.get(entity.domain) ?? {
          domain: entity.domain,
          total: 0,
          unavailable: 0,
        };
        bucket.total += 1;
        if (entity.state === UNAVAILABLE) {
          bucket.unavailable += 1;
          unavailable += 1;
        }
        if (entity.state === UNKNOWN) unknown += 1;
        byDomain.set(entity.domain, bucket);

        const category = DOMAIN_TO_CATEGORY[entity.domain];
        if (category) categories[category] += 1;
      }

      return {
        version: config.version ?? null,
        locationName: config.location_name ?? null,
        entitiesTotal: entities.length,
        entitiesUnavailable: unavailable,
        entitiesUnknown: unknown,
        domains: [...byDomain.values()].sort((a, b) => b.total - a.total || a.domain.localeCompare(b.domain)),
        categories,
      };
    });
  }
}
