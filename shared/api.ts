/**
 * NUGA HOME - API contract shared by the Express backend and the React frontend.
 *
 * These DTOs are OWNED BY THIS APPLICATION. Upstream payloads (Proxmox, Home
 * Assistant, Hermes) are validated and normalised in the backend before being
 * mapped onto these shapes, so the frontend never consumes raw upstream JSON.
 *
 * Conventions:
 *  - `null` means "the upstream genuinely does not expose this value".
 *    It is NOT the same as `0`, and the UI must render it as "n/d", never as 0.
 *  - Byte and second units are always explicit in the field name.
 *  - Percentages are 0-100 floats.
 */

export type IntegrationKey = 'proxmox' | 'homeAssistant' | 'hermes' | 'uptimeKuma';

/** Lifecycle of an integration as reported by the backend. */
export type IntegrationState =
  /** Env vars present and last probe succeeded. */
  | 'ok'
  /** Env vars absent: the feature is simply not set up. Not an error. */
  | 'not_configured'
  /** Explicitly turned off through a feature flag (Hermes). */
  | 'disabled'
  /** Configured but the last probe failed (timeout, TLS, auth, 5xx). */
  | 'unavailable';

export interface ApiError {
  /** Stable machine-readable code, e.g. UPSTREAM_TIMEOUT. */
  code: string;
  /** Human-readable, already sanitised. Never contains secrets. */
  message: string;
}

/** Envelope returned by every /api data endpoint. */
export interface ApiEnvelope<T> {
  status: IntegrationState;
  /** Populated only when status === 'ok'. */
  data: T | null;
  /** Populated only when status === 'unavailable'. */
  error: ApiError | null;
  /** ISO-8601 timestamp of when the backend produced this payload. */
  fetchedAt: string;
  source: IntegrationKey | 'nugaOps';
}

/* ------------------------------------------------------------------ health */

export type HealthStatus = 'ok' | 'degraded';

export interface IntegrationHealth {
  state: IntegrationState;
  /** Short, non-sensitive explanation shown in the UI. */
  detail: string;
  /** ISO-8601, or null when never probed. */
  checkedAt: string | null;
  /** Round-trip time of the probe in ms, when measured. */
  latencyMs: number | null;
}

export interface ReadyResponse {
  status: HealthStatus;
  version: string;
  uptimeSeconds: number;
  /** 'enabled' when local login is enforced, 'disabled' when no credentials are set. */
  auth: 'enabled' | 'disabled';
  integrations: Record<IntegrationKey, IntegrationHealth>;
}

export interface LiveResponse {
  status: 'ok';
  uptimeSeconds: number;
}

/* ----------------------------------------------------------------- proxmox */

export interface ProxmoxGuestCounts {
  vmsRunning: number;
  vmsTotal: number;
  lxcRunning: number;
  lxcTotal: number;
}

export interface ProxmoxClusterDto {
  /** Cluster name, or null when the endpoint runs standalone. */
  name: string | null;
  /** null when there is no corosync quorum (standalone node). */
  quorate: boolean | null;
  nodesOnline: number;
  nodesTotal: number;
  /** PVE version string of the API endpoint node, e.g. "8.4.1". */
  version: string | null;
  cpuCoresTotal: number;
  /** Cluster-wide CPU usage, cores-weighted. null when no node reported usage. */
  cpuUsagePct: number | null;
  memoryTotalBytes: number;
  memoryUsedBytes: number;
  guests: ProxmoxGuestCounts;
}

export interface ProxmoxNodeDto {
  id: string;
  name: string;
  online: boolean;
  ip: string | null;
  cpuModel: string | null;
  cpuCores: number | null;
  cpuUsagePct: number | null;
  memoryTotalBytes: number | null;
  memoryUsedBytes: number | null;
  rootfsTotalBytes: number | null;
  rootfsUsedBytes: number | null;
  uptimeSeconds: number | null;
  loadAverage: [number, number, number] | null;
  kernelVersion: string | null;
  pveVersion: string | null;
  /** IO wait percentage reported by pvestatd. */
  ioDelayPct: number | null;
  guests: ProxmoxGuestCounts;
}

export type ProxmoxGuestType = 'qemu' | 'lxc';
export type ProxmoxGuestStatus = 'running' | 'stopped' | 'paused' | 'unknown';

export interface ProxmoxGuestDto {
  vmid: number;
  name: string;
  node: string;
  type: ProxmoxGuestType;
  status: ProxmoxGuestStatus;
  /** Allocated vCPU or cores. */
  cpuCores: number | null;
  cpuUsagePct: number | null;
  memoryUsedBytes: number | null;
  memoryTotalBytes: number | null;
  diskTotalBytes: number | null;
  uptimeSeconds: number | null;
  isTemplate: boolean;
  /**
   * Guest IP is NOT exposed: reading it requires the QEMU guest agent and
   * privileges beyond the read-only token this dashboard uses. Null by design.
   */
  ipAddress: null;
}

export interface ProxmoxStorageDto {
  id: string;
  storage: string;
  node: string;
  type: string;
  /** 'available' or 'unavailable' as reported by PVE, or null. */
  status: string | null;
  totalBytes: number | null;
  usedBytes: number | null;
  availableBytes: number | null;
  shared: boolean;
  contentTypes: string[];
}

/* --------------------------------------------------------- home assistant */

export interface HomeAssistantDomainDto {
  domain: string;
  total: number;
  unavailable: number;
}

export interface HomeAssistantCategoryCounts {
  lights: number;
  switches: number;
  sensors: number;
  binarySensors: number;
  climate: number;
  locks: number;
  cameras: number;
  mediaPlayers: number;
  persons: number;
  automations: number;
}

export interface HomeAssistantSummaryDto {
  version: string | null;
  locationName: string | null;
  /** Total entity count returned by /api/states. */
  entitiesTotal: number;
  entitiesUnavailable: number;
  entitiesUnknown: number;
  domains: HomeAssistantDomainDto[];
  /** Counts for the categories the dashboard surfaces. Zero is a real zero. */
  categories: HomeAssistantCategoryCounts;
}

export interface HomeAssistantEntityDto {
  entityId: string;
  domain: string;
  friendlyName: string;
  state: string;
  unit: string | null;
  deviceClass: string | null;
  /** ISO-8601 as reported by Home Assistant. */
  lastChanged: string | null;
  /** false when state is 'unavailable' or 'unknown'. */
  available: boolean;
}

/* ------------------------------------------------------------------ hermes */

export interface HermesStatusDto {
  enabled: boolean;
  reachable: boolean | null;
  version: string | null;
  platform: string | null;
  gatewayState: string | null;
  provider: string | null;
  model: string | null;
  connectedPlatforms: string[];
  activeAgents: number | null;
  gatewayBusy: boolean | null;
}

export interface HermesProviderDto {
  slug: string;
  name: string;
  isCurrent: boolean;
  authenticated: boolean;
  models: string[];
  totalModels: number;
}

export interface HermesModelsDto {
  activeProvider: string | null;
  activeModel: string | null;
  /** Model identifiers exposed by Hermes' OpenAI-compatible /v1/models. */
  apiModels: string[];
  /** Authenticated/current providers only; setup metadata is intentionally omitted. */
  providers: HermesProviderDto[];
}

export interface HermesChatRequest {
  message: string;
  /**
   * Hermes persisted session id. Null/omitted starts a new conversation.
   */
  conversationId?: string | null;
}

export interface HermesChatUsageDto {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface HermesChatResponseDto {
  reply: string;
  /**
   * Hermes persisted session id. Reuse this id on the next turn to preserve
   * the real upstream transcript and tool context.
   */
  conversationId: string | null;
  model: string | null;
  finishReason: string | null;
  usage: HermesChatUsageDto;
  receivedAt: string;
}

/* ------------------------------------------------------------ uptime kuma */

export interface UptimeKumaStatusDto {
  /** Public LAN URL, safe to render as a link. Never a token. */
  url: string;
  reachable: boolean;
  httpStatus: number | null;
}

export type UptimeKumaMonitorState =
  | 'up'
  | 'down'
  | 'pending'
  | 'maintenance'
  | 'unknown';

export interface UptimeKumaMonitorDto {
  id: string;
  name: string;
  type: string;
  state: UptimeKumaMonitorState;

  /** Current response time. null for push monitors or unavailable measurements. */
  responseTimeMs: number | null;

  /** Rolling averages exported by Kuma's Prometheus endpoint. */
  average1dMs: number | null;
  average30dMs: number | null;
  average365dMs: number | null;

  /** Present only for monitor types where Kuma exports certificate metrics. */
  certificateValid: boolean | null;
  certificateDaysRemaining: number | null;
}

export interface UptimeKumaSummaryDto {
  total: number;
  up: number;
  down: number;
  pending: number;
  maintenance: number;
  unknown: number;
}

/* -------------------------------------------------------------------- auth */

export interface SessionResponse {
  authenticated: boolean;
  username: string | null;
  /** false when no credentials are configured (LAN-open mode). */
  authRequired: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/* ------------------------------------------------------ write-guard result */

/**
 * Every mutating operation is intentionally unimplemented in v1. The backend
 * answers 403 with this body instead of pretending the action succeeded.
 */
export interface NotEnabledResponse {
  status: 'not_enabled';
  error: ApiError;
}
