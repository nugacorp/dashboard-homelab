# Deployment — VM120 (nuga-ops)

Target: Ubuntu Server 24.04.4, 2 vCPU / 4 GB / 40 GB, Docker Engine installed,
currently at `192.168.1.28`. Uptime Kuma already runs there on port 3001 and is
left completely alone — separate container, separate data, separate port.

End state: `http://192.168.1.28:8080`.

> Nothing in this document has been executed. It is the procedure to follow, and
> the checks to run at each step.

## 0. Before you start

- The DHCP lease on VM120 should become a reservation. A dashboard whose address
  moves is not much of a dashboard.
- Decide the dashboard password now; you will hash it in step 3.
- You will create a **new** Proxmox token. Do not reuse the one Hermes uses.

## 1. Create the read-only Proxmox token

On any cluster node (`pve-dell`, `pve-lenovo1` or `pve-lenovo2`):

```bash
pveum user add nuga-dashboard@pve --comment "NUGA HOME dashboard (read-only)"
pveum acl modify / --users nuga-dashboard@pve --roles PVEAuditor
pveum user token add nuga-dashboard@pve dashboard --privsep 0
```

The last command prints the secret **once**. Copy it straight into the `.env`
file in step 3.

Verify the token is genuinely read-only:

```bash
# should succeed
curl -s -H "Authorization: PVEAPIToken=nuga-dashboard@pve!dashboard=<SECRET>" \
     https://192.168.1.99:8006/api2/json/version --cacert /etc/pve/pve-root-ca.pem \
     --resolve pve-dell.dell:8006:192.168.1.99

# should fail with 403
curl -s -X POST -H "Authorization: PVEAPIToken=nuga-dashboard@pve!dashboard=<SECRET>" \
     https://192.168.1.99:8006/api2/json/nodes/pve-dell/qemu/100/status/stop \
     --cacert /etc/pve/pve-root-ca.pem --resolve pve-dell.dell:8006:192.168.1.99
```

## 2. Install the Proxmox CA on VM120

TLS verification stays on, so VM120 needs the cluster CA.

```bash
# On a Proxmox node
cat /etc/pve/pve-root-ca.pem

# On VM120
sudo mkdir -p /etc/nuga-home
sudo tee /etc/nuga-home/pve-root-ca.pem >/dev/null   # paste, then Ctrl-D
sudo chmod 644 /etc/nuga-home/pve-root-ca.pem
```

Confirm the CA actually validates the endpoint. Proxmox certificates carry the
node hostname, so `--resolve` stands in for what `PVE_TLS_SERVERNAME` does in
the app:

```bash
curl -sS --cacert /etc/nuga-home/pve-root-ca.pem \
     --resolve pve-dell.dell:8006:192.168.1.99 \
     -o /dev/null -w '%{http_code}\n' \
     https://pve-dell.dell:8006/api2/json/version
```

A `401` is the expected, correct answer: TLS verified, credentials not sent.
A TLS error here means the CA or the hostname is wrong — fix it before moving on,
and do **not** reach for `-k`.

Note the CN you validated against (`pve-dell.dell` above); it goes into
`PVE_TLS_SERVERNAME`.

## 3. Get the code and write the environment file

```bash
sudo mkdir -p /opt/nuga-home && sudo chown "$USER" /opt/nuga-home
git clone https://github.com/nugacorp/dashboard-homelab.git /opt/nuga-home
cd /opt/nuga-home
git checkout refactor/real-homelab-backend   # until the PR is merged

cp .env.example .env
chmod 600 .env
```

Generate the auth material:

```bash
# Password hash (needs Node 22 locally, or run it on your workstation and copy)
npm ci --no-audit --no-fund
npm run hash-password -- 'your-dashboard-password'
# → DASHBOARD_PASSWORD_HASH=scrypt$16384$8$1$....

# Session secret
openssl rand -base64 48
```

Edit `.env`:

```ini
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
UPSTREAM_TIMEOUT_MS=8000

PVE_API_URL=https://192.168.1.99:8006
PVE_TOKEN_ID=nuga-dashboard@pve!dashboard
PVE_TOKEN_SECRET=<the secret printed in step 1>
PVE_CA_CERT_PATH=/etc/nuga-home/pve-root-ca.pem
PVE_TLS_SERVERNAME=pve-dell.dell

HASS_URL=http://192.168.1.158
HASS_TOKEN=<long-lived token from Home Assistant>

HERMES_ENABLED=false
HERMES_API_URL=
HERMES_API_KEY=

UPTIME_KUMA_URL=http://192.168.1.28:3001

DASHBOARD_USERNAME=ramiro
DASHBOARD_PASSWORD_HASH=<from npm run hash-password>
SESSION_SECRET=<from openssl rand>
SESSION_TTL_HOURS=12
```

`.env` is git-ignored. Never commit it.

## 4. Build and start

```bash
cd /opt/nuga-home
docker compose up -d --build
docker compose ps
docker compose logs -f nuga-home
```

Expected startup log — note that no secret value appears:

```
INFO  NUGA HOME dashboard 1.0.0 starting
INFO    proxmox: configured (https://192.168.1.99:8006, ca=yes, servername=pve-dell.dell)
INFO    homeAssistant: configured (http://192.168.1.158)
INFO    hermes: disabled
INFO    uptimeKuma: http://192.168.1.28:3001
INFO    auth: enabled (user=ramiro)
INFO  Listening on http://0.0.0.0:8080
```

If you instead see `Configuration error: ...`, the message names the offending
variable. Fix it and `docker compose up -d` again.

## 5. Verify

```bash
# Liveness — never touches an upstream
curl -fsS http://192.168.1.28:8080/api/health/live

# Readiness — every integration should be "ok"
curl -fsS http://192.168.1.28:8080/api/health/ready | jq

# Auth must be enforced
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.1.28:8080/api/proxmox/cluster   # 401

# Write guard must refuse
curl -s -X POST -w '\n%{http_code}\n' http://192.168.1.28:8080/api/proxmox/vms/100/stop # 403
```

A healthy `ready` looks like:

```json
{
  "status": "ok",
  "auth": "enabled",
  "integrations": {
    "proxmox":       { "state": "ok", "detail": "Proxmox VE 8.x.y" },
    "homeAssistant": { "state": "ok", "detail": "Home Assistant 2026.x.y" },
    "hermes":        { "state": "disabled" },
    "uptimeKuma":    { "state": "ok", "detail": "Responded with HTTP 302" }
  }
}
```

### Reading a failure

| `error.code` | What it means | Where to look |
| --- | --- | --- |
| `UPSTREAM_TLS` | CA or hostname wrong | `PVE_CA_CERT_PATH`, `PVE_TLS_SERVERNAME` |
| `UPSTREAM_AUTH` | Token rejected | `PVE_TOKEN_ID` / `PVE_TOKEN_SECRET`, `HASS_TOKEN` |
| `UPSTREAM_FORBIDDEN` | Token lacks a privilege | Proxmox ACL — PVEAuditor on `/` |
| `UPSTREAM_UNREACHABLE` | Network/DNS/host down | Routing, firewall, IP changes |
| `UPSTREAM_TIMEOUT` | Too slow | `UPSTREAM_TIMEOUT_MS`, upstream load |

## 6. Open the UI

http://192.168.1.28:8080 — log in with `DASHBOARD_USERNAME` and the password you
hashed.

Expected on a correct install: Overview shows the three nodes with real CPU,
memory and disk; VMs lists 100 / 110 / 120; Smart Home reports the Home
Assistant version and entity counts with "No hay dispositivos configurados";
Network, UniFi, Starlink, Cameras, Energy and Logs show `NOT CONFIGURED`.

## 7. Add it to Uptime Kuma

Add an HTTP(s) monitor:

- URL: `http://192.168.1.28:8080/api/health/live`
- Accepted status: 200
- Interval: 60 s

Use `/live`, not `/ready`: readiness reports upstream problems, and you do not
want Kuma paging you about the dashboard when the actual fault is Proxmox.

## Updating

```bash
cd /opt/nuga-home
git pull
docker compose up -d --build
docker compose logs -f nuga-home
```

The container is stateless. Rebuilding loses nothing; users are logged out only
if `SESSION_SECRET` changes.

## Rolling back

```bash
git log --oneline -5
git checkout <previous-commit>
docker compose up -d --build
```

## Operational notes

- **Do not mount the Docker socket.** The compose file omits it deliberately.
- **Do not publish port 8080 beyond the LAN** without a reverse proxy that
  terminates TLS. Once behind one, set `TRUST_PROXY=true` so the `Secure` cookie
  flag is applied correctly.
- **Uptime Kuma stays independent.** Different container, different volume,
  port 3001. Nothing in this deployment touches it.
- **Log rotation** is configured in `compose.yaml` (10 MB × 3).
- **Resource use**: idle memory is well under 200 MB, which leaves plenty of the
  VM's 4 GB for Uptime Kuma.

## Still to validate on the target

These could not be verified from the development workstation and must be
confirmed on VM120:

- [ ] Proxmox with a real token: `ready` reports `proxmox: ok`
- [ ] TLS with the real cluster CA and `PVE_TLS_SERVERNAME`
- [ ] Home Assistant with a real long-lived token: `homeAssistant: ok`
- [ ] `docker compose up --build` completes and the healthcheck passes
- [ ] Node/VM/LXC figures match the Proxmox web UI
