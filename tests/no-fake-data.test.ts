/**
 * Guard rails against the failure mode this whole refactor was about:
 * production code quietly importing sample data, or hard-coding numbers that
 * describe hardware nobody owns.
 *
 * These are static checks over the source tree, so they fail in CI the moment
 * someone reintroduces a mock module or a token in a VITE_ variable.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Directories whose contents ship to users. Tests are exempt by definition. */
const PRODUCTION_DIRS = ['src', 'server', 'shared', 'scripts'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const productionFiles = PRODUCTION_DIRS.flatMap((dir) => {
  const full = path.join(ROOT, dir);
  try {
    return walk(full);
  } catch {
    return [];
  }
}).map((file) => ({
  path: path.relative(ROOT, file).replace(/\\/g, '/'),
  source: readFileSync(file, 'utf8'),
}));

/** Strips comments so documentation of removed fakes does not trip the checks. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('no mock data in production code', () => {
  it('finds source files to inspect', () => {
    expect(productionFiles.length).toBeGreaterThan(20);
  });

  it('never imports a mocks or fixtures module', () => {
    const offenders = productionFiles.filter(({ source }) =>
      /\bfrom\s+['"][^'"]*\/(mocks|__mocks__|fixtures)(\/|['"])/.test(source) ||
      /\bfrom\s+['"]\.{1,2}\/(mocks|fixtures)['"]/.test(source),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('has no src/mocks directory at all', () => {
    expect(() => statSync(path.join(ROOT, 'src', 'mocks'))).toThrow();
  });

  it('does not reintroduce a demo mode switch', () => {
    const offenders = productionFiles.filter(({ source }) =>
      /\bdemoMode\b|\bisDemo\b|\bDEMO_MODE\b/.test(stripComments(source)),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('never names absent hardware in the data layer', () => {
    // Presentational copy legitimately names systems that do not exist yet -
    // that is what the "not configured" messaging is for. What must never
    // happen is one of these names appearing in code that produces data.
    const DATA_LAYER = /^(server\/|src\/(hooks|lib|services|context)\/)/;
    const banned = /(pve-node-0\d|udm-pro|coral|frigate|truenas|raid-?z2|immich|plex|starlink)/i;

    const offenders = productionFiles
      .filter(({ path: p }) => DATA_LAYER.test(p))
      .filter(({ source }) => banned.test(stripComments(source)));

    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('never hard-codes the fabricated figures the old mocks shipped', () => {
    // A regression here would mean someone pasted sample telemetry back in.
    const FIGURES = [/245\.8/, /48240/, /healthScore/, /tpuInferenceSpeedMs/];
    const offenders = productionFiles.filter(({ source }) => {
      const code = stripComments(source);
      return FIGURES.some((re) => re.test(code));
    });
    expect(offenders.map((o) => o.path)).toEqual([]);
  });
});

describe('no secrets reachable from the browser', () => {
  it('never reads a VITE_ variable that could carry a credential', () => {
    const offenders = productionFiles.filter(({ source }) =>
      /import\.meta\.env\.VITE_[A-Z_]*(TOKEN|SECRET|KEY|PASSWORD)/i.test(source),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('never reads an upstream credential from the frontend', () => {
    // Naming a variable in help text is fine and useful; *reading* one from the
    // browser bundle is not, because the value would have to be shipped there.
    const frontend = productionFiles.filter(({ path: p }) => p.startsWith('src/'));
    const offenders = frontend.filter(({ source }) =>
      /(process\.env|import\.meta\.env)\s*[.[]\s*['"`]?(PVE_TOKEN_SECRET|HASS_TOKEN|HERMES_API_KEY|SESSION_SECRET|DASHBOARD_PASSWORD_HASH)/.test(
        stripComments(source),
      ),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('never reads any environment variable from the frontend bundle', () => {
    const frontend = productionFiles.filter(({ path: p }) => p.startsWith('src/'));
    const offenders = frontend.filter(({ source }) =>
      /process\.env|import\.meta\.env/.test(stripComments(source)),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it('never has the frontend contact a LAN address directly', () => {
    const frontend = productionFiles.filter(({ path: p }) => p.startsWith('src/'));
    const offenders = frontend.filter(({ source }) => {
      const code = stripComments(source);
      // Any absolute http(s) URL in frontend code is suspicious; the app is
      // same-origin and receives external links from the backend as data.
      return /(fetch|axios)\s*\(\s*['"`]https?:\/\//.test(code) || /\b192\.168\.\d+\.\d+/.test(code);
    });
    expect(offenders.map((o) => o.path)).toEqual([]);
  });
});

describe('no TLS verification bypass', () => {
  it('never disables certificate checking', () => {
    const offenders = productionFiles.filter(({ source }) =>
      /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED/.test(stripComments(source)),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });
});

describe('no write path to the upstreams', () => {
  it('the Proxmox service issues GET only', () => {
    const service = productionFiles.find(({ path: p }) => p === 'server/services/proxmox.ts');
    expect(service).toBeDefined();
    const code = stripComments(service!.source);
    expect(code).not.toMatch(/method:\s*['"](POST|PUT|DELETE|PATCH)['"]/);
  });

  it('the Home Assistant service issues GET only', () => {
    const service = productionFiles.find(({ path: p }) => p === 'server/services/homeAssistant.ts');
    expect(service).toBeDefined();
    const code = stripComments(service!.source);
    expect(code).not.toMatch(/method:\s*['"](POST|PUT|DELETE|PATCH)['"]/);
    expect(code).not.toMatch(/callService|\/api\/services\//);
  });
});
