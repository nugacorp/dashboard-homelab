# NUGA HOME

Operational dashboard for the NUGA HOME homelab: a small full-stack application
that reads the real state of a Proxmox VE cluster and a Home Assistant install,
and says so plainly when something is not configured.

```
Browser  ──►  NUGA HOME (Node/Express + React)  ──►  Proxmox VE API   (GET only)
                                                ──►  Home Assistant   (GET only)
                                                ──►  Hermes Agent     (status, models, chat)
                                                ──►  Uptime Kuma      (reachability + /metrics)
                                                ──►  Network / DNS    (GET/probes only)
                                                ──►  UniFi Network    (official local API, GET only)
```

The browser never talks to Proxmox, Home Assistant or Hermes directly. Tokens
exist only in the backend process.

## The no-fake-data policy

This dashboard started life as a design prototype full of sample data. Every bit
of it has been removed. The rules it now follows:

- **A number on screen came from an upstream.** If the upstream does not report
  it, the UI renders `n/d`, never `0` and never a plausible-looking value.
- **`0`, `unknown`, `not configured` and `offline` are four different states**
  and are rendered differently.
- **Systems that do not exist say so.** Starlink, Cameras, Energy, Logs,
  NAS/ZFS, PBS and Immich render a `NOT CONFIGURED` panel that
  explains what is missing.
- **No fabricated success.** Write operations answer `403 NOT_ENABLED`; Hermes
  answers nothing at all when it is disabled.
- **No invented health score.** The old "98% healthy" gauge was a constant in a
  mock file. It is replaced by the literal state of each integration.

`tests/no-fake-data.test.ts` enforces the important parts of this in CI.

## What is actually connected

| Integration | State | Notes |
| --- | --- | --- |
| Proxmox VE | Read-only, GET only | Cluster, nodes, VMs, LXC, storage |
| Home Assistant | Read-only, GET only | Version, entities, domains, availability |
| Hermes | Connected (v1.2.0), feature gated | Status, models, chat — via the backend, never the browser |
| Uptime Kuma | Reachability + monitors (v1.1.0) | Prometheus `/metrics` with a backend-only API key |
| Network / DNS | Read-only observability | Gateway reachability, Technitium external resolution and authoritative `localdomain` inventory |
| UniFi Network | Read-only, official local API | Network 10.6.101, site, adopted devices, clients, networks/VLANs, WANs and device statistics |

Hermes stays behind `HERMES_ENABLED`, which defaults to `false`. Off means off:
the composer is disabled and no reply is ever synthesised.

Not integrated, and rendered as such: UniFi Protect, Frigate, Coral TPU,
NAS/TrueNAS/ZFS, Plex, Zigbee, cameras, solar, UPS, energy metering, Starlink
telemetry, log aggregation, Docker container inventory.

## Architecture

```
server/            Express backend — the only place secrets exist
  index.ts         entry point: env, validation, listen
  app.ts           app factory (testable without binding a port)
  config.ts        zod-validated environment, all-or-nothing per integration
  http.ts          timeouts, size caps, TLS agent with a private CA
  errors.ts        upstream failure taxonomy
  logger.ts        structured logging with secret redaction
  auth.ts          scrypt password hashing + HMAC session cookies
  cache.ts         short TTL cache with request coalescing
  routes/          thin HTTP layer
  services/        one file per upstream, zod-validated
shared/api.ts      DTO contract used by both sides
src/               React frontend — talks only to /api
```

See `docs/ARCHITECTURE.md` for the reasoning behind each decision.

## Local development

Requires Node 22+.

```bash
npm install
cp .env.example .env        # fill in what you have; empty is fine
npm run dev                 # backend on :8080, Vite on :3000 with /api proxied
```

Open http://localhost:3000. With an empty `.env` the app starts and every panel
reports `NOT CONFIGURED` — that is the intended first-run experience.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Backend + frontend together |
| `npm run dev:server` | Backend only (tsx watch) |
| `npm run dev:web` | Vite only |
| `npm run typecheck` | Web, server and test projects |
| `npm test` | Vitest |
| `npm run build` | SPA to `dist/web`, server to `dist/server` |
| `npm start` | Run the built server (serves the SPA) |
| `npm run hash-password` | Generate `DASHBOARD_PASSWORD_HASH` |

## Production (Docker)

```bash
npm run build                                   # optional: verify locally first
docker build -t nuga-home-dashboard:v1.2.0 .
docker tag nuga-home-dashboard:v1.2.0 nuga-home-dashboard:latest   # first install only
docker compose up -d --no-build
curl -fsS http://localhost:8080/api/health/live
```

`compose.yaml` deliberately has **no `build:` stanza**: production runs
pre-built, explicitly tagged images that were validated as a candidate first, so
a missing image fails loudly instead of silently deploying whatever is in the
worktree. Always pass `--no-build`.

The image is multi-stage: build tooling stays out of the runtime layer, the
container runs as the unprivileged `node` user with a read-only root filesystem,
and the healthcheck hits `/api/health/live`, which never contacts an upstream.

The Docker socket is **not** mounted. See `docs/DEPLOYMENT.md` for the full
VM120 procedure.

## Environment variables

Full annotated list in `.env.example`. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT`, `HOST`, `LOG_LEVEL` | no | Runtime basics (defaults 8080 / 0.0.0.0 / info) |
| `UPSTREAM_TIMEOUT_MS` | no | Hard timeout per upstream call (default 8000) |
| `BIND_ADDRESS` | no | Host interface compose publishes on (default: all) |
| `PVE_API_URL`, `PVE_TOKEN_ID`, `PVE_TOKEN_SECRET` | together | Proxmox, read-only token |
| `PVE_CA_CERT_PATH` | recommended | Cluster CA so TLS verification stays on |
| `PVE_TLS_SERVERNAME` | when using an IP | Hostname to validate the certificate against |
| `HASS_URL`, `HASS_TOKEN` | together | Home Assistant long-lived token |
| `HERMES_ENABLED`, `HERMES_API_URL`, `HERMES_API_KEY` | url+key together when enabled | Hermes feature gate |
| `HERMES_CHAT_TIMEOUT_MS` | no | Chat-only timeout (default 60000); inference outlasts the 8 s global |
| `UPTIME_KUMA_URL` | no | Reachability indicator and link target |
| `UPTIME_KUMA_API_KEY` | for monitors | Backend-only, used for `GET /metrics` |
| `NETWORK_DNS_SERVER`, `NETWORK_LOCAL_DOMAIN`, `NETWORK_GATEWAY_IP` | together | Read-only LAN/DNS observability |
| `UNIFI_API_URL`, `UNIFI_API_KEY` | together | Official UniFi Network local API |
| `UNIFI_CA_CERT_PATH` | recommended | UCG self-signed certificate so TLS verification remains enabled |
| `UNIFI_TLS_SERVERNAME` | when connecting by IP | Certificate hostname, currently `unifi.local` |
| `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD_HASH`, `SESSION_SECRET` | together | Local login |

An integration is either fully configured or not configured. Setting some but
not all of a group is a startup error, so the dashboard can never half-connect
to something and report it as working.

## Security

1. Secrets live only in the backend process. Nothing sensitive is exposed to the
   browser — not even a masked token.
2. No `VITE_*` variable carries a credential, and the frontend reads no
   environment variable at all.
3. `.env` is git-ignored; `.env.example` holds names and placeholders only.
4. TLS verification is never disabled. A private CA plus an optional servername
   override lets the backend verify Proxmox properly while connecting by IP.
5. Every upstream call has a hard timeout and a response size cap. Non-2xx
   bodies are discarded rather than forwarded.
6. Logs redact registered secrets and token-shaped patterns, and omit query
   strings.
7. Frontend and backend are same-origin. There is no CORS middleware and no
   wildcard origin.
8. Local login: scrypt password hash, HMAC-signed HttpOnly cookie with
   `SameSite=Lax`, and a per-IP login throttle. No session database.
9. Proxmox, Home Assistant and UniFi Network are strictly read-only in this release. The
   Proxmox token uses privilege separation (`-privsep 1`) with its own
   `PVEAuditor` grant, so widening the user later does not widen the token.
10. The Docker socket is never mounted.

### Authentication: optional in the app, required for the real deployment

If `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD_HASH` / `SESSION_SECRET` are not
set, the application starts open and logs a warning at boot. That mode exists
for a first run on a laptop, not for a host serving live infrastructure data.

`docs/DEPLOYMENT.md` treats all three as **mandatory** for VM120, and step 5
fails the deployment if `/api/health/ready` reports `"auth": "disabled"`.

### What publishing the port does

`compose.yaml` publishes `8080` on the host, by default on every host interface.
Docker publishes to the host rather than to a particular network, so who can
reach it is decided by your network and firewall, not by this repository. Set
`BIND_ADDRESS` in `.env` to pin the listener to a single address (for example
the VM's LAN IP, or `127.0.0.1` behind a local reverse proxy).

## Setting up Proxmox

Create a dedicated read-only token — do not reuse the one Hermes already has:

```bash
# On any cluster node
pveum user add nuga-dashboard@pve --comment "NUGA HOME dashboard read-only"
pveum acl modify / -user nuga-dashboard@pve -role PVEAuditor

# Privilege separation ON: the token starts with no rights and gets only what
# is granted to the token principal, so widening the user later does not
# silently widen the token.
pveum user token add nuga-dashboard@pve dashboard -privsep 1
pveum acl modify / -token 'nuga-dashboard@pve!dashboard' -role PVEAuditor
# Copy the printed secret straight into .env on VM120; it is shown once.
```

Verify before deploying: a `GET /api2/json/version` must return 200 and a
`POST .../status/stop` must return 403. `docs/DEPLOYMENT.md` has the exact
commands.

Then copy the cluster CA so TLS can be verified:

```bash
# From a node
cat /etc/pve/pve-root-ca.pem
# On VM120
sudo mkdir -p /etc/nuga-home
sudo tee /etc/nuga-home/pve-root-ca.pem >/dev/null   # paste, then Ctrl-D
```

Because `PVE_API_URL` uses an IP while the certificate is issued for the node
hostname, set `PVE_TLS_SERVERNAME` to that hostname (e.g. `pve-dell.dell`).

## Setting up Home Assistant

Profile → Security → Long-Lived Access Tokens → Create Token. This installation
answers on port 80, so `HASS_URL=http://192.168.1.158` (not `:8123`).

The dashboard only issues `GET /api/config` and `GET /api/states`. It cannot
turn anything on or off.

## Hermes

Hermes runs on VM110 and is connected to the dashboard backend.
`HERMES_ENABLED` remains the explicit feature gate; credentials stay backend-only.
The validated contract is documented in `docs/INTEGRATIONS.md`.

## Documentation

- `docs/ARCHITECTURE.md` — how it fits together and why
- `docs/DEPLOYMENT.md` — VM120 deployment, step by step
- `docs/INTEGRATIONS.md` — per-integration contract, scope and limits
