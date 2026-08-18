import { HermesMessage } from '../../types';

export interface HermesProvider {
  sendMessage(prompt: string, context?: Record<string, unknown>): Promise<HermesMessage>;
}

export class HermesAdapter implements HermesProvider {
  private isDemo: boolean = true;

  constructor(demoMode: boolean = true) {
    this.isDemo = demoMode;
  }

  async sendMessage(prompt: string, context?: Record<string, unknown>): Promise<HermesMessage> {
    const lower = prompt.toLowerCase();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulated intelligent response generator tailored for NUGA HOME homelab
    if (lower.includes('wrong') || lower.includes('issue') || lower.includes('health') || lower.includes('status')) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: 'The homelab is operating with an overall Health Score of **98% (Healthy)**.\n\n• **Proxmox Cluster**: 3/3 nodes online, aggregate CPU at 28%.\n• **Attention Item**: `pve-node-02` RAM utilization is at 66.8% (21.4 / 32 GB) due to Frigate NVR video caching and Plex transcoding buffers.\n• **Starlink**: Online at 245 Mbps with 32 ms latency.\n• **All 8 Cameras**: Active & recording with Coral TPU acceleration.',
        contextCard: {
          title: 'System Health Diagnostic',
          type: 'metric',
          data: {
            'Global Score': '98/100',
            'Cluster Status': '3/3 Online',
            'Active Warnings': '1 (Node 02 RAM cache)',
            'Internet Uplink': 'Starlink Online (32ms)'
          }
        }
      };
    }

    if (lower.includes('ram') || lower.includes('memory') || lower.includes('node')) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: 'Node memory breakdown:\n\n1. **`pve-node-02`**: Highest usage at **21.4 GB / 32 GB (66.8%)** — hosting Frigate NVR (8.4 GB) and Plex Media (4.5 GB).\n2. **`pve-node-01`**: **18.2 GB / 32 GB (56.8%)** — hosting Docker host (11.4 GB) and HAOS (4.2 GB).\n3. **`pve-node-03`**: **13.8 GB / 32 GB (43.1%)** — hosting TrueNAS (12.8 GB ARC cache) and Postgres (2.4 GB).',
        contextCard: {
          title: 'Memory Utilization by Node',
          type: 'node',
          data: {
            'pve-node-02 (Highest)': '21.4 / 32 GB (66.8%)',
            'pve-node-01': '18.2 / 32 GB (56.8%)',
            'pve-node-03': '13.8 / 32 GB (43.1%)',
            'Cluster Total': '43.0 / 96 GB (44.7%)'
          }
        }
      };
    }

    if (lower.includes('camera') || lower.includes('frigate')) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: 'All **8 security cameras** are online and recording at full framerate. The Google Coral USB Edge TPU is running with **7.2 ms inference latency** at 44°C.\n\nToday\'s AI Detections:\n• 48 Persons\n• 19 Vehicles\n• 12 Animals\n• 6 Packages',
        contextCard: {
          title: 'Security Camera Telemetry',
          type: 'metric',
          data: {
            'Online Streams': '8 / 8 Active',
            'Coral TPU Speed': '7.2 ms inference',
            'TPU Thermals': '44°C (Optimal)',
            'Last Event': 'Vehicle at Driveway (19:32)'
          }
        }
      };
    }

    if (lower.includes('storage') || lower.includes('nas') || lower.includes('disk') || lower.includes('space')) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: 'The primary ZFS RAID-Z2 pool (`tank-zfs-raidz2`) has **5.6 TB available** out of 12 TB total (**53.3% utilized**).\n\n• Immich Library: 2.84 TB (48,240 photos, 3,812 videos)\n• VM & LXC Disks: 1.84 TB\n• Media & ISOs: 1.72 TB\n• All 6 Seagate IronWolf Pro drives report SMART **PASSED** at 35–38°C.',
        contextCard: {
          title: 'ZFS Pool & SMART Health',
          type: 'metric',
          data: {
            'Pool Capacity': '6.4 TB Used / 12 TB Total',
            'Free Space': '5.6 TB (46.7%)',
            'SMART Status': '6/6 Disks Passed',
            'Last Scrub': '2 days ago (0 errors)'
          }
        }
      };
    }

    if (lower.includes('latency') || lower.includes('internet') || lower.includes('starlink') || lower.includes('speed')) {
      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: 'Internet uplink is connected via **Starlink Dishy V3**:\n\n• **Download**: 245.8 Mbps\n• **Upload**: 28.4 Mbps\n• **Latency**: 32 ms (stable, ±4ms jitter)\n• **Packet Loss**: 0.1%\n• **Obstructions**: 0.0% clean sky view',
        contextCard: {
          title: 'Starlink Telemetry',
          type: 'metric',
          data: {
            'Status': 'Online (99.98% Uptime)',
            'Latency': '32 ms',
            'Download': '245.8 Mbps',
            'Dish Temp': '34°C (Normal)'
          }
        }
      };
    }

    if (lower.includes('restart') || lower.includes('reboot') || lower.includes('stop') || lower.includes('shutdown')) {
      const target = lower.includes('immich') ? 'Immich Server Container' : lower.includes('frigate') ? 'Frigate NVR Container' : lower.includes('ha') || lower.includes('home assistant') ? 'Home Assistant OS (VM 100)' : 'Requested Resource';

      return {
        id: 'msg-' + Date.now(),
        sender: 'hermes',
        timestamp: now,
        text: `I am currently operating with **READ-ONLY safety guardrails**. To perform administrative actions like restarting **${target}**, your explicit manual authorization is required:`,
        proposedAction: {
          id: 'act-' + Date.now(),
          action: `Restart ${target}`,
          resource: target,
          impact: 'Temporary 10-30s downtime for dependent services during restart cycle.',
          status: 'pending'
        }
      };
    }

    // Default conversational reply
    return {
      id: 'msg-' + Date.now(),
      sender: 'hermes',
      timestamp: now,
      text: `Understood, Ramiro. I am continuously monitoring all 3 Proxmox nodes, UniFi network routes, Home Assistant entities, and Starlink telemetry. You can ask me to inspect server loads, camera detections, storage SMART metrics, or review system alerts.`,
      contextCard: {
        title: 'Hermes Command Center',
        type: 'metric',
        data: {
          'Active Services': '32 Running',
          'Monitored Sensors': '64 Entities',
          'Operating Mode': 'Read-Only (Safe)'
        }
      }
    };
  }
}

export const hermesService = new HermesAdapter(true);
