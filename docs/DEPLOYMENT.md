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
# 1a. Dedicated user
pveum user add nuga-dashboard@pve \
  --comment "NUGA HOME dashboard read-only"

# 1b. Read-only role for the user
pveum acl modify / \
  -user nuga-dashboard@pve \
  -role PVEAuditor

# 1c. Token WITH privilege separation
pveum user token add nuga-dashboard@pve dashboard \
  -privsep 1

# 1d. Grant the token its own read-only role
pveum acl modify / \
  -token 'nuga-dashboard@pve!dashboard' \
  -role PVEAuditor
```

Step 1c prints the secret **once**. Copy it straight into the `.env` file in
step 3.

### Why `-privsep 1` and not `-privsep 0`

With `-privsep 0` the token inherits **everything the user can do**, now and in
the future. That makes the token's effective permissions a property of the user
account rather than of the token, so granting the user an extra role later
silently widens the token too — with no signal here and no change to this
repository.

With `-privsep 1` the token starts with **no** privileges and holds only what is
granted to the token principal in step 1d. Its ceiling is therefore the
intersection of the user's rights and the token's own ACL: least privilege that
stays least privilege.

Both ACLs are required. Skipping 1d with `-privsep 1` produces a token that
authenticates but is authorised for nothing, which surfaces in the dashboard as
`UPSTREAM_FORBIDDEN`.

### Verify the token is genuinely read-only

Run both. The first must succeed, the second must be refused.

```bash
TOKEN='PVEAPIToken=nuga-dashboard@pve!dashboard=<SECRET>'

# READ — expect HTTP 200 and a version payload
curl -sS -o /dev/null -w 'read:  %{http_code}\n' \
     -H "Authorization: $TOKEN" \
     --cacert /etc/pve/pve-root-ca.pem \
     --resolve pve-dell.dell:8006:192.168.1.99 \
     https://pve-dell.dell:8006/api2/json/version

# WRITE — expect HTTP 403; a 200 here means the token is NOT read-only
curl -sS -o /dev/null -w 'write: %{http_code}\n' \
     -X POST -H "Authorization: $TOKEN" \
     --cacert /etc/pve/pve-root-ca.pem \
     --resolve pve-dell.dell:8006:192.168.1.99 \
     https://pve-dell.dell:8006/api2/json/nodes/pve-dell/qemu/100/status/stop
```

Expected output:

```
read:  200
write: 403
```

Anything else — especially `write: 200` — means the ACL is wrong. Stop and fix
it before continuing; do not deploy a token that can power off VM 100.

You can confirm the separation is actually in effect with:

```bash
pveum user token list nuga-dashboard@pve            # privsep column must be 1
pveum acl list | grep nuga-dashboard                # user AND token entries
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

### Authentication is mandatory for this deployment

The **application** treats authentication as optional: with the three variables
below unset it starts in LAN-open mode and logs a warning. That exists so a
first run on a laptop is frictionless, and so the health endpoints stay usable.

**This deployment does not use that mode.** VM120 serves live infrastructure
data — node inventory, guest names, storage capacity, Home Assistant entities —
to anything that can reach port 8080. All three of these are required before
`docker compose up`:

| Variable | Required on VM120 |
| --- | --- |
| `DASHBOARD_USERNAME` | yes |
| `DASHBOARD_PASSWORD_HASH` | yes |
| `SESSION_SECRET` | yes (≥ 32 chars) |

They are all-or-nothing: setting one or two of them is a startup error, so a
partial edit fails loudly instead of quietly leaving the dashboard open.

Generate the auth material:

```bash
# Password hash (needs Node 22 locally, or run it on your workstation and copy)
npm ci --no-audit --no-fund
npm run hash-password -- 'your-dashboard-password'
# → DASHBOARD_PASSWORD_HASH=scrypt$16384$8$1$....

# Session secret
openssl rand -base64 48
```

Step 5 verifies the result: if `/api/health/ready` reports `"auth": "disabled"`,
the deployment is not finished.

Edit `.env`:

```ini
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
UPSTREAM_TIMEOUT_MS=8000
# Host interface docker publishes on. Empty = all interfaces.
BIND_ADDRESS=

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

# Auth must be ENABLED - must print "enabled", never "disabled"
curl -fsS http://192.168.1.28:8080/api/health/ready | jq -r .auth

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

If `auth` reads `"disabled"`, stop: the three `DASHBOARD_*` /
`SESSION_SECRET` variables did not reach the container. Check `.env` and look
for the "Dashboard authentication is DISABLED" warning in
`docker compose logs`, fix it, and restart before using this instance.

### Reading a failure

| `error.code` | What it means | Where to look |
| --- | --- | --- |
| `UPSTREAM_TLS` | CA or hostname wrong | `PVE_CA_CERT_PATH`, `PVE_TLS_SERVERNAME` |
| `UPSTREAM_AUTH` | Token rejected | `PVE_TOKEN_ID` / `PVE_TOKEN_SECRET`, `HASS_TOKEN` |
| `UPSTREAM_FORBIDDEN` | Token lacks a privilege | With `-privsep 1` the **token** needs its own PVEAuditor grant (step 1d) |
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
- **Know what the port publish actually does.** `docker compose` publishes
  `8080` on the host, and by default on *every* host interface (`0.0.0.0`), not
  only the LAN NIC. Nothing in `compose.yaml` restricts who can reach it — that
  is the job of the network topology and the host firewall. Two ways to narrow
  it, in increasing strictness:

  ```bash
  # a) pin the listener to one interface (set in .env, read by compose)
  BIND_ADDRESS=192.168.1.28

  # b) or leave it open on the host and filter at the firewall
  sudo ufw allow from 192.168.1.0/24 to any port 8080 proto tcp
  sudo ufw deny 8080/tcp
  ```

  `BIND_ADDRESS` is left unset by default so the first deployment works before
  VM120 has a DHCP reservation.
- **Do not expose 8080 to the internet** without a reverse proxy that terminates
  TLS. Once behind one, set `TRUST_PROXY=true` so the `Secure` cookie flag is
  applied correctly, and consider `BIND_ADDRESS=127.0.0.1` if the proxy runs on
  the same host.
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
