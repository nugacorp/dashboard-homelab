# Integrations

What each integration reads, what it deliberately does not, and what state the
UI shows when it is absent.

Common rules:

- Every upstream call is a `GET` with a hard timeout and a response size cap.
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

## Hermes — feature gated, off

**Config:** `HERMES_ENABLED` (default `false`), `HERMES_API_URL`, `HERMES_API_KEY`

Hermes Agent v0.20.3 runs on VM110 (`192.168.1.88`) with Telegram, read-only
Proxmox and Home Assistant already working. It is **not** wired to this
dashboard, and this release does not change that.

### Behaviour when disabled

- `GET /api/hermes/status` → `status: "disabled"`
- `POST /api/hermes/chat` → `status: "disabled"`, no upstream call
- UI: "Hermes API no configurada", composer disabled
- **No reply is ever synthesised.** The previous implementation shipped
  hand-written answers describing 8 cameras, a Coral TPU at 44 °C and a 12 TB
  ZFS pool. All of it was fiction and all of it is gone.

### Wire contract (not yet validated)

When enabled, the backend will speak:

```http
GET  {HERMES_API_URL}/health
     → 200 { "version"?: string, "status"?: string }

POST {HERMES_API_URL}/chat
     Authorization: Bearer {HERMES_API_KEY}   (omitted if unset)
     { "message": "<= 4000 chars" }
     → 200 { "reply" | "response" | "message" | "text" | "content": string,
             "conversation_id"?: string }
```

Several reply field names are accepted precisely because this has not been
checked against the real agent. If none is present the backend raises
`UPSTREAM_INVALID_RESPONSE` rather than returning an empty string.

`HERMES_API_KEY` is backend-only. It must never appear in a `VITE_` variable,
and a test enforces that.

Path: `Browser → NUGA backend → Hermes`. Never browser → Hermes.

---

## Uptime Kuma — reachability only

**Config:** `UPTIME_KUMA_URL`

Running at `http://192.168.1.28:3001` with seven monitors (three PVE nodes, Home
Assistant, Hermes Core, Raspberry Pi 5, NugaCore Staging).

### What is done

- `GET {UPTIME_KUMA_URL}` — any HTTP response counts as reachable, including the
  `302` it returns for an unauthenticated request. A service that answers 302 is
  up; it just wants a login we deliberately do not perform.
- The URL is handed to the frontend so it can render a link.

### What is deliberately not done

Uptime Kuma 2.x has no stable, documented REST API for monitor state. The data
its own UI shows travels over an internal socket.io channel, and `/metrics`
requires an API key and returns Prometheus text whose labels are not a
compatibility promise.

Depending on either would mean a reverse-engineered integration that breaks on
upgrade, so v1 shows reachability and a link and nothing more. Kuma remains the
source of truth for uptime and alerting; the dashboard does not try to restate
it.

If this becomes worth revisiting, the maintainable path is Kuma's Prometheus
`/metrics` endpoint with a dedicated API key, scraped through a documented
config flag — not screen-scraping the socket protocol.

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
