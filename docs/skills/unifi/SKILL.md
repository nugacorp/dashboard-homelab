---
name: nuga-home-unifi
description: Operación segura de UniFi/UCG Max para NUGA HOME: Starlink, WAN/LAN, DHCP, DNS, Zone-Based Firewall, VLANs, mDNS, Protect y API oficial. Usar para diagnóstico y planificación; cambios de red de alto impacto requieren aprobación explícita.
version: 1.1.0
author: Ramiro
platforms: [linux]
metadata:
  hermes:
    tags: [homelab, unifi, ucg-max, networking, starlink, protect, nuga-home]
---

# UniFi / UCG Max — NUGA HOME Skill

## Propósito
Operar UniFi dentro de NUGA HOME con estabilidad, seguridad, trazabilidad y simplicidad.

## Fuentes de verdad
1. Estado real de la consola local UCG Max.
2. Ubiquiti Help Center / Tech Specs.
3. Release notes oficiales de Ubiquiti Community.
4. API oficial local documentada en `UniFi Network > Integrations`.
5. Para Starlink, documentación oficial y Starlink App.

No usar blogs, videos o foros como autoridad principal para cambios de producción.

## Método operativo
- Una fase a la vez.
- Inspeccionar antes de modificar.
- Backup antes de cambios importantes.
- Cambios de WAN, LAN, DHCP, DNS, VLAN, firewall, bypass o port remapping requieren gate explícito.
- Mantener siempre una vía de acceso local durante cambios.
- Después de cada cambio validar enlace, IP, gateway, DNS, Internet y acceso administrativo.
- Si algo falla, diagnosticar antes de corregir.
- Preferir UI y API oficial; SSH solo si hace falta.

## UCG Max — capacidades relevantes
- 5 puertos RJ45 2.5 GbE.
- 1 WAN por defecto; hasta 4 WAN por remapeo.
- IDS/IPS aprox. 2.3 Gbps.
- 30+ dispositivos UniFi.
- 300+ clientes.
- Apps: Network, Protect, Access, Talk y Connect.
- NVMe seleccionable hasta 2 TB.
- Protect: 15 cámaras HD, 8 cámaras 2K o 5 cámaras 4K.

## Estado NUGA HOME
Objetivo de LAN:
- Red: `192.168.1.0/24`
- Gateway UCG Max: `192.168.1.1`
- DHCP activo: `192.168.1.200-192.168.1.230`
- Infraestructura crítica fuera del pool DHCP.

IPs estáticas verificadas:
- `pve-lenovo2` → `192.168.1.97`
- `pve-lenovo1` → `192.168.1.98`
- `pve-dell` → `192.168.1.99`
- LXC101 `nuga-dns-01` → `192.168.1.100`
- VM110 `hermes-core` → `192.168.1.88`
- VM120 `nuga-ops` → `192.168.1.28`, backup `10.77.0.20`
- VM102 `hermes-team-lab` → `192.168.1.151`
- VM100 `home-assistant` → `192.168.1.158`

Adicional verificado:
- NUGA EDGE / Raspberry Pi → `192.168.1.236`

Pendiente de verificar:
- VM130 `chr-lab`

## Regla crítica para Starlink Bypass
Nunca dejar el homelab en el mismo switch L2 que la salida Starlink cuando Starlink esté en bypass.

Topología objetivo:
`Starlink Ethernet -> UCG Max WAN`
`UCG Max LAN -> EdgeRouter X como switch -> homelab`

Secuencia segura:
1. Mantener UCG LAN temporal `192.168.0.1`.
2. Mantener PC de administración conectada al LAN del UCG.
3. Desconectar Starlink del EdgeRouter X.
4. Conectar Starlink directamente al WAN del UCG.
5. Confirmar Internet.
6. Activar Starlink Bypass.
7. Confirmar que el WAN del UCG ya no está en `192.168.1.0/24`.
8. Solo entonces cambiar LAN Default del UCG a `192.168.1.1/24`.
9. Configurar DHCP manual.
10. Renovar IP de la PC y validar `192.168.1.1`.
11. Conectar un LAN del UCG al EdgeRouter X/homelab.
12. Validar todos los servicios críticos.

Nunca configurar WAN y LAN del UCG dentro de `192.168.1.0/24` al mismo tiempo.

## DHCP y DNS
- Servidores/hipervisores/appliances críticos: IP estática en el host o guest.
- Clientes normales: DHCP.
- No crear reservas DHCP redundantes para hosts ya estáticos.
- Para IP estática fuera del pool, crear DNS Host (A/AAAA) si se desea resolución local.
- DNS LAN activo: Technitium `nuga-dns-01` → `192.168.1.100`.
- DHCP del UCG entrega `192.168.1.100` como DNS.
- Zona autoritativa local: `localdomain`.
- El propio LXC DNS mantiene resolver de SO externo para evitar dependencia circular.

## Zone-Based Firewall
Zonas integradas:
- External
- Internal
- Gateway
- VPN
- Hotspot
- DMZ

La red `Default` actual está en `Internal`.

Reglas clave:
- `Internal -> Internal` es Allow All por defecto.
- Varias VLAN dentro de `Internal` NO quedan aisladas automáticamente.
- `External -> Internal` permite retorno established/related y bloquea conexiones nuevas.
- `Gateway` representa tráfico hacia/desde el UCG.
- Una red solo puede pertenecer a una zona.
- Se pueden crear zonas personalizadas; máximo documentado: 30.

No modificar la matriz de zonas durante el cutover inicial.

## Segmentación futura
Después de estabilizar el gateway:
- Trusted / servidores / administración.
- IoT.
- Cameras / Protect.
- Guest / Hotspot.
- Lab.
- Management si se justifica.

Usar ZBF, Network Isolation y ACLs según corresponda. Evitar reglas aisladas por IP cuando Objects/Device Groups/Networks sean más mantenibles.

## mDNS
UniFi puede reenviar mDNS entre VLANs.
Modos: Auto, Off, Custom.
Para NUGA HOME segmentado, preferir `Custom` y publicar solo los servicios necesarios.

## VLANs y puertos
- Native VLAN = tráfico untagged.
- Tagged VLAN = VLAN permitida etiquetada.
- Access = solo Native VLAN.
- Trunk = Native + VLANs tagged.
- No restringir un uplink a switch/AP sin confirmar todas las VLAN necesarias.

## WAN / Starlink
Starlink recomienda router de terceros con WAN DHCP/Automatic.
Health checks contra IP pública, por ejemplo `8.8.8.8` o `1.1.1.1`.

Bypass desactiva funciones de router/Wi‑Fi Starlink; dependiendo del kit, salir de bypass puede requerir factory reset.

## IPv6
Configurar después de estabilizar IPv4.
UniFi soporta SLAAC, DHCPv6/Prefix Delegation, Static IPv6, RA y ULA.
No copiar ciegamente la configuración IPv6 anterior; primero comprobar lo que Starlink entrega directamente al UCG.

## Seguridad
### IDS/IPS
`Settings > CyberSecure > Protection`
- Notify = IDS
- Notify and Block = IPS

No endurecer al máximo durante el cutover.

### Protect
Security Advisory Bulletin 067 (26 Aug 2026):
- Protect 7.1.87 y anteriores: vulnerables.
- Mitigación oficial: Protect 7.2.105 o posterior.

### Backups
Usar System Config Backup:
`Settings > Control Plane > Backups`

### SSH
SSH del Cloud Gateway está deshabilitado por defecto. Mantenerlo así salvo necesidad concreta.

## API e integración NUGA HOME
Ubiquiti ofrece:
- Site Manager API para visión agregada.
- Local Application APIs por aplicación.

Para Network, usar la documentación exacta de la versión instalada en:
`UniFi Network > Integrations`

En NUGA HOME:
- API = observación.
- Integración oficial local activa con Network 10.6.101.
- API key backend-only.
- TLS verificado con certificado UCG y `unifi.local`.
- Backend con allow-list estricta de endpoints GET.
- Datos reales: sitio, dispositivos, estadísticas, clientes, redes/VLANs, WiFi y WANs.
- No existen POST/PUT/PATCH/DELETE ni `/actions` en `UnifiService`.
- Cualquier control futuro será una fase separada con autorización, allow-list y auditoría.

## Network 10.6.101
Versión observada en la consola.
Release oficial 10.6.101:
- Drift Inspector.
- Topology Spotlight.
- SafeOps ampliado.
- Time Machine mejorado.
- DHCP Guarding habilitado por defecto en redes nuevas.

## Protect + 8 G4 Bullet
G4 Bullet:
- 2K.
- 4 MP, 2688x1512.
- 24 FPS.
- PoE.
- Hasta 4 W.

Ocho G4 Bullet coinciden exactamente con el límite oficial del UCG Max de 8 cámaras 2K.
Para crecimiento, mayor retención o separar carga, evaluar UNVR.

## Checklist post-cutover
Validar:
- UCG LAN `192.168.1.1/24`
- UCG WAN DHCP Starlink fuera de `192.168.1.0/24`
- Internet y DNS
- `.97` pve-lenovo2
- `.98` pve-lenovo1
- `.99` pve-dell
- `.100` nuga-dns-01
- `.88` hermes-core
- `.28` nuga-ops
- `.151` hermes-team-lab
- `.158` Home Assistant
- backup `10.77.0.0/24`
- NUGA HOME Dashboard
- acceso local UniFi
- Starlink App
- ausencia de doble DHCP

Después:
- chr-lab
- IPv6
- VLANs/ZBF
- IDS/IPS
- Protect/cámaras

## Referencias oficiales base
- Ubiquiti Help Center — Zone-Based Firewalls in UniFi
- Traffic & Policy Management in UniFi
- Creating Virtual Networks (VLANs)
- UniFi DHCP Server
- Switch Port VLAN Assignment
- UniFi Gateway mDNS Proxy
- Getting Started with the Official UniFi API
- Backups and Migration in UniFi
- Configuring IPv6 in UniFi
- IDS/IPS
- DNS Records and Local Hostnames
- Ubiquiti Tech Specs — Cloud Gateway Max
- Ubiquiti Tech Specs — G4 Bullet
- Ubiquiti Community — Network 10.6.101 Official
- Ubiquiti Community — Security Advisory Bulletin 067
- Starlink Help Center — Using a Third-Party Router with Starlink

Última revisión documental: 2026-09-04.
