import {
  GlobalOverview,
  ProxmoxCluster,
  ProxmoxNode,
  VirtualMachine,
  LXCContainer,
  StarlinkTelemetry,
  UniFiNetwork,
  SmartHomeSummary,
  RoomData,
  CameraStream,
  FrigateStats,
  StoragePool,
  DiskDrive,
  ImmichStats,
  BackupJob,
  HomelabService,
  DockerContainer,
  EnergyData,
  SystemAlert,
  ActivityEvent,
  SystemLog,
  IntegrationSetting,
  HermesMessage
} from '../types';

export const initialOverview: GlobalOverview = {
  user: {
    name: 'Ramiro',
    greeting: 'Good evening, Ramiro',
    role: 'Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
  },
  healthScore: 98,
  statusText: 'All systems operational',
  homeStatus: 'Healthy',
  lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
};

export const mockProxmoxCluster: ProxmoxCluster = {
  name: 'nuga-pve-cluster',
  health: 'healthy',
  nodesOnline: 3,
  nodesTotal: 3,
  quorate: true,
  totalCpuCores: 40,
  cpuUsagePct: 28,
  totalRamBytes: 96 * 1024 * 1024 * 1024,
  usedRamBytes: 43 * 1024 * 1024 * 1024,
  totalStorageBytes: 12 * 1024 * 1024 * 1024 * 1024,
  usedStorageBytes: 6.4 * 1024 * 1024 * 1024 * 1024,
  vmsCount: 14,
  containersCount: 22
};

export const mockProxmoxNodes: ProxmoxNode[] = [
  {
    id: 'pve-node-01',
    name: 'pve-node-01',
    status: 'online',
    cpuModel: 'AMD Ryzen 9 5900X (12C/24T)',
    cpuCores: 24,
    cpuUsagePct: 23,
    ramTotalGb: 32,
    ramUsedGb: 18.2,
    storageTotalTb: 4.0,
    storageUsedTb: 1.84,
    temperatureC: 48,
    uptimeDays: 23,
    uptimeString: '23 days, 14:22',
    loadAverage: [1.24, 1.15, 0.98],
    networkRxMbps: 142.5,
    networkTxMbps: 88.2,
    vmsRunning: 6,
    vmsTotal: 6,
    containersRunning: 9,
    containersTotal: 9,
    ip: '192.168.1.10'
  },
  {
    id: 'pve-node-02',
    name: 'pve-node-02',
    status: 'online',
    cpuModel: 'Intel Core i7-12700 (12C/20T)',
    cpuCores: 20,
    cpuUsagePct: 34,
    ramTotalGb: 32,
    ramUsedGb: 21.4,
    storageTotalTb: 4.0,
    storageUsedTb: 2.12,
    temperatureC: 51,
    uptimeDays: 18,
    uptimeString: '18 days, 06:40',
    loadAverage: [1.88, 1.62, 1.45],
    networkRxMbps: 98.4,
    networkTxMbps: 165.1,
    vmsRunning: 5,
    vmsTotal: 5,
    containersRunning: 8,
    containersTotal: 8,
    ip: '192.168.1.11'
  },
  {
    id: 'pve-node-03',
    name: 'pve-node-03',
    status: 'online',
    cpuModel: 'Intel N100 Low-Power Quad Core',
    cpuCores: 4,
    cpuUsagePct: 17,
    ramTotalGb: 32,
    ramUsedGb: 13.8,
    storageTotalTb: 4.0,
    storageUsedTb: 1.44,
    temperatureC: 42,
    uptimeDays: 45,
    uptimeString: '45 days, 11:05',
    loadAverage: [0.45, 0.52, 0.48],
    networkRxMbps: 45.8,
    networkTxMbps: 38.6,
    vmsRunning: 3,
    vmsTotal: 3,
    containersRunning: 5,
    containersTotal: 5,
    ip: '192.168.1.12'
  }
];

export const mockVirtualMachines: VirtualMachine[] = [
  {
    vmid: 100,
    name: 'haos-production',
    node: 'pve-node-01',
    status: 'running',
    os: 'Home Assistant OS 12.1',
    cpuCores: 4,
    cpuUsagePct: 12.4,
    ramTotalMb: 8192,
    ramUsedMb: 4210,
    diskTotalGb: 120,
    ipAddress: '192.168.1.20',
    uptime: '23d 14h',
    description: 'Primary Home Assistant Controller & Zigbee/Z-Wave Coordinator'
  },
  {
    vmid: 101,
    name: 'docker-services-01',
    node: 'pve-node-01',
    status: 'running',
    os: 'Ubuntu 24.04 LTS',
    cpuCores: 8,
    cpuUsagePct: 31.8,
    ramTotalMb: 16384,
    ramUsedMb: 11450,
    diskTotalGb: 250,
    ipAddress: '192.168.1.21',
    uptime: '23d 14h',
    description: 'Main Docker Swarm / Portainer Host for Web & Immich Services'
  },
  {
    vmid: 102,
    name: 'frigate-nvr-node',
    node: 'pve-node-02',
    status: 'running',
    os: 'Debian 12 Bookworm',
    cpuCores: 6,
    cpuUsagePct: 42.1,
    ramTotalMb: 12288,
    ramUsedMb: 8400,
    diskTotalGb: 500,
    ipAddress: '192.168.1.22',
    uptime: '18d 06h',
    description: 'Frigate NVR with Google Coral Edge TPU USB passthrough'
  },
  {
    vmid: 103,
    name: 'hermes-ai-gateway',
    node: 'pve-node-02',
    status: 'running',
    os: 'Ubuntu 24.04 LTS',
    cpuCores: 6,
    cpuUsagePct: 15.6,
    ramTotalMb: 8192,
    ramUsedMb: 3950,
    diskTotalGb: 100,
    ipAddress: '192.168.1.23',
    uptime: '18d 06h',
    description: 'Hermes AI infrastructure assistant engine & Ollama proxy'
  },
  {
    vmid: 104,
    name: 'truenas-storage-vm',
    node: 'pve-node-03',
    status: 'running',
    os: 'TrueNAS SCALE 24.04',
    cpuCores: 4,
    cpuUsagePct: 18.2,
    ramTotalMb: 16384,
    ramUsedMb: 12800,
    diskTotalGb: 12000,
    ipAddress: '192.168.1.24',
    uptime: '45d 11h',
    description: 'ZFS Storage Pool Array with SAS Controller PCIe Passthrough'
  },
  {
    vmid: 105,
    name: 'ollama-llm-local',
    node: 'pve-node-01',
    status: 'running',
    os: 'Ubuntu 24.04 LTS',
    cpuCores: 8,
    cpuUsagePct: 8.5,
    ramTotalMb: 16384,
    ramUsedMb: 7600,
    diskTotalGb: 300,
    ipAddress: '192.168.1.25',
    uptime: '12d 04h',
    description: 'Local LLM server running Llama 3.1 & Qwen 2.5'
  },
  {
    vmid: 106,
    name: 'plex-media-host',
    node: 'pve-node-02',
    status: 'running',
    os: 'Ubuntu 22.04 LTS',
    cpuCores: 4,
    cpuUsagePct: 22.0,
    ramTotalMb: 8192,
    ramUsedMb: 4500,
    diskTotalGb: 150,
    ipAddress: '192.168.1.26',
    uptime: '18d 06h',
    description: 'Plex Media Server with Intel QuickSync Hardware Transcoding'
  },
  {
    vmid: 107,
    name: 'postgres-db-cluster',
    node: 'pve-node-03',
    status: 'running',
    os: 'Debian 12 Bookworm',
    cpuCores: 2,
    cpuUsagePct: 14.3,
    ramTotalMb: 4096,
    ramUsedMb: 2480,
    diskTotalGb: 100,
    ipAddress: '192.168.1.27',
    uptime: '45d 11h',
    description: 'Dedicated PostgreSQL 16 server for Home Assistant & Immich'
  },
  {
    vmid: 108,
    name: 'adguard-dns-primary',
    node: 'pve-node-01',
    status: 'running',
    os: 'Alpine Linux 3.19',
    cpuCores: 2,
    cpuUsagePct: 3.1,
    ramTotalMb: 2048,
    ramUsedMb: 420,
    diskTotalGb: 20,
    ipAddress: '192.168.1.2',
    uptime: '23d 14h',
    description: 'Primary Recursive DNS & Network-wide Ad Blocker'
  },
  {
    vmid: 109,
    name: 'tailscale-mesh-router',
    node: 'pve-node-03',
    status: 'running',
    os: 'Alpine Linux 3.19',
    cpuCores: 1,
    cpuUsagePct: 1.8,
    ramTotalMb: 1024,
    ramUsedMb: 190,
    diskTotalGb: 10,
    ipAddress: '192.168.1.3',
    uptime: '45d 11h',
    description: 'Subnet Router for encrypted remote VPN access'
  }
];

export const mockLXCContainers: LXCContainer[] = [
  {
    vmid: 200,
    name: 'redis-broker',
    node: 'pve-node-01',
    status: 'running',
    template: 'alpine-3.19-default',
    cpuUsagePct: 1.2,
    ramTotalMb: 1024,
    ramUsedMb: 210,
    ipAddress: '192.168.1.50',
    uptime: '23d 14h',
    description: 'High-speed Redis cache & session broker'
  },
  {
    vmid: 201,
    name: 'mosquitto-mqtt',
    node: 'pve-node-01',
    status: 'running',
    template: 'alpine-3.19-default',
    cpuUsagePct: 0.8,
    ramTotalMb: 512,
    ramUsedMb: 95,
    ipAddress: '192.168.1.51',
    uptime: '23d 14h',
    description: 'MQTT broker for 64 Zigbee/Z-Wave IoT sensors'
  },
  {
    vmid: 202,
    name: 'nginx-proxy-mgr',
    node: 'pve-node-02',
    status: 'running',
    template: 'debian-12-standard',
    cpuUsagePct: 4.5,
    ramTotalMb: 2048,
    ramUsedMb: 610,
    ipAddress: '192.168.1.52',
    uptime: '18d 06h',
    description: 'SSL Reverse Proxy & Let\'s Encrypt auto-renewal'
  },
  {
    vmid: 203,
    name: 'uptime-kuma',
    node: 'pve-node-03',
    status: 'running',
    template: 'alpine-3.19-default',
    cpuUsagePct: 2.1,
    ramTotalMb: 1024,
    ramUsedMb: 340,
    ipAddress: '192.168.1.53',
    uptime: '45d 11h',
    description: 'External heartbeat status monitor'
  },
  {
    vmid: 204,
    name: 'zigbee2mqtt',
    node: 'pve-node-01',
    status: 'running',
    template: 'debian-12-standard',
    cpuUsagePct: 2.4,
    ramTotalMb: 1024,
    ramUsedMb: 380,
    ipAddress: '192.168.1.54',
    uptime: '23d 14h',
    description: 'Sonoff Zigbee 3.0 USB Dongle Coordinator'
  },
  {
    vmid: 205,
    name: 'zwave-js-ui',
    node: 'pve-node-01',
    status: 'running',
    template: 'debian-12-standard',
    cpuUsagePct: 1.9,
    ramTotalMb: 1024,
    ramUsedMb: 290,
    ipAddress: '192.168.1.55',
    uptime: '23d 14h',
    description: 'Zooz 800 Z-Wave Stick Controller'
  },
  {
    vmid: 206,
    name: 'node-red-flow',
    node: 'pve-node-02',
    status: 'running',
    template: 'debian-12-standard',
    cpuUsagePct: 5.2,
    ramTotalMb: 2048,
    ramUsedMb: 820,
    ipAddress: '192.168.1.56',
    uptime: '18d 06h',
    description: 'Advanced rule automation pipelines'
  },
  {
    vmid: 207,
    name: 'portainer-ce',
    node: 'pve-node-03',
    status: 'running',
    template: 'alpine-3.19-default',
    cpuUsagePct: 1.1,
    ramTotalMb: 1024,
    ramUsedMb: 180,
    ipAddress: '192.168.1.57',
    uptime: '45d 11h',
    description: 'Container UI management agent'
  }
];

export const mockStarlink: StarlinkTelemetry = {
  status: 'Online',
  deviceModel: 'Starlink Standard Actuated (Dishy V3)',
  downloadMbps: 245.8,
  uploadMbps: 28.4,
  latencyMs: 32,
  packetLossPct: 0.1,
  uptimePct: 99.98,
  publicIp: '98.142.215.74',
  gateway: '100.64.0.1 (CGNAT Bypass Enabled)',
  dnsStatus: '1.1.1.1 / 1.0.0.1 (Quad9 & Cloudflare DoT Active)',
  dishStatus: 'Connected',
  dishTemperatureC: 34,
  signalQualityPct: 98,
  azimuthDeg: 28.4,
  elevationDeg: 62.1,
  tiltDeg: 25.0,
  obstructionFraction: 0.0,
  lastOutage: '3 days ago (4s micro-drop during satellite handoff)',
  recentOutages: [
    { timestamp: '3d ago, 04:12', durationSec: 4, cause: 'Satellite Handoff Transition' },
    { timestamp: '9d ago, 22:45', durationSec: 12, cause: 'Heavy Rain Attenuation' },
    { timestamp: '18d ago, 03:00', durationSec: 45, cause: 'Dish Firmware Update (Auto-reboot)' }
  ],
  latencyHistory: [
    { time: '12:00', latency: 31, download: 220, upload: 25 },
    { time: '13:00', latency: 29, download: 235, upload: 27 },
    { time: '14:00', latency: 34, download: 250, upload: 29 },
    { time: '15:00', latency: 32, download: 242, upload: 28 },
    { time: '16:00', latency: 36, download: 215, upload: 24 },
    { time: '17:00', latency: 38, download: 230, upload: 26 },
    { time: '18:00', latency: 33, download: 260, upload: 31 },
    { time: '19:00', latency: 32, download: 245, upload: 28 }
  ]
};

export const mockUniFi: UniFiNetwork = {
  networkHealth: 'excellent',
  gatewayStatus: 'Online',
  gatewayModel: 'UniFi Dream Machine Pro (UDM-Pro)',
  wanStatus: 'Connected',
  lanStatus: 'Active',
  wifiExperiencePct: 99,
  connectedClients: 42,
  activeSwitches: 3,
  activeAPs: 4,
  throughputRxMbps: 342.1,
  throughputTxMbps: 48.6,
  internetUtilizationPct: 41,
  devices: [
    {
      id: 'udm-pro',
      name: 'UDM-Pro Gateway',
      type: 'gateway',
      model: 'UniFi Dream Machine Pro',
      ip: '192.168.1.1',
      status: 'online',
      uptime: '45d 11h',
      cpuPct: 18,
      ramPct: 42,
      firmware: 'UniFi OS 4.0.6',
      connectedClients: 42
    },
    {
      id: 'usw-pro-24-poe',
      name: 'Core Switch 24 PoE',
      type: 'switch',
      model: 'USW-Pro-24-PoE Gen2',
      ip: '192.168.1.4',
      status: 'online',
      uptime: '45d 11h',
      cpuPct: 12,
      ramPct: 35,
      firmware: 'v7.0.50',
      portPoEUsageW: 142.5
    },
    {
      id: 'u6-pro-living',
      name: 'AP Living Room',
      type: 'ap',
      model: 'UniFi U6 Pro (WiFi 6)',
      ip: '192.168.1.6',
      status: 'online',
      uptime: '32d 08h',
      cpuPct: 14,
      ramPct: 48,
      firmware: 'v6.6.65',
      connectedClients: 16
    },
    {
      id: 'u6-enterprise-office',
      name: 'AP Office & Lab',
      type: 'ap',
      model: 'UniFi U6 Enterprise (WiFi 6E 6GHz)',
      ip: '192.168.1.7',
      status: 'online',
      uptime: '32d 08h',
      cpuPct: 19,
      ramPct: 52,
      firmware: 'v6.6.65',
      connectedClients: 14
    },
    {
      id: 'u6-mesh-patio',
      name: 'AP Backyard & Patio',
      type: 'ap',
      model: 'UniFi U6 Mesh Outdoor',
      ip: '192.168.1.8',
      status: 'online',
      uptime: '32d 08h',
      cpuPct: 8,
      ramPct: 38,
      firmware: 'v6.6.65',
      connectedClients: 8
    }
  ],
  topClients: [
    { name: 'Ramiro MacBook Pro M3 Max', ip: '192.168.1.142', mac: 'b4:22:df:8a:c1:90', vlan: 'Default (VLAN 1)', downloadMb: 4850, uploadMb: 820, signalDbm: -48, deviceType: 'laptop' },
    { name: 'Apple TV 4K - Living Room', ip: '192.168.1.150', mac: '40:6c:8f:2b:11:4a', vlan: 'Media (VLAN 30)', downloadMb: 12400, uploadMb: 240, signalDbm: -42, deviceType: 'tv' },
    { name: 'Mac Studio - AI Worker', ip: '192.168.1.140', mac: 'f8:ff:c2:91:0a:77', vlan: 'Servers (VLAN 10)', downloadMb: 8900, uploadMb: 3400, signalDbm: -38, deviceType: 'desktop' },
    { name: 'Sofia iPhone 15 Pro', ip: '192.168.1.144', mac: '7a:11:99:ee:cc:02', vlan: 'Default (VLAN 1)', downloadMb: 2400, uploadMb: 520, signalDbm: -54, deviceType: 'phone' },
    { name: 'UniFi G5 Turret - Front Door', ip: '192.168.20.10', mac: '24:5a:4c:78:01:2b', vlan: 'Cameras (VLAN 20)', downloadMb: 110, uploadMb: 16800, signalDbm: 0, deviceType: 'camera' }
  ]
};

export const mockSmartHomeSummary: SmartHomeSummary = {
  lightsOn: 8,
  lightsTotal: 24,
  doorsLocked: true,
  doorsStatusText: 'All secure (3 exterior deadbolts locked)',
  windowsClosed: true,
  windowsStatusText: 'All closed (8 contact sensors OK)',
  motionActivity: false,
  motionStatusText: 'No motion detected (Past 12m)',
  avgTemperatureC: 23.4,
  avgHumidityPct: 46,
  peopleHome: ['Ramiro', 'Sofia'],
  securityMode: 'Armed Home'
};

export const mockRooms: RoomData[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: 'Sofa',
    temperatureC: 23.2,
    humidityPct: 45,
    lightsCount: 6,
    lightsActive: 3,
    motionDetected: false,
    powerDrawWatts: 145,
    devices: [
      { id: 'light.living_main_recessed', name: 'Ceiling Recessed Warm', room: 'Living Room', domain: 'light', state: true, attributes: { brightness: 75, color: '#fef3c7', powerWatts: 38 }, lastUpdated: '12m ago' },
      { id: 'light.living_ambient_strip', name: 'COB Accent LED Strip', room: 'Living Room', domain: 'light', state: true, attributes: { brightness: 50, color: '#38bdf8', powerWatts: 24 }, lastUpdated: '1h ago' },
      { id: 'light.living_reading_lamp', name: 'Artemide Tolomeo Lamp', room: 'Living Room', domain: 'light', state: true, attributes: { brightness: 100, color: '#ffedd5', powerWatts: 9 }, lastUpdated: '34m ago' },
      { id: 'climate.living_daikin_ac', name: 'Daikin Inverter AC', room: 'Living Room', domain: 'climate', state: 'cool', attributes: { currentTemperature: 23.2, targetTemperature: 23.0, humidity: 45, powerWatts: 320 }, lastUpdated: 'Just now' },
      { id: 'media_player.living_room_tv', name: 'LG OLED G3 65" TV', room: 'Living Room', domain: 'switch', state: true, attributes: { powerWatts: 110 }, lastUpdated: '3h ago' }
    ]
  },
  {
    id: 'office-lab',
    name: 'Office & Lab',
    icon: 'Laptop',
    temperatureC: 22.8,
    humidityPct: 44,
    lightsCount: 4,
    lightsActive: 2,
    motionDetected: true,
    powerDrawWatts: 385,
    devices: [
      { id: 'light.office_desk_bar', name: 'BenQ ScreenBar Halo', room: 'Office & Lab', domain: 'light', state: true, attributes: { brightness: 80, color: '#f8fafc', powerWatts: 10 }, lastUpdated: '5m ago' },
      { id: 'light.office_ambient_wall', name: 'Hue Gradient Lightstrip', room: 'Office & Lab', domain: 'light', state: true, attributes: { brightness: 60, color: '#818cf8', powerWatts: 18 }, lastUpdated: '2h ago' },
      { id: 'climate.office_mitsubishi_ac', name: 'Mitsubishi Electric Split', room: 'Office & Lab', domain: 'climate', state: 'cool', attributes: { currentTemperature: 22.8, targetTemperature: 22.5, humidity: 44, powerWatts: 280 }, lastUpdated: 'Just now' },
      { id: 'switch.office_standing_desk', name: 'Smart Standing Desk', room: 'Office & Lab', domain: 'switch', state: true, attributes: { powerWatts: 5 }, lastUpdated: '4h ago' }
    ]
  },
  {
    id: 'master-bedroom',
    name: 'Master Bedroom',
    icon: 'Bed',
    temperatureC: 22.5,
    humidityPct: 48,
    lightsCount: 5,
    lightsActive: 1,
    motionDetected: false,
    powerDrawWatts: 65,
    devices: [
      { id: 'light.bed_nightstand_ramiro', name: 'Ramiro Bedside Lamp', room: 'Master Bedroom', domain: 'light', state: true, attributes: { brightness: 25, color: '#fed7aa', powerWatts: 6 }, lastUpdated: '18m ago' },
      { id: 'light.bed_nightstand_sofia', name: 'Sofia Bedside Lamp', room: 'Master Bedroom', domain: 'light', state: false, attributes: { brightness: 0, powerWatts: 0 }, lastUpdated: '5h ago' },
      { id: 'climate.bedroom_ac', name: 'Panasonic Nanoe-X AC', room: 'Master Bedroom', domain: 'climate', state: 'idle', attributes: { currentTemperature: 22.5, targetTemperature: 22.0, humidity: 48, powerWatts: 35 }, lastUpdated: 'Just now' }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: 'Utensils',
    temperatureC: 24.1,
    humidityPct: 49,
    lightsCount: 4,
    lightsActive: 2,
    motionDetected: false,
    powerDrawWatts: 190,
    devices: [
      { id: 'light.kitchen_under_cabinet', name: 'Under Cabinet High CRI', room: 'Kitchen', domain: 'light', state: true, attributes: { brightness: 100, color: '#ffffff', powerWatts: 42 }, lastUpdated: '45m ago' },
      { id: 'light.kitchen_island_pendant', name: 'Island Trio Pendant', room: 'Kitchen', domain: 'light', state: true, attributes: { brightness: 70, color: '#fef3c7', powerWatts: 28 }, lastUpdated: '45m ago' },
      { id: 'sensor.kitchen_fridge_temp', name: 'Bosch Smart Fridge Sensor', room: 'Kitchen', domain: 'sensor', state: 3.8, attributes: { unit: '°C', battery: 94 }, lastUpdated: '1m ago' }
    ]
  },
  {
    id: 'garage-server-rack',
    name: 'Garage & Server Rack',
    icon: 'Server',
    temperatureC: 25.4,
    humidityPct: 42,
    lightsCount: 2,
    lightsActive: 0,
    motionDetected: false,
    powerDrawWatts: 620,
    devices: [
      { id: 'light.garage_high_bay_led', name: 'High-Bay 100W LED', room: 'Garage & Server Rack', domain: 'light', state: false, attributes: { brightness: 0, powerWatts: 0 }, lastUpdated: '3h ago' },
      { id: 'lock.garage_side_deadbolt', name: 'Schlage Encode Plus Lock', room: 'Garage & Server Rack', domain: 'lock', state: 'locked', attributes: { locked: true, battery: 88 }, lastUpdated: '6h ago' },
      { id: 'sensor.rack_ambient_temp', name: 'Rack Inlet Temp Sensor', room: 'Garage & Server Rack', domain: 'sensor', state: 25.4, attributes: { unit: '°C' }, lastUpdated: 'Just now' }
    ]
  },
  {
    id: 'backyard-patio',
    name: 'Backyard & Patio',
    icon: 'Trees',
    temperatureC: 21.0,
    humidityPct: 56,
    lightsCount: 3,
    lightsActive: 0,
    motionDetected: false,
    powerDrawWatts: 15,
    devices: [
      { id: 'light.patio_string_festoon', name: 'Edison Festoon Lights', room: 'Backyard & Patio', domain: 'light', state: false, attributes: { brightness: 0, powerWatts: 0 }, lastUpdated: '1d ago' },
      { id: 'switch.patio_irrigation_pump', name: 'Rachio Smart Sprinklers', room: 'Backyard & Patio', domain: 'switch', state: false, attributes: { lastTriggered: '05:30 AM' }, lastUpdated: '14h ago' }
    ]
  }
];

export const mockCameras: CameraStream[] = [
  {
    id: 'cam-front-door',
    name: 'Front Door Entrance',
    location: 'Perimeter / Entrance',
    resolution: '4K Ultra HD (3840x2160)',
    fps: 30,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '18m ago',
    detections: [{ type: 'person', confidencePct: 96, time: '18m ago' }],
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-driveway',
    name: 'Driveway & Street',
    location: 'Exterior Front',
    resolution: '4K Ultra HD AI (3840x2160)',
    fps: 30,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '32m ago',
    detections: [{ type: 'vehicle', confidencePct: 94, time: '32m ago' }],
    thumbnailUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-garage-inside',
    name: 'Garage Interior',
    location: 'Garage',
    resolution: '2K QHD (2560x1440)',
    fps: 25,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '3h ago',
    detections: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-backyard',
    name: 'Backyard & Deck',
    location: 'Exterior Rear',
    resolution: '2K QHD (2560x1440)',
    fps: 30,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '1h ago',
    detections: [{ type: 'animal', confidencePct: 88, time: '1h ago' }],
    thumbnailUrl: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-living-room',
    name: 'Living Room 360',
    location: 'Living Area',
    resolution: '1080p FHD (1920x1080)',
    fps: 20,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '5m ago',
    detections: [{ type: 'person', confidencePct: 98, time: '5m ago' }],
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-side-entrance',
    name: 'Side Garden Path',
    location: 'Exterior Side',
    resolution: '2K QHD (2560x1440)',
    fps: 25,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '4h ago',
    detections: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-patio',
    name: 'Patio & Outdoor Dining',
    location: 'Exterior Patio',
    resolution: '2K QHD (2560x1440)',
    fps: 25,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '2h ago',
    detections: [],
    thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cam-office',
    name: 'Office Lab Overview',
    location: 'Office',
    resolution: '1080p FHD (1920x1080)',
    fps: 20,
    status: 'online',
    recording: true,
    liveFeedUrl: '',
    lastMotionTime: '2m ago',
    detections: [{ type: 'person', confidencePct: 99, time: '2m ago' }],
    thumbnailUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=600&q=80'
  }
];

export const mockFrigate: FrigateStats = {
  status: 'healthy',
  tpuInferenceSpeedMs: 7.2,
  tpuTemperatureC: 44,
  camerasConnected: 8,
  detectionsToday: {
    person: 48,
    vehicle: 19,
    animal: 12,
    package: 6
  },
  storageUsedGb: 1420,
  storageTotalGb: 3000,
  hwAcceleration: 'Intel QuickSync VA-API (iGPU QSV) + Coral USB TPU',
  cpuPct: 38.4,
  ramPct: 68.2,
  recentEvents: [
    { id: 'evt-901', camera: 'Driveway & Street', label: 'Tesla Model Y (Vehicle)', score: 0.94, time: '19:12', durationSec: 42, hasSnapshot: true },
    { id: 'evt-902', camera: 'Front Door Entrance', label: 'Delivery Carrier (Person)', score: 0.96, time: '18:44', durationSec: 28, hasSnapshot: true },
    { id: 'evt-903', camera: 'Front Door Entrance', label: 'Package on Porch (Package)', score: 0.91, time: '18:45', durationSec: 180, hasSnapshot: true },
    { id: 'evt-904', camera: 'Backyard & Deck', label: 'Golden Retriever (Animal)', score: 0.88, time: '17:30', durationSec: 65, hasSnapshot: true }
  ]
};

export const mockStoragePool: StoragePool = {
  id: 'pool-tank-01',
  name: 'tank-zfs-raidz2',
  type: 'ZFS RAID-Z2 (6x 4TB Drives)',
  totalBytes: 12 * 1024 * 1024 * 1024 * 1024,
  usedBytes: 6.4 * 1024 * 1024 * 1024 * 1024,
  freeBytes: 5.6 * 1024 * 1024 * 1024 * 1024,
  usedPct: 53.3,
  health: 'ONLINE',
  readSpeedMbps: 480,
  writeSpeedMbps: 320,
  scrubStatus: 'Completed 2 days ago — 0 errors found in 6.4 TB'
};

export const mockDisks: DiskDrive[] = [
  { id: 'sda', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-01', slot: 'Bay 1', capacityGb: 4000, temperatureC: 36, smartStatus: 'PASSED', healthPct: 100, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'sdb', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-02', slot: 'Bay 2', capacityGb: 4000, temperatureC: 37, smartStatus: 'PASSED', healthPct: 100, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'sdc', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-03', slot: 'Bay 3', capacityGb: 4000, temperatureC: 38, smartStatus: 'PASSED', healthPct: 99, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'sdd', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-04', slot: 'Bay 4', capacityGb: 4000, temperatureC: 36, smartStatus: 'PASSED', healthPct: 100, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'sde', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-05', slot: 'Bay 5', capacityGb: 4000, temperatureC: 35, smartStatus: 'PASSED', healthPct: 100, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'sdf', model: 'Seagate IronWolf Pro 4TB', serial: 'WDC-WD40EFZX-06', slot: 'Bay 6', capacityGb: 4000, temperatureC: 37, smartStatus: 'PASSED', healthPct: 100, powerOnHours: 14200, readErrors: 0, writeErrors: 0 },
  { id: 'nvme0n1', model: 'Samsung 990 PRO 2TB NVMe', serial: 'S6Z2NJ0W102', slot: 'M.2 PCIe Cache', capacityGb: 2000, temperatureC: 43, smartStatus: 'PASSED', healthPct: 98, powerOnHours: 6400, readErrors: 0, writeErrors: 0 }
];

export const mockImmich: ImmichStats = {
  status: 'Running',
  photosCount: 48240,
  videosCount: 3812,
  usersCount: 2,
  storageUsedBytes: 2.84 * 1024 * 1024 * 1024 * 1024,
  databaseStatus: 'Healthy',
  mlStatus: 'Running',
  faceRecognitionModel: 'antelopev2-buffalo_l',
  clipSearchModel: 'ViT-B-32-visual-search',
  lastBackup: '2 hours ago (Auto-synced to Offsite TrueNAS)'
};

export const mockBackups: BackupJob[] = [
  { id: 'bk-pve', name: 'Proxmox Backup Server (PBS)', target: 'pbs.homelab.local / ZFS Pool', lastBackup: 'Today, 03:00 AM', status: 'Success', duration: '14m 20s', sizeMb: 42300, nextScheduled: 'Tomorrow, 03:00 AM' },
  { id: 'bk-ha', name: 'Home Assistant Full Snapshot', target: 'NAS /backups/homeassistant', lastBackup: 'Today, 04:00 AM', status: 'Success', duration: '3m 15s', sizeMb: 1240, nextScheduled: 'Tomorrow, 04:00 AM' },
  { id: 'bk-immich', name: 'Immich Database & RAW Storage', target: 'Encrypted S3 Backblaze B2', lastBackup: 'Today, 18:21 PM', status: 'Success', duration: '22m 10s', sizeMb: 2900000, nextScheduled: 'Today, 00:00 AM' },
  { id: 'bk-nas', name: 'NAS ZFS Snapshot Replication', target: 'Secondary Cold Storage Bay', lastBackup: 'Yesterday, 23:00 PM', status: 'Success', duration: '45m 00s', sizeMb: 6400000, nextScheduled: 'Today, 23:00 PM' },
  { id: 'bk-unifi', name: 'UniFi Cloud Auto-Backup', target: 'UniFi Cloud Portal', lastBackup: '2 days ago', status: 'Success', duration: '45s', sizeMb: 48, nextScheduled: 'In 5 days' }
];

export const mockServices: HomelabService[] = [
  { id: 'srv-ha', name: 'Home Assistant', category: 'Home', host: 'pve-node-01 (VM 100)', status: 'Running', cpuPct: 12.4, ramMb: 4210, uptime: '23d 14h', version: '2025.2.1', port: 8123, url: 'http://192.168.1.20:8123', icon: 'Home', description: 'Core Smart Home Orchestration Engine' },
  { id: 'srv-hermes', name: 'Hermes AI Gateway', category: 'AI', host: 'pve-node-02 (VM 103)', status: 'Running', cpuPct: 15.6, ramMb: 3950, uptime: '18d 06h', version: 'v2.4.0', port: 9000, url: 'http://192.168.1.23:9000', icon: 'Bot', description: 'Local AI Infrastructure Copilot' },
  { id: 'srv-immich', name: 'Immich Photo Suite', category: 'Media', host: 'docker-services-01 (VM 101)', status: 'Running', cpuPct: 18.2, ramMb: 3400, uptime: '23d 14h', version: 'v1.125.1', port: 2283, url: 'http://192.168.1.21:2283', icon: 'Image', description: 'High-performance self-hosted photo/video backup' },
  { id: 'srv-frigate', name: 'Frigate NVR', category: 'Core', host: 'frigate-nvr-node (VM 102)', status: 'Running', cpuPct: 42.1, ramMb: 8400, uptime: '18d 06h', version: '0.14.1', port: 5000, url: 'http://192.168.1.22:5000', icon: 'Video', description: 'Real-time object detection with Google Coral TPU' },
  { id: 'srv-unifi', name: 'UniFi Network Application', category: 'Network', host: 'udm-pro', status: 'Running', cpuPct: 18.0, ramMb: 2400, uptime: '45d 11h', version: 'v8.6.9', port: 8443, url: 'https://192.168.1.1:8443', icon: 'Wifi', description: 'Software Defined Networking & WiFi AP Manager' },
  { id: 'srv-ollama', name: 'Ollama LLM Engine', category: 'AI', host: 'pve-node-01 (VM 105)', status: 'Running', cpuPct: 8.5, ramMb: 7600, uptime: '12d 04h', version: '0.5.7', port: 11434, url: 'http://192.168.1.25:11434', icon: 'Cpu', description: 'Local inference runner for Llama 3 & DeepSeek' },
  { id: 'srv-tailscale', name: 'Tailscale Mesh VPN', category: 'Network', host: 'pve-node-03 (VM 109)', status: 'Running', cpuPct: 1.8, ramMb: 190, uptime: '45d 11h', version: '1.78.1', port: 41641, url: 'https://login.tailscale.com', icon: 'Globe', description: 'Zero-config WireGuard mesh network router' },
  { id: 'srv-postgres', name: 'PostgreSQL 16 Cluster', category: 'Database', host: 'pve-node-03 (VM 107)', status: 'Running', cpuPct: 14.3, ramMb: 2480, uptime: '45d 11h', version: '16.4', port: 5432, url: 'http://192.168.1.27:5432', icon: 'Database', description: 'Central relational database store' },
  { id: 'srv-redis', name: 'Redis Cache', category: 'Database', host: 'pve-node-01 (CT 200)', status: 'Running', cpuPct: 1.2, ramMb: 210, uptime: '23d 14h', version: '7.2.4', port: 6379, url: 'http://192.168.1.50:6379', icon: 'Zap', description: 'In-memory key-value cache and message broker' },
  { id: 'srv-mqtt', name: 'Mosquitto MQTT', category: 'Home', host: 'pve-node-01 (CT 201)', status: 'Running', cpuPct: 0.8, ramMb: 95, uptime: '23d 14h', version: '2.0.18', port: 1883, url: 'http://192.168.1.51:1883', icon: 'Radio', description: 'Telemetry broker for IoT sensors' },
  { id: 'srv-nginx', name: 'Nginx Proxy Manager', category: 'Network', host: 'pve-node-02 (CT 202)', status: 'Running', cpuPct: 4.5, ramMb: 610, uptime: '18d 06h', version: '2.11.2', port: 81, url: 'http://192.168.1.52:81', icon: 'Shield', description: 'Ingress routing & SSL reverse proxy' },
  { id: 'srv-plex', name: 'Plex Media Server', category: 'Media', host: 'pve-node-02 (VM 106)', status: 'Running', cpuPct: 22.0, ramMb: 4500, uptime: '18d 06h', version: '1.41.0', port: 32400, url: 'http://192.168.1.26:32400', icon: 'Film', description: 'Media library streaming to Apple TV and mobile' }
];

export const mockDockerContainers: DockerContainer[] = [
  { id: 'c-immich-server', name: 'immich_server', image: 'ghcr.io/immich-app/immich-server:release', host: 'docker-services-01', status: 'running', cpuPct: 11.2, ramMb: 1240, ramLimitMb: 4096, uptime: '23d 14h', ports: '2283:2283', created: '23 days ago' },
  { id: 'c-immich-ml', name: 'immich_machine_learning', image: 'ghcr.io/immich-app/immich-machine-learning:release', host: 'docker-services-01', status: 'running', cpuPct: 7.0, ramMb: 2160, ramLimitMb: 8192, uptime: '23d 14h', ports: '3003:3003', created: '23 days ago' },
  { id: 'c-frigate-app', name: 'frigate', image: 'ghcr.io/blakeblackshear/frigate:0.14.1', host: 'frigate-nvr-node', status: 'running', cpuPct: 42.1, ramMb: 8400, ramLimitMb: 12288, uptime: '18d 06h', ports: '5000:5000, 8554:8554, 8555:8555', created: '18 days ago' },
  { id: 'c-portainer', name: 'portainer', image: 'portainer/portainer-ce:2.21.3', host: 'docker-services-01', status: 'running', cpuPct: 0.5, ramMb: 120, ramLimitMb: 1024, uptime: '23d 14h', ports: '9000:9000, 9443:9443', created: '23 days ago' },
  { id: 'c-watchtower', name: 'watchtower', image: 'containrrr/watchtower:latest', host: 'docker-services-01', status: 'running', cpuPct: 0.1, ramMb: 45, ramLimitMb: 256, uptime: '23d 14h', ports: '-', created: '23 days ago' },
  { id: 'c-grafana', name: 'grafana', image: 'grafana/grafana:11.2.0', host: 'docker-services-01', status: 'running', cpuPct: 2.3, ramMb: 340, ramLimitMb: 2048, uptime: '23d 14h', ports: '3000:3000', created: '23 days ago' },
  { id: 'c-prometheus', name: 'prometheus', image: 'prom/prometheus:v2.54.1', host: 'docker-services-01', status: 'running', cpuPct: 3.8, ramMb: 780, ramLimitMb: 2048, uptime: '23d 14h', ports: '9090:9090', created: '23 days ago' },
  { id: 'c-node-exporter-1', name: 'node_exporter', image: 'prom/node-exporter:latest', host: 'docker-services-01', status: 'running', cpuPct: 0.4, ramMb: 35, ramLimitMb: 128, uptime: '23d 14h', ports: '9100:9100', created: '23 days ago' }
];

export const mockEnergy: EnergyData = {
  currentDrawWatts: 684,
  todayKwh: 14.8,
  monthKwh: 382.4,
  estimatedCostMonthUsd: 57.36,
  gridVoltageVolts: 121.4,
  frequencyHz: 60.0,
  circuits: [
    { name: 'Server Rack & Homelab (APC UPS 1500VA)', drawWatts: 385, pctOfTotal: 56.3, color: '#06b6d4' },
    { name: 'Climate HVAC (Living + Office)', drawWatts: 180, pctOfTotal: 26.3, color: '#3b82f6' },
    { name: 'Smart Lighting (24 Lumiled Circuits)', drawWatts: 64, pctOfTotal: 9.4, color: '#f59e0b' },
    { name: 'Appliances & Misc Plugs', drawWatts: 55, pctOfTotal: 8.0, color: '#10b981' }
  ],
  history24h: [
    { time: '00:00', watts: 460, cost: 0.07 },
    { time: '04:00', watts: 440, cost: 0.06 },
    { time: '08:00', watts: 720, cost: 0.11 },
    { time: '12:00', watts: 890, cost: 0.14 },
    { time: '16:00', watts: 940, cost: 0.15 },
    { time: '18:00', watts: 820, cost: 0.13 },
    { time: '20:00', watts: 710, cost: 0.11 },
    { time: '22:00', watts: 684, cost: 0.10 }
  ]
};

export const mockAlerts: SystemAlert[] = [
  {
    id: 'alt-01',
    severity: 'Warning',
    source: 'pve-node-02',
    category: 'Proxmox',
    message: 'Node 02 memory consumption reached 66.8% (21.4 / 32 GB)',
    timestamp: '15m ago',
    status: 'active',
    details: 'Frigate NVR and Plex transcode buffers allocated high working cache. Normal operations sustained.'
  },
  {
    id: 'alt-02',
    severity: 'Information',
    source: 'Starlink Dishy',
    category: 'Network',
    message: 'Satellite constellation handoff completed with 0.1% packet loss',
    timestamp: '1h ago',
    status: 'acknowledged',
    details: 'Dish Azimuth remained steady at 28.4°. Latency settled back to 32 ms.'
  },
  {
    id: 'alt-03',
    severity: 'Information',
    source: 'Immich',
    category: 'Services',
    message: 'Automated nightly RAW photos backup completed (2.84 TB sync verified)',
    timestamp: '2h ago',
    status: 'resolved',
    details: 'Backblaze B2 encrypted bucket hash verified with 0 parity errors.'
  }
];

export const mockActivity: ActivityEvent[] = [
  { id: 'act-1', time: '19:32', relativeTime: 'Just now', source: 'Frigate AI', category: 'Security', description: 'Driveway camera detected vehicle (Tesla Model Y)', iconType: 'Car', severity: 'info' },
  { id: 'act-2', time: '19:28', relativeTime: '4m ago', source: 'Home Assistant', category: 'Smart Home', description: 'Living Room recessed lights set to warm evening scene (75%)', iconType: 'Lightbulb', severity: 'info' },
  { id: 'act-3', time: '18:54', relativeTime: '38m ago', source: 'Proxmox PBS', category: 'Proxmox', description: 'Node 03 root storage snapshot backup completed (42.3 GB)', iconType: 'Server', severity: 'success' },
  { id: 'act-4', time: '18:21', relativeTime: '1h 11m ago', source: 'Immich', category: 'Storage', description: 'Immich backup and metadata indexing completed', iconType: 'Image', severity: 'success' },
  { id: 'act-5', time: '17:42', relativeTime: '1h 50m ago', source: 'Starlink', category: 'Network', description: 'Starlink experienced 4s micro-handoff transition (Automatic Recovery)', iconType: 'Wifi', severity: 'info' },
  { id: 'act-6', time: '16:15', relativeTime: '3h ago', source: 'UniFi Gateway', category: 'Network', description: 'Client connected to 6GHz band (Ramiro MacBook Pro)', iconType: 'Laptop', severity: 'info' }
];

export const mockLogs: SystemLog[] = [
  { id: 'log-01', timestamp: '19:32:45', source: 'Frigate', level: 'INFO', message: 'frigate.events: Motion detection triggered on cam-driveway [bounding box 0.42, 0.58]', host: 'frigate-nvr-node' },
  { id: 'log-02', timestamp: '19:30:12', source: 'Home Assistant', level: 'INFO', message: 'homeassistant.core: Event state_changed for light.living_main_recessed [state: on, brightness: 191]', host: 'haos-production' },
  { id: 'log-03', timestamp: '19:28:00', source: 'Hermes', level: 'INFO', message: 'hermes.telemetry: Periodic health audit verified. 32/32 services online, score 98/100', host: 'hermes-ai-gateway' },
  { id: 'log-04', timestamp: '19:24:19', source: 'Proxmox', level: 'INFO', message: 'pvedaemon: <root@pam> successful auth for user ramiro from 192.168.1.142', host: 'pve-node-01' },
  { id: 'log-05', timestamp: '19:15:02', source: 'UniFi', level: 'INFO', message: 'hostapd: wl0: STA b4:22:df:8a:c1:90 IEEE 802.11: associated (6GHz WiFi 6E WPA3)', host: 'u6-enterprise-office' },
  { id: 'log-06', timestamp: '19:05:44', source: 'Docker', level: 'INFO', message: 'container immich_machine_learning: Batch inference for 24 face embeddings finished in 182ms', host: 'docker-services-01' },
  { id: 'log-07', timestamp: '18:54:33', source: 'Proxmox', level: 'INFO', message: 'qemu-server: backup vm 104 finished successfully, duration 14m 20s', host: 'pve-node-03' },
  { id: 'log-08', timestamp: '18:30:00', source: 'System', level: 'INFO', message: 'chronyd[614]: System clock synchronized with 162.159.200.123 (Cloudflare NTP stratum 2)', host: 'pve-node-01' }
];

export const mockIntegrations: IntegrationSetting[] = [
  { id: 'int-proxmox', name: 'Proxmox Virtual Environment', service: 'Proxmox VE REST API', status: 'Connected', endpoint: 'https://192.168.1.10:8006/api2/json', lastSync: '3s ago', latencyMs: 4, version: 'PVE 8.2.4', maskedToken: '••••••••••••8a2f', type: 'Infrastructure' },
  { id: 'int-ha', name: 'Home Assistant', service: 'Home Assistant WebSocket & REST', status: 'Connected', endpoint: 'ws://192.168.1.20:8123/api/websocket', lastSync: '1s ago', latencyMs: 2, version: 'Core 2025.2.1', maskedToken: '••••••••••••3c11', type: 'Smart Home' },
  { id: 'int-unifi', name: 'UniFi Network Controller', service: 'UniFi Controller API', status: 'Connected', endpoint: 'https://192.168.1.1/proxy/network/api', lastSync: '4s ago', latencyMs: 3, version: 'Network 8.6.9', maskedToken: '••••••••••••9e88', type: 'Network' },
  { id: 'int-starlink', name: 'Starlink Dishy gRPC API', service: 'Starlink gRPC Telemetry / 192.168.100.1', status: 'Connected', endpoint: 'http://192.168.100.1:9200', lastSync: '2s ago', latencyMs: 5, version: 'Dishy V3 Actuated', maskedToken: '••••••••••••01bf', type: 'Network' },
  { id: 'int-frigate', name: 'Frigate NVR', service: 'Frigate HTTP & Coral Socket', status: 'Connected', endpoint: 'http://192.168.1.22:5000/api', lastSync: '1s ago', latencyMs: 2, version: 'v0.14.1-coral', maskedToken: '••••••••••••77ad', type: 'Cameras' },
  { id: 'int-immich', name: 'Immich Media Server', service: 'Immich REST API', status: 'Connected', endpoint: 'http://192.168.1.21:2283/api', lastSync: '5s ago', latencyMs: 6, version: 'v1.125.1', maskedToken: '••••••••••••4a8e', type: 'Storage' },
  { id: 'int-nas', name: 'TrueNAS / Storage Array', service: 'TrueNAS WebSocket API', status: 'Connected', endpoint: 'ws://192.168.1.24/websocket', lastSync: '3s ago', latencyMs: 4, version: 'SCALE 24.04', maskedToken: '••••••••••••55bc', type: 'Storage' },
  { id: 'int-hermes', name: 'Hermes AI Engine', service: 'Hermes Local AI Gateway & GenAI', status: 'Connected', endpoint: 'http://192.168.1.23:9000/v1', lastSync: '1s ago', latencyMs: 1, version: 'Hermes 2.4.0 (Read-Only Mode)', maskedToken: '••••••••••••99ff', type: 'AI' }
];

export const initialHermesMessages: HermesMessage[] = [
  {
    id: 'm1',
    sender: 'hermes',
    timestamp: '19:30',
    text: 'Good evening, Ramiro. I am Hermes, your Infrastructure & Smart Home Copilot. All 3 Proxmox nodes, Starlink uplink, 8 cameras, and 32 services are operational. How can I assist you with the homelab today?',
    contextCard: {
      title: 'Infrastructure Health Snapshot',
      type: 'metric',
      data: {
        'Health Score': '98%',
        'Cluster Nodes': '3/3 Online',
        'Internet Latency': '32 ms',
        'Cameras Active': '8/8 Online',
        'Storage Used': '6.4 / 12 TB (53%)'
      }
    }
  }
];
