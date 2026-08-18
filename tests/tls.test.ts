/**
 * Proves the exact TLS mechanism the Proxmox integration relies on:
 * a private CA plus a servername override, with verification left ON.
 *
 * This is the local stand-in for "connect to https://192.168.1.99:8006 and
 * still validate the certificate Proxmox issued for pve-dell.dell".
 *
 * The suite self-skips in two situations, both environmental:
 *  - `openssl` is not on PATH;
 *  - the machine runs a TLS-intercepting security product (some antivirus
 *    suites re-sign even loopback connections), which makes any private-CA
 *    assertion meaningless. The check below detects that by inspecting the
 *    certificate actually presented on a loopback socket.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:https';
import { tmpdir } from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UpstreamError } from '../server/errors.js';
import { createTlsAgent, requestJson } from '../server/http.js';

const CERT_HOSTNAME = 'pve-test.local';
const CA_COMMON_NAME = 'NUGA Test CA';

interface Material {
  dir: string;
  caPem: string;
  serverCert: string;
  serverKey: string;
}

function hasOpenssl(): boolean {
  try {
    execFileSync('openssl', ['version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function generateMaterial(): Material {
  const dir = mkdtempSync(path.join(tmpdir(), 'nuga-tls-'));
  const run = (args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' });

  run(['req', '-x509', '-newkey', 'rsa:2048', '-keyout', 'ca.key', '-out', 'ca.pem',
    '-days', '3650', '-nodes', '-subj', `/CN=${CA_COMMON_NAME}`]);
  run(['req', '-newkey', 'rsa:2048', '-keyout', 'srv.key', '-out', 'srv.csr',
    '-nodes', '-subj', `/CN=${CERT_HOSTNAME}`]);
  writeFileSync(path.join(dir, 'ext.cnf'), `subjectAltName=DNS:${CERT_HOSTNAME}\n`);
  run(['x509', '-req', '-in', 'srv.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key',
    '-CAcreateserial', '-out', 'srv.pem', '-days', '3650', '-extfile', 'ext.cnf']);

  return {
    dir,
    caPem: readFileSync(path.join(dir, 'ca.pem'), 'utf8'),
    serverCert: readFileSync(path.join(dir, 'srv.pem'), 'utf8'),
    serverKey: readFileSync(path.join(dir, 'srv.key'), 'utf8'),
  };
}

/** True when something between client and server re-signs the certificate. */
async function detectTlsInterception(material: Material): Promise<boolean> {
  const server = createServer(
    { cert: material.serverCert, key: material.serverKey },
    (_req, res) => res.end('ok'),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    server.close();
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const socket = tls.connect(
      {
        host: '127.0.0.1',
        port: address.port,
        servername: CERT_HOSTNAME,
        rejectUnauthorized: false,
      },
      () => {
        const issuer = socket.getPeerCertificate().issuer as { CN?: string } | undefined;
        socket.end();
        server.close();
        resolve(issuer?.CN !== CA_COMMON_NAME);
      },
    );
    socket.on('error', () => {
      server.close();
      resolve(true);
    });
  });
}

const opensslAvailable = hasOpenssl();
let material: Material | null = null;
let intercepted = false;

if (opensslAvailable) {
  material = generateMaterial();
  intercepted = await detectTlsInterception(material);
  if (intercepted) {
    // eslint-disable-next-line no-console
    console.warn(
      '[tls.test] Skipped: this host re-signs TLS connections (interception proxy / antivirus). ' +
        'Private-CA verification cannot be asserted here; run this suite in CI or on the target VM.',
    );
  }
}

describe.skipIf(!opensslAvailable || intercepted)('TLS verification with a private CA', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const m = material!;
    server = createServer({ cert: m.serverCert, key: m.serverKey }, (_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { version: '8.4.1' } }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (typeof address === 'string' || address === null) throw new Error('no address');
    // Connect by IP on purpose: this is exactly the Proxmox situation.
    baseUrl = `https://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects an unknown CA instead of silently trusting it', async () => {
    await expect(
      requestJson(`${baseUrl}/api2/json/version`, { timeoutMs: 5000, label: 'Proxmox' }),
    ).rejects.toMatchObject({ code: 'UPSTREAM_TLS' });
  });

  it('still rejects when the CA is trusted but the hostname does not match', async () => {
    // No servername override: the cert is for pve-test.local, we dial 127.0.0.1.
    const agent = createTlsAgent({ caCert: material!.caPem, servername: null, timeoutMs: 5000 });
    await expect(
      requestJson(`${baseUrl}/api2/json/version`, {
        timeoutMs: 5000,
        label: 'Proxmox',
        dispatcher: agent,
      }),
    ).rejects.toBeInstanceOf(UpstreamError);
  });

  it('succeeds with the CA plus a servername override', async () => {
    const agent = createTlsAgent({
      caCert: material!.caPem,
      servername: CERT_HOSTNAME,
      timeoutMs: 5000,
    });
    const result = await requestJson(`${baseUrl}/api2/json/version`, {
      timeoutMs: 5000,
      label: 'Proxmox',
      dispatcher: agent,
    });
    expect(result).toEqual({ data: { version: '8.4.1' } });
  });
});

afterAll(() => {
  if (material) rmSync(material.dir, { recursive: true, force: true });
});
