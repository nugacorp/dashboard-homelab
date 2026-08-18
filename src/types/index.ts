/**
 * Frontend types.
 *
 * The data model lives in `shared/api.ts` and is owned by the backend contract.
 * This file re-exports it so components can import from one place, and adds the
 * few types that are purely about presentation.
 *
 * The previous version of this file described a homelab that does not exist
 * (UniFi, Starlink, Frigate, TrueNAS, Immich, energy metering). Those shapes
 * were removed with their mock data; they will come back, derived from a real
 * upstream, when those systems are actually deployed.
 */

export type {
  ApiEnvelope,
  ApiError,
  HealthStatus,
  HermesChatResponseDto,
  HermesStatusDto,
  HomeAssistantCategoryCounts,
  HomeAssistantDomainDto,
  HomeAssistantEntityDto,
  HomeAssistantSummaryDto,
  IntegrationHealth,
  IntegrationKey,
  IntegrationState,
  LiveResponse,
  ProxmoxClusterDto,
  ProxmoxGuestCounts,
  ProxmoxGuestDto,
  ProxmoxGuestStatus,
  ProxmoxGuestType,
  ProxmoxNodeDto,
  ProxmoxStorageDto,
  ReadyResponse,
  SessionResponse,
  UptimeKumaStatusDto,
} from '@shared/api';

/** A chat turn rendered in the Hermes view. Local to the browser session. */
export interface HermesMessage {
  id: string;
  sender: 'user' | 'hermes' | 'system';
  timestamp: string;
  text: string;
  /** Set when the turn represents a failure rather than an answer. */
  isError?: boolean;
}
