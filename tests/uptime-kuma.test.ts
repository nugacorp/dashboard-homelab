import { describe, expect, it } from 'vitest';
import {
  parseUptimeKumaMetrics,
  summariseUptimeKumaMonitors,
} from '../server/services/uptimeKuma.js';

const METRICS = `
monitor_response_time_seconds{monitor_id="1",monitor_name="PVE Dell",monitor_type="ping",monitor_hostname="192.168.1.99",monitor_port="null",window="1d"} 0.0009
monitor_response_time_seconds{monitor_id="1",monitor_name="PVE Dell",monitor_type="ping",window="30d"} 0.001
monitor_response_time_seconds{monitor_id="1",monitor_name="PVE Dell",monitor_type="ping",window="365d"} 0.0011
monitor_response_time{monitor_id="1",monitor_name="PVE Dell",monitor_type="ping"} 1.06
monitor_status{monitor_id="1",monitor_name="PVE Dell",monitor_type="ping"} 1

monitor_response_time{monitor_id="9",monitor_name="NUGA EDGE - Raspberry",monitor_type="push"} -1
monitor_status{monitor_id="9",monitor_name="NUGA EDGE - Raspberry",monitor_type="push"} 1

monitor_cert_days_remaining{monitor_id="7",monitor_name="NugaCore Staging",monitor_type="http",monitor_url="https://staging.example.test/health?token=must-not-leak"} 74
monitor_cert_is_valid{monitor_id="7",monitor_name="NugaCore Staging",monitor_type="http"} 1
monitor_response_time{monitor_id="7",monitor_name="NugaCore Staging",monitor_type="http"} 269
monitor_status{monitor_id="7",monitor_name="NugaCore Staging",monitor_type="http"} 0
`;

describe('Uptime Kuma Prometheus normalisation', () => {
  it('parses monitor state and latency without inventing push latency', () => {
    const monitors = parseUptimeKumaMetrics(METRICS);

    expect(monitors).toHaveLength(3);

    const dell = monitors.find((m) => m.id === '1');
    expect(dell?.state).toBe('up');
    expect(dell?.target).toBe('192.168.1.99');
    expect(dell?.responseTimeMs).toBe(1.06);
    expect(dell?.average1dMs).toBeCloseTo(0.9);

    const edge = monitors.find((m) => m.id === '9');
    expect(edge?.state).toBe('up');
    expect(edge?.type).toBe('push');
    expect(edge?.responseTimeMs).toBeNull();

    const staging = monitors.find((m) => m.id === '7');
    expect(staging?.state).toBe('down');
    expect(staging?.target).toBe('https://staging.example.test/health');
    expect(staging?.certificateValid).toBe(true);
    expect(staging?.certificateDaysRemaining).toBe(74);
  });

  it('builds a factual state summary', () => {
    const summary = summariseUptimeKumaMonitors(
      parseUptimeKumaMetrics(METRICS),
    );

    expect(summary).toEqual({
      total: 3,
      up: 2,
      down: 1,
      pending: 0,
      maintenance: 0,
      unknown: 0,
    });
  });
});
