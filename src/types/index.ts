export type SystemHealthStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export type UserRole = 'Administrator' | 'Viewer' | 'Hermes';

export interface GlobalOverview {
  user: {
    name: string;
    greeting: string;
    role: UserRole;
    avatarUrl?: string;
  };
  healthScore: number; // 0-100
  statusText: string;
  homeStatus: 'Healthy' | 'Warning' | 'Critical';
  lastUpdated: string;
}

// Proxmox
export interface ProxmoxCluster {
  name: string;
  health: 'healthy' | 'degraded' | 'critical';
  nodesOnline: number;
  nodesTotal: number;
  quorate: boolean;
  totalCpuCores: number;
  cpuUsagePct: number;
  totalRamBytes: number;
  usedRamBytes: number;
  totalStorageBytes: number;
  usedStorageBytes: number;
  vmsCount: number;
  containersCount: number;
}

export interface ProxmoxNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  cpuModel: string;
  cpuCores: number;
  cpuUsagePct: number;
  ramTotalGb: number;
  ramUsedGb: number;
  storageTotalTb: number;
  storageUsedTb: number;
  temperatureC: number;
  uptimeDays: number;
  uptimeString: string;
  loadAverage: [number, number, number];
  networkRxMbps: number;
  networkTxMbps: number;
  vmsRunning: number;
  vmsTotal: number;
  containersRunning: number;
  containersTotal: number;
  ip: string;
}

export interface VirtualMachine {
  vmid: number;
  name: string;
  node: string;
  status: 'running' | 'stopped' | 'paused' | 'warning';
  os: string;
  cpuCores: number;
  cpuUsagePct: number;
  ramTotalMb: number;
  ramUsedMb: number;
  diskTotalGb: number;
  ipAddress: string;
  uptime: string;
  description: string;
}

export interface LXCContainer {
  vmid: number;
  name: string;
  node: string;
  status: 'running' | 'stopped' | 'warning';
  template: string;
  cpuUsagePct: number;
  ramTotalMb: number;
  ramUsedMb: number;
  ipAddress: string;
  uptime: string;
  description: string;
}

// Network & Starlink & UniFi
export interface StarlinkTelemetry {
  status: 'Online' | 'Degraded' | 'Offline' | 'Searching';
  deviceModel: string;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  packetLossPct: number;
  uptimePct: number;
  publicIp: string;
  gateway: string;
  dnsStatus: string;
  dishStatus: 'Connected' | 'Stowed' | 'Obstructed' | 'Heating';
  dishTemperatureC: number;
  signalQualityPct: number;
  azimuthDeg: number;
  elevationDeg: number;
  tiltDeg: number;
  obstructionFraction: number; // 0.0 to 1.0
  lastOutage: string;
  recentOutages: {
    timestamp: string;
    durationSec: number;
    cause: string;
  }[];
  latencyHistory: { time: string; latency: number; download: number; upload: number }[];
}

export interface UniFiNetwork {
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  gatewayStatus: 'Online' | 'Offline';
  gatewayModel: string;
  wanStatus: 'Connected';
  lanStatus: 'Active';
  wifiExperiencePct: number;
  connectedClients: number;
  activeSwitches: number;
  activeAPs: number;
  throughputRxMbps: number;
  throughputTxMbps: number;
  internetUtilizationPct: number;
  devices: {
    id: string;
    name: string;
    type: 'gateway' | 'switch' | 'ap';
    model: string;
    ip: string;
    status: 'online' | 'offline' | 'updating';
    uptime: string;
    cpuPct: number;
    ramPct: number;
    firmware: string;
    portPoEUsageW?: number;
    connectedClients?: number;
  }[];
  topClients: {
    name: string;
    ip: string;
    mac: string;
    vlan: string;
    downloadMb: number;
    uploadMb: number;
    signalDbm: number;
    deviceType: string;
  }[];
}

// Smart Home / Home Assistant
export type EntityDomain = 'light' | 'switch' | 'sensor' | 'binary_sensor' | 'climate' | 'camera' | 'lock' | 'person' | 'automation';

export interface SmartHomeSummary {
  lightsOn: number;
  lightsTotal: number;
  doorsLocked: boolean;
  doorsStatusText: string;
  windowsClosed: boolean;
  windowsStatusText: string;
  motionActivity: boolean;
  motionStatusText: string;
  avgTemperatureC: number;
  avgHumidityPct: number;
  peopleHome: string[];
  securityMode: 'Disarmed' | 'Armed Home' | 'Armed Away';
}

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  domain: EntityDomain;
  state: string | boolean | number;
  attributes: {
    brightness?: number; // 0-100
    targetTemperature?: number;
    currentTemperature?: number;
    humidity?: number;
    unit?: string;
    battery?: number;
    powerWatts?: number;
    lastTriggered?: string;
    locked?: boolean;
    color?: string;
  };
  lastUpdated: string;
}

export interface RoomData {
  id: string;
  name: string;
  icon: string;
  temperatureC: number;
  humidityPct: number;
  lightsCount: number;
  lightsActive: number;
  motionDetected: boolean;
  powerDrawWatts: number;
  devices: SmartDevice[];
}

// Cameras & Frigate
export interface CameraStream {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: number;
  status: 'online' | 'offline' | 'motion';
  recording: boolean;
  liveFeedUrl: string;
  lastMotionTime: string;
  detections: {
    type: 'person' | 'vehicle' | 'animal' | 'package';
    confidencePct: number;
    time: string;
  }[];
  thumbnailUrl: string;
}

export interface FrigateStats {
  status: 'healthy' | 'degraded';
  tpuInferenceSpeedMs: number;
  tpuTemperatureC: number;
  camerasConnected: number;
  detectionsToday: {
    person: number;
    vehicle: number;
    animal: number;
    package: number;
  };
  storageUsedGb: number;
  storageTotalGb: number;
  hwAcceleration: string;
  cpuPct: number;
  ramPct: number;
  recentEvents: {
    id: string;
    camera: string;
    label: string;
    score: number;
    time: string;
    durationSec: number;
    hasSnapshot: boolean;
  }[];
}

// Storage & NAS
export interface StoragePool {
  id: string;
  name: string;
  type: string; // e.g. 'ZFS RAID-Z2'
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPct: number;
  health: 'ONLINE' | 'DEGRADED' | 'FAULTED';
  readSpeedMbps: number;
  writeSpeedMbps: number;
  scrubStatus: string;
}

export interface DiskDrive {
  id: string;
  model: string;
  serial: string;
  slot: string;
  capacityGb: number;
  temperatureC: number;
  smartStatus: 'PASSED' | 'WARNING' | 'FAILED';
  healthPct: number;
  powerOnHours: number;
  readErrors: number;
  writeErrors: number;
}

export interface ImmichStats {
  status: 'Running' | 'Degraded' | 'Offline';
  photosCount: number;
  videosCount: number;
  usersCount: number;
  storageUsedBytes: number;
  databaseStatus: 'Healthy' | 'Warning';
  mlStatus: 'Running' | 'Idle' | 'Offline';
  faceRecognitionModel: string;
  clipSearchModel: string;
  lastBackup: string;
}

export interface BackupJob {
  id: string;
  name: string;
  target: string;
  lastBackup: string;
  status: 'Success' | 'Running' | 'Failed' | 'Warning';
  duration: string;
  sizeMb: number;
  nextScheduled: string;
}

// Services & Docker
export interface HomelabService {
  id: string;
  name: string;
  category: 'Core' | 'AI' | 'Media' | 'Network' | 'Database' | 'Home';
  host: string;
  status: 'Running' | 'Stopped' | 'Degraded' | 'Unknown';
  cpuPct: number;
  ramMb: number;
  uptime: string;
  version: string;
  port: number;
  url: string;
  icon: string;
  description: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  host: string;
  status: 'running' | 'exited' | 'restarting';
  cpuPct: number;
  ramMb: number;
  ramLimitMb: number;
  uptime: string;
  ports: string;
  created: string;
}

// Energy
export interface EnergyData {
  currentDrawWatts: number;
  todayKwh: number;
  monthKwh: number;
  estimatedCostMonthUsd: number;
  gridVoltageVolts: number;
  frequencyHz: number;
  circuits: {
    name: string;
    drawWatts: number;
    pctOfTotal: number;
    color: string;
  }[];
  history24h: { time: string; watts: number; cost: number }[];
}

// Alerts & Logs
export interface SystemAlert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Information';
  source: string;
  category: 'Proxmox' | 'Network' | 'Smart Home' | 'Storage' | 'Security' | 'Services';
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  details?: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  relativeTime: string;
  source: string;
  category: string;
  description: string;
  iconType: string;
  severity?: 'info' | 'warning' | 'success';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  source: 'Proxmox' | 'Home Assistant' | 'UniFi' | 'Hermes' | 'Security' | 'System' | 'Docker' | 'Frigate';
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'DEBUG';
  message: string;
  host: string;
}

// Hermes AI Assistant
export interface HermesMessage {
  id: string;
  sender: 'user' | 'hermes';
  timestamp: string;
  text: string;
  contextCard?: {
    title: string;
    type: 'metric' | 'alert' | 'service' | 'node';
    data: Record<string, string | number>;
  };
  proposedAction?: {
    id: string;
    action: string;
    resource: string;
    impact: string;
    status: 'pending' | 'executed' | 'cancelled';
  };
}

export interface IntegrationSetting {
  id: string;
  name: string;
  service: string;
  status: 'Connected' | 'Not configured' | 'Error';
  endpoint: string;
  lastSync: string;
  latencyMs: number;
  version: string;
  maskedToken: string;
  type: string;
}
