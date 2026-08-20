# Integrations

What each integration reads, what it deliberately does not, and what state the
UI shows when it is absent.

Common rules:

- Every upstream call has a hard timeout and a response size cap.
- Proxmox and Home Assistant are **read-only**: `GET` and nothing else. The only
  outbound `POST` in the whole backend is a Hermes chat turn, which is a request
  for a reply, not a change to infrastructure.
- Payloads are validated with zod and mapped to DTOs in `shared/api.ts`.
- A value the upstream does not report becomes `null` and renders as `n/d`.
- A failure never becomes a global 500; it is a `503` envelope on that route.

---

## Proxmox VE — connected, read-only

**Config:** `PVE_API_URL`, `PVE_TOKEN_ID`, `PVE_TOKEN_SECRET`,
`PVE_CA_CERT_PATH`, `PVE_TLS_SERVERNAME`
**Privilege required:** `PVEAuditor` on `/`, granted to **both** the user and
the token principal, with the token created using `-privsep 1`. See
`docs/DEPLOYMENT.md` step 1 for the exact commands and the read/write check.

### Endpoints consumed

| Upstream | Used for |
| --- | --- |
| `GET /api2/json/version` | PVE version, token liveness check |
| `GET /api2/json/cluster/status` | Cluster name, quorum, node IPs |
| `GET /api2/json/nodes` | Node list and coarse usage |
| `GET /api2/json/nodes/{node}/status` | CPU model, memory, rootfs, load, kernel, IO delay |
| `GET /api2/json/cluster/resources?type=vm` | VMs and LXC containers |
| `GET /api2/json/cluster/resources?type=storage` | Storage inventory |

`{node}` is matched against `^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$` and URL-encoded
before it reaches a path.

### Exposed as

`/api/proxmox/{cluster,nodes,vms,containers,storage}`

### Normalisation notes

- Proxmox reports CPU as a 0–1 fraction; we convert to a percentage.
- `wait` becomes `ioDelayPct`.
- `loadavg` arrives as strings and is parsed to numbers, or `null` if malformed.
- Templates are flagged and excluded from running/total guest counts.
- Cluster totals only sum **online** nodes; an offline node contributes nothing
  rather than zeroes that would drag the average down.
- `/cluster/status` is absent on a standalone host. That is a valid topology, so
  the cluster name and quorum become `null` and everything else still works.

### Deliberately not provided

| Thing | Why |
| --- | --- |
| Guest IP addresses | Needs the QEMU guest agent and privileges beyond PVEAuditor. Typed as `ipAddress: null`. |
| CPU / package temperatures | The PVE API has no sensor endpoint. Shown as `n/d` with a note. |
| Any write operation | Read-only by design. Routes answer `403 NOT_ENABLED`. |
| noVNC console | The previous "console" was a hard-coded fake boot log. A real one needs a ticket API and a websocket proxy. |

### TLS

The certificate is issued by the cluster CA for the node hostname. Connecting by
IP therefore needs both the CA and a servername override:

```ts
createTlsAgent({ caCert, servername: 'pve-dell.dell', timeoutMs })
```

`rejectUnauthorized: false` is not used anywhere, and a test asserts it never
reappears.

---

## Home Assistant — connected, read-only

**Config:** `HASS_URL`, `HASS_TOKEN`
**Note:** this installation answers on **port 80** (`http://192.168.1.158`), not
the default `8123`.

### Endpoints consumed

| Upstream | Used for |
| --- | --- |
| `GET /api/config` | Core version, location name |
| `GET /api/states` | All entity states and attributes |

### Exposed as

`/api/home-assistant/summary`, `/api/home-assistant/entities[?domain=...]`

### Normalisation notes

- Domain is derived from the entity id prefix.
- `unavailable` and `unknown` are counted separately — they mean different
  things and neither is `0`.
- Category counters (lights, switches, sensors, locks, cameras, …) come straight
  from domain counts. **Zero is a real zero**, not missing data.

### Current reality

The installation has only system entities: no Zigbee coordinator, no lights, no
locks, no cameras, no physical sensors. The Smart Home page renders "No hay
dispositivos configurados" and lists what is actually there.

### Deliberately not provided

| Thing | Why |
| --- | --- |
| `callService` / any POST | v1 is read-only. `POST /api/home-assistant/services/:domain/:service` answers `403 NOT_ENABLED`. |
| Light / lock / climate controls | Same. The UI states "Control no habilitado" instead of hiding it. |
| Automation triggering | Same. |
| Websocket subscription | Polling `/api/states` is sufficient at this scale and keeps the backend stateless. |

---

## Hermes — connected (since v1.2.0)

**Config:** `HERMES_ENABLED` (default `false`), `HERMES_API_URL`,
`HERMES_API_KEY`, `HERMES_CHAT_TIMEOUT_MS` (default `60000`)

Hermes Agent v0.20.3 runs on VM110 (`http://192.168.1.88:8642`) with provider
`minimax-oauth` and model `MiniMax-M2.7`. Up to v1.1.0 the flag existed but
nothing was wired; v1.2.0 connects it for real.

`HERMES_ENABLED=true` requires **both** `HERMES_API_URL` and `HERMES_API_KEY`.
Either one missing is a startup error, not a silent downgrade.

### Endpoints consumed

| Upstream | Used for |
| --- | --- |
| `GET /health/detailed` | Readiness probe: gateway state, active agents, version |
| `GET /api/model/options` | Provider and model inventory |
| `GET /v1/models` | OpenAI-compatible model list |
| `POST /v1/chat/completions` | Chat turns |

All authenticated with a bearer token that exists only in the backend process.

The readiness probe deliberately uses the **authenticated** `/health/detailed`
rather than a bare `/health`. A 200 from an unauthenticated endpoint would prove
the host is up but not that the configured credential still works, and the
credential is the part that actually breaks.

### Exposed as

`/api/hermes/status`, `/api/hermes/models`, `POST /api/hermes/chat`

Chat carries its own timeout (`HERMES_CHAT_TIMEOUT_MS`, default 60 s) because
model inference is far slower than a status call. The global
`UPSTREAM_TIMEOUT_MS` (8 s) still governs every other upstream.

Prompts are capped at 4000 characters before anything leaves NUGA HOME.

### Behaviour when disabled

With `HERMES_ENABLED=false`:

- `GET /api/hermes/status` → `status: "disabled"`
- `POST /api/hermes/chat` → `status: "disabled"`, no upstream call
- UI: "Hermes API no configurada", composer disabled
- **No reply is ever synthesised.** An early prototype shipped hand-written
  answers about 8 cameras, a Coral TPU and a 12 TB ZFS pool. All fiction, all
  gone.

Path: `Browser → NUGA backend → Hermes`. Never browser → Hermes.
`HERMES_API_KEY` is backend-only and must never appear in a `VITE_` variable;
a test enforces that.

> **Rollback hazard.** v1.1.0 and earlier spoke a speculative contract
> (`GET /health`, `POST /chat`) that the real agent does not serve. Rolling the
> image back to v1.1.0 while leaving `HERMES_ENABLED=true` moves Hermes from
> `disabled` to `unavailable` and makes `/api/health/ready` report `degraded`.
> **Any rollback to v1.1.0 must also set `HERMES_ENABLED=false`.** v1.1.0 does
> still start with a v1.2 `.env` — its env schema is not `.strict()`, so the
> unknown `HERMES_CHAT_TIMEOUT_MS` is ignored rather than rejected.

---

## Uptime Kuma — reachability and monitor metrics (since v1.1.0)

**Config:** `UPTIME_KUMA_URL`, `UPTIME_KUMA_API_KEY`

Runs on VM120 alongside the dashboard. Production points at
`http://10.77.0.20:3001`; the same instance also answers on
`http://192.168.1.28:3001`, because both addresses live on `enp6s18`.

### Endpoints consumed

| Upstream | Used for |
| --- | --- |
| `GET {UPTIME_KUMA_URL}` | Reachability. Any HTTP answer counts, including the `302` returned to an unauthenticated request. |
| `GET {UPTIME_KUMA_URL}/metrics` | Monitor inventory, status, response times, certificate expiry |

`/metrics` is Kuma's Prometheus endpoint, authenticated with HTTP Basic where
the API key is the password and the username is empty. It is consumed **only by
the backend**; the key never reaches the browser. The Prometheus text is parsed
and normalised into DTOs owned by this application before anything is served.

### Exposed as

`/api/uptime-kuma/status`, `/api/uptime-kuma/monitors`,
`/api/uptime-kuma/summary`

### Why `/metrics` and not the socket

Kuma 2.x has no stable, documented REST API for monitor state — its own UI reads
an internal socket.io channel. Depending on that would be a reverse-engineered
integration that breaks on upgrade. `/metrics` is documented, authenticated and
text-stable, which is why it is the surface the dashboard relies on.

Kuma remains the source of truth for alerting. The dashboard restates its
current state; it does not replace it.

---

## Not integrated

Rendered with `IntegrationNotConfigured`, never with sample data.

| Section | State | Blocker |
| --- | --- | --- |
| Network | NOT CONFIGURED | No network controller with an API |
| UniFi | NOT CONFIGURED | No UniFi hardware deployed |
| Starlink | NOT CONFIGURED | No gRPC telemetry collector |
| Cameras / NVR | NOT CONFIGURED | No cameras, no Frigate, no Protect, no Coral TPU |
| Energy | NOT CONFIGURED | No power meter, no monitored UPS, no solar |
| Logs | NOT CONFIGURED | No log aggregator |
| NAS / ZFS | NOT CONFIGURED | No TrueNAS, no ZFS pool |
| Proxmox Backup Server | COMING LATER | Not deployed |
| Immich | NOT CONFIGURED | Not deployed |
| Docker containers | NOT CONFIGURED | Would require mounting the Docker socket — see below |

### Why Docker inventory is refused, not merely absent

Reading the Docker daemon means mounting `/var/run/docker.sock` into this
container, which is equivalent to granting it root on VM120. A dashboard is not
worth that. If container inventory becomes necessary, the safe route is a
socket proxy with an allow-list of read-only endpoints, never the raw socket.
