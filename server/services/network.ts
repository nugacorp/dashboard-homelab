import { Resolver } from 'node:dns/promises';
import { createConnection } from 'node:net';
import type { NetworkDnsRecordDto, NetworkStatusDto } from '../../shared/api.js';
import type { NetworkConfig } from '../config.js';

const INVENTORY_NAMES = [
  'unifi',
  'nuga-ops',
  'hermes-core',
  'pve-lenovo2',
  'pve-lenovo1',
  'pve-dell',
  'nuga-dns-01',
  'hermes-team-lab',
  'home-assistant',
  'nuga-edge',
] as const;

function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Network probe timed out.')), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function probeTcp(host: string, port: number, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = createConnection({ host, port });

    let settled = false;

    const finish = (latency: number | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(latency);
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => finish(Date.now() - started));
    socket.once('timeout', () => finish(null));
    socket.once('error', () => finish(null));
  });
}

export class NetworkService {
  constructor(
    private readonly config: NetworkConfig,
    private readonly timeoutMs: number,
  ) {}

  async getStatus(): Promise<NetworkStatusDto> {
    const resolver = new Resolver();
    resolver.setServers([this.config.dnsServer]);

    const dnsStarted = Date.now();
    let dnsExternalResolution = false;
    let dnsLatencyMs: number | null = null;

    try {
      const addresses = await timeoutPromise(
        resolver.resolve4('example.com'),
        this.timeoutMs,
      );

      if (addresses.length > 0) {
        dnsExternalResolution = true;
        dnsLatencyMs = Date.now() - dnsStarted;
      }
    } catch {
      dnsExternalResolution = false;
      dnsLatencyMs = null;
    }

    const records: NetworkDnsRecordDto[] = await Promise.all(
      INVENTORY_NAMES.map(async (name) => {
        const fqdn = `${name}.${this.config.localDomain}`;

        try {
          const addresses = await timeoutPromise(
            resolver.resolve4(fqdn),
            this.timeoutMs,
          );

          return {
            name,
            fqdn,
            ipv4: addresses[0] ?? null,
          };
        } catch {
          return {
            name,
            fqdn,
            ipv4: null,
          };
        }
      }),
    );

    const gatewayLatencyMs = await probeTcp(
      this.config.gatewayIp,
      443,
      this.timeoutMs,
    );

    return {
      gatewayIp: this.config.gatewayIp,
      gatewayHttpsReachable: gatewayLatencyMs !== null,
      gatewayLatencyMs,
      dnsServer: this.config.dnsServer,
      localDomain: this.config.localDomain,
      dnsExternalResolution,
      dnsLatencyMs,
      records,
      checkedAt: new Date().toISOString(),
    };
  }
}
