/**
 * Wires configuration into service instances once, at boot.
 *
 * A service is `null` when its integration is not configured. Routes branch on
 * that null instead of guessing, which is what keeps "not configured" and
 * "broken" as two distinct, honest states throughout the stack.
 */
import type { AppConfig } from './config.js';
import { registerSecret, type Logger } from './logger.js';
import { HermesService } from './services/hermes.js';
import { HomeAssistantService } from './services/homeAssistant.js';
import { NetworkService } from './services/network.js';
import { ProxmoxService } from './services/proxmox.js';
import { UptimeKumaService } from './services/uptimeKuma.js';
import { UnifiService } from './services/unifi.js';

export interface ServerContext {
  config: AppConfig;
  logger: Logger;
  proxmox: ProxmoxService | null;
  homeAssistant: HomeAssistantService | null;
  hermes: HermesService | null;
  uptimeKuma: UptimeKumaService | null;
  network: NetworkService | null;
  unifi: UnifiService | null;
  startedAt: number;
}

export function createContext(config: AppConfig, logger: Logger): ServerContext {
  // Teach the logger which strings must never appear in output.
  registerSecret(config.proxmox?.tokenSecret);
  registerSecret(config.homeAssistant?.token);
  registerSecret(config.hermes?.apiKey);
  registerSecret(config.uptimeKumaApiKey);
  registerSecret(config.unifi?.apiKey);
  registerSecret(config.auth?.sessionSecret);
  registerSecret(config.auth?.passwordHash);

  return {
    config,
    logger,
    proxmox: config.proxmox
      ? new ProxmoxService(config.proxmox, config.upstreamTimeoutMs, logger)
      : null,
    homeAssistant: config.homeAssistant
      ? new HomeAssistantService(config.homeAssistant, config.upstreamTimeoutMs, logger)
      : null,
    hermes: config.hermes
      ? new HermesService(
          config.hermes,
          config.upstreamTimeoutMs,
          config.hermesChatTimeoutMs,
        )
      : null,
    uptimeKuma: config.uptimeKumaUrl
      ? new UptimeKumaService(
          config.uptimeKumaUrl,
          config.uptimeKumaApiKey,
          config.upstreamTimeoutMs,
        )
      : null,
    network: config.network
      ? new NetworkService(config.network, config.upstreamTimeoutMs)
      : null,
    unifi: config.unifi
      ? new UnifiService(
          config.unifi,
          config.upstreamTimeoutMs,
          logger,
        )
      : null,
    startedAt: Date.now(),
  };
}
