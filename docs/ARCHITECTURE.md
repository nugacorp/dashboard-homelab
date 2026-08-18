# Architecture

## Shape

One process. It serves the React bundle and the API from the same origin, and it
is the only thing that holds credentials.

```
┌─────────┐   same-origin HTTP    ┌──────────────────────────┐
│ Browser │ ────────────────────► │  NUGA HOME (Node 22)     │
└─────────┘      /api/*           │                          │
                                  │  Express                 │
                                  │   ├── static dist/web    │
                                  │   └── /api routers       │
                                  │        └── services      │
                                  └───────────┬──────────────┘
                                              │ outbound, GET only
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                 Proxmox VE API      Home Assistant API     Hermes (gated)
                 https, private CA   http, bearer token     off by default
```

There are no microservices, no message bus and no database. Session state is a
signed cookie; cached upstream data lives in memory for a few seconds and is
lost on restart, which is the correct lifetime for a status view.

## Why same-origin

The frontend never learns a LAN address and never holds a token. That removes a
whole class of problems at once: no CORS configuration to get wrong, no secret
in the bundle, no direct browser→hypervisor path. The Vite dev server proxies
`/api` to the backend so development matches production.

## Request path

```
Route  ──► service ──► http.requestJson ──► undici fetch (timeout, TLS agent)
                             │
                             ├── non-2xx  → UpstreamError (body discarded)
                             ├── network  → UpstreamError (cause.code inspected)
                             └── 2xx      → zod parse → DTO
                                                 │
Route  ◄── envelope ◄────────────────────────────┘
```

### The envelope

Every data endpoint answers with the same shape:

```jsonc
{
  "status": "ok" | "not_configured" | "disabled" | "unavailable",
  "data":   T | null,
  "error":  { "code": "...", "message": "..." } | null,
  "fetchedAt": "2026-08-18T09:43:46.892Z",
  "source": "proxmox"
}
```

HTTP status mirrors it: `200` for ok / not_configured / disabled, `503` for
unavailable. The client reads the body regardless of the status code, so a
failing upstream is data rather than an exception.

`not_configured` is a **success**. It is a correct, cheaply-computed answer
about our own configuration, not a fault. Conflating it with an error is how a
dashboard ends up showing a red alert because the operator never owned a NAS.

### Failure isolation

A dead Proxmox produces a 503 on `/api/proxmox/*` and nothing else. `/api/health/live`
never touches an upstream at all, so the container healthcheck cannot be taken
down by a hypervisor reboot. `/api/health/ready` probes everything in parallel,
caches for ten seconds, and still returns 200 while reporting `degraded`.

## Configuration model

`server/config.ts` parses the environment with zod and applies one rule that
matters more than the rest: **an integration is all-or-nothing**. Setting
`PVE_API_URL` without `PVE_TOKEN_SECRET` is a startup error, not a silent
downgrade to "not configured". A half-configured integration that silently
disables itself is indistinguishable from a typo, and the operator would have no
idea why the panel is empty.

Secrets are registered with the logger at startup so they are redacted if they
ever appear in a message.

## TLS to Proxmox

Proxmox issues its own certificates from a per-cluster CA, with the CN set to
the node hostname (e.g. `pve-dell.dell`). Connecting to `https://192.168.1.99:8006`
therefore fails twice over: unknown CA, and a hostname that does not match.

The usual "fix" is `rejectUnauthorized: false`. That is not used anywhere in
this codebase. Instead:

```ts
new Agent({ connect: { ca: <pve-root-ca.pem>, servername: 'pve-dell.dell' } })
```

`ca` supplies the trust anchor; `servername` is what Node validates the
certificate against, so the identity check passes on the real hostname while the
connection still goes to the IP. Verification stays on.

`tests/tls.test.ts` proves all three cases against a locally generated CA:
unknown CA rejected, hostname mismatch rejected, correct CA + servername
accepted.

> The suite self-skips on hosts that intercept TLS (some antivirus products
> re-sign even loopback connections), because no private-CA assertion can hold
> there. It runs in CI.

## Data ownership

`shared/api.ts` defines DTOs that belong to this application. Upstream payloads
are validated with zod and mapped onto them; the frontend never sees raw
Proxmox or Home Assistant JSON.

Two conventions carry most of the weight:

- `null` means "the upstream does not report this". `formatBytes(null)` renders
  `n/d`. It is never `0`.
- Fields we deliberately refuse to provide are typed as `null`, not omitted.
  `ProxmoxGuestDto.ipAddress: null` documents in the type system that guest IPs
  need the QEMU guest agent and privileges beyond our read-only token.

## Read-only posture

The Proxmox token is expected to hold `PVEAuditor`. The services issue GET and
nothing else, and `tests/no-fake-data.test.ts` asserts statically that no
`POST`/`PUT`/`DELETE` appears in either service file.

Mutating routes still exist — and answer `403 NOT_ENABLED`:

```
POST   /api/proxmox/vms/:vmid/{start,stop,reboot,shutdown}
POST   /api/proxmox/containers/:vmid/{start,stop,reboot}
POST   /api/proxmox/nodes/:node/reboot
DELETE /api/proxmox/{vms,containers}/:vmid
POST   /api/home-assistant/services/:domain/:service
```

They are enumerated explicitly rather than caught by a wildcard, so the refusal
is a visible part of the contract instead of an accident of routing. The UI
renders the corresponding buttons disabled, which communicates "read-only" far
better than hiding them.

## Authentication

Single operator, LAN-only, no database. So:

- password stored as an scrypt digest (`npm run hash-password`)
- session is `base64url(payload).HMAC-SHA256(payload, SESSION_SECRET)`
- cookie is HttpOnly, `SameSite=Lax`, `Secure` when the request arrived over TLS
- revocation is done by rotating `SESSION_SECRET`

That last point is the trade-off: there is no server-side session store, so
individual sessions cannot be revoked. For a one-user homelab tool this is
acceptable and avoids introducing state.

Health endpoints stay public so Docker and Uptime Kuma can reach them without
credentials.

## Frontend state

`useResource` is a small state machine per endpoint:

```
loading → ok | empty | not_configured | disabled | error
```

with two extras that matter in practice:

- **`empty` is separate from `ok`.** A cluster with zero LXC containers is not
  the same as a cluster we failed to read.
- **`stale`.** When a poll fails while previous data is on screen, the data
  stays and a banner appears. Blanking a dashboard because one refresh timed out
  is worse than showing slightly old numbers with a warning.

## Caching

`TtlCache` holds upstream results for five seconds and coalesces concurrent
callers. Overview alone requests cluster, nodes, VMs and containers; without
coalescing that is four Proxmox round trips per tick. Failures are never cached,
so a transient error does not pin the UI to an error state for the whole TTL.

## Dependency choices

| Package | Why it is here |
| --- | --- |
| `express` | Already a dependency; the smallest thing that does routing + static |
| `zod` | Environment validation and untrusted upstream parsing, one library for both |
| `undici` | Needed to pass a custom CA and servername to `fetch` without disabling TLS |
| `dotenv` | Dev-only convenience; production passes real environment variables |
| `vitest` | Shares the Vite transform pipeline, so no second toolchain |
| `concurrently` | One `npm run dev` for both processes |
| `lucide-react` | Icon set the existing design already used |

Removed as unused: `@google/genai`, `recharts`, `motion`, `clsx`,
`tailwind-merge`, `autoprefixer`, `esbuild`. `recharts` will come back when
there is real time-series data to chart.
