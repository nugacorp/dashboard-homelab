import { describe, expect, it } from 'vitest';
import { ConfigError, describeConfig, loadConfig } from '../server/config.js';

/** Minimal env so loadConfig does not pick up the developer's real shell. */
const base: NodeJS.ProcessEnv = { NODE_ENV: 'test' };

describe('loadConfig', () => {
  it('starts with every integration absent rather than guessing defaults', () => {
    const config = loadConfig(base);
    expect(config.proxmox).toBeNull();
    expect(config.homeAssistant).toBeNull();
    expect(config.hermes).toBeNull();
    expect(config.hermesEnabled).toBe(false);
    expect(config.uptimeKumaUrl).toBeNull();
    expect(config.uptimeKumaApiKey).toBeNull();
    expect(config.network).toBeNull();
    expect(config.unifi).toBeNull();
    expect(config.auth).toBeNull();
    expect(config.port).toBe(8080);
  });

  it('rejects a half-configured Proxmox instead of silently disabling it', () => {
    expect(() =>
      loadConfig({ ...base, PVE_API_URL: 'https://192.168.1.99:8006' }),
    ).toThrow(ConfigError);

    try {
      loadConfig({ ...base, PVE_API_URL: 'https://192.168.1.99:8006' });
    } catch (err) {
      expect((err as Error).message).toContain('PVE_TOKEN_ID');
      expect((err as Error).message).toContain('PVE_TOKEN_SECRET');
    }
  });

  it('accepts a complete Proxmox configuration', () => {
    const config = loadConfig({
      ...base,
      PVE_API_URL: 'https://192.168.1.99:8006/',
      PVE_TOKEN_ID: 'nuga@pve!dashboard',
      PVE_TOKEN_SECRET: 'secret-value',
      PVE_TLS_SERVERNAME: 'pve-dell.dell',
    });
    expect(config.proxmox).not.toBeNull();
    // Trailing slash is normalised away so path joining stays predictable.
    expect(config.proxmox?.baseUrl).toBe('https://192.168.1.99:8006');
    expect(config.proxmox?.tlsServername).toBe('pve-dell.dell');
  });

  it('rejects a token id that is not user@realm!token', () => {
    expect(() =>
      loadConfig({
        ...base,
        PVE_API_URL: 'https://192.168.1.99:8006',
        PVE_TOKEN_ID: 'not-a-token-id',
        PVE_TOKEN_SECRET: 'secret-value',
      }),
    ).toThrow(/PVE_TOKEN_ID/);
  });

  it('never leaks the token value in the error message', () => {
    try {
      loadConfig({
        ...base,
        PVE_API_URL: 'https://192.168.1.99:8006',
        PVE_TOKEN_ID: 'bad',
        PVE_TOKEN_SECRET: 'super-secret-do-not-print',
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as Error).message).not.toContain('super-secret-do-not-print');
    }
  });

  it('rejects a non-http URL', () => {
    expect(() => loadConfig({ ...base, HASS_URL: 'ftp://nope', HASS_TOKEN: 'x' })).toThrow(
      ConfigError,
    );
  });

  it('treats an empty string the same as unset', () => {
    const config = loadConfig({ ...base, HASS_URL: '', HASS_TOKEN: '' });
    expect(config.homeAssistant).toBeNull();
  });

  it('refuses HERMES_ENABLED without a URL', () => {
    expect(() => loadConfig({ ...base, HERMES_ENABLED: 'true' })).toThrow(/HERMES_API_URL/);
  });

  it('keeps hermes disabled by default even when a URL is present', () => {
    const config = loadConfig({ ...base, HERMES_API_URL: 'http://192.168.1.88:9000' });
    expect(config.hermesEnabled).toBe(false);
    expect(config.hermes).toBeNull();
  });

  it('requires a bearer key when Hermes is enabled', () => {
    expect(() =>
      loadConfig({
        ...base,
        HERMES_ENABLED: 'true',
        HERMES_API_URL: 'http://192.168.1.88:8642',
      }),
    ).toThrow(/HERMES_API_KEY/);
  });

  it('accepts a complete Hermes configuration without exposing the key', () => {
    const config = loadConfig({
      ...base,
      HERMES_ENABLED: 'true',
      HERMES_API_URL: 'http://192.168.1.88:8642/',
      HERMES_API_KEY: 'hermes-test-secret',
    });

    expect(config.hermesEnabled).toBe(true);
    expect(config.hermes?.baseUrl).toBe('http://192.168.1.88:8642');

    const rendered = JSON.stringify(describeConfig(config));
    expect(rendered).not.toContain('hermes-test-secret');
  });

  it('uses separate defaults for monitoring APIs and Hermes chat', () => {
    const config = loadConfig({ ...base });

    expect(config.upstreamTimeoutMs).toBe(8000);
    expect(config.hermesChatTimeoutMs).toBe(60000);
  });

  it('allows overriding the Hermes chat timeout independently', () => {
    const config = loadConfig({
      ...base,
      UPSTREAM_TIMEOUT_MS: '9000',
      HERMES_CHAT_TIMEOUT_MS: '45000',
    });

    expect(config.upstreamTimeoutMs).toBe(9000);
    expect(config.hermesChatTimeoutMs).toBe(45000);
  });

  it('rejects a half-configured UniFi integration', () => {
    expect(() =>
      loadConfig({
        ...base,
        UNIFI_API_URL: 'https://192.168.1.1/proxy/network/integration',
      }),
    ).toThrow(/UNIFI_API_KEY/);
  });

  it('accepts a complete UniFi integration without exposing the key', () => {
    const config = loadConfig({
      ...base,
      UNIFI_API_URL: 'https://192.168.1.1/proxy/network/integration/',
      UNIFI_API_KEY: 'unifi-test-secret',
      UNIFI_TLS_SERVERNAME: 'unifi.local',
    });

    expect(config.unifi?.baseUrl).toBe(
      'https://192.168.1.1/proxy/network/integration',
    );
    expect(config.unifi?.tlsServername).toBe('unifi.local');

    const rendered = JSON.stringify(describeConfig(config));
    expect(rendered).not.toContain('unifi-test-secret');
  });

  it('requires a strong session secret and an scrypt hash', () => {
    expect(() =>
      loadConfig({
        ...base,
        DASHBOARD_USERNAME: 'ramiro',
        DASHBOARD_PASSWORD_HASH: 'scrypt$16384$8$1$c2FsdA==$aGFzaA==',
        SESSION_SECRET: 'too-short',
      }),
    ).toThrow(/SESSION_SECRET/);

    expect(() =>
      loadConfig({
        ...base,
        DASHBOARD_USERNAME: 'ramiro',
        DASHBOARD_PASSWORD_HASH: 'plaintext-password',
        SESSION_SECRET: 'a'.repeat(40),
      }),
    ).toThrow(/DASHBOARD_PASSWORD_HASH/);
  });
});

describe('describeConfig', () => {
  it('reports presence without ever printing a secret', () => {
    const config = loadConfig({
      ...base,
      PVE_API_URL: 'https://192.168.1.99:8006',
      PVE_TOKEN_ID: 'nuga@pve!dashboard',
      PVE_TOKEN_SECRET: 'super-secret-token-value',
      HASS_URL: 'http://192.168.1.158',
      HASS_TOKEN: 'super-secret-hass-token',
    });

    const rendered = JSON.stringify(describeConfig(config));
    expect(rendered).toContain('configured');
    expect(rendered).not.toContain('super-secret-token-value');
    expect(rendered).not.toContain('super-secret-hass-token');
  });
});
