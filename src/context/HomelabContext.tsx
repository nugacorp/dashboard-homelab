import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  initialOverview,
  mockProxmoxCluster,
  mockProxmoxNodes,
  mockVirtualMachines,
  mockLXCContainers,
  mockStarlink,
  mockUniFi,
  mockSmartHomeSummary,
  mockRooms,
  mockCameras,
  mockFrigate,
  mockStoragePool,
  mockDisks,
  mockImmich,
  mockBackups,
  mockServices,
  mockDockerContainers,
  mockEnergy,
  mockAlerts,
  mockActivity,
  mockLogs,
  mockIntegrations,
  initialHermesMessages
} from '../mocks';

export type NavigationPage =
  | 'overview'
  | 'infrastructure'
  | 'proxmox'
  | 'vms'
  | 'containers'
  | 'network'
  | 'unifi'
  | 'starlink'
  | 'smart-home'
  | 'cameras'
  | 'storage'
  | 'services'
  | 'energy'
  | 'hermes'
  | 'alerts'
  | 'logs'
  | 'settings';

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  action: string;
  resource: string;
  impact: string;
  onConfirm: () => void;
}

interface HomelabContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  overview: GlobalOverview;
  cluster: ProxmoxCluster;
  nodes: ProxmoxNode[];
  vms: VirtualMachine[];
  containers: LXCContainer[];
  starlink: StarlinkTelemetry;
  unifi: UniFiNetwork;
  smartHome: SmartHomeSummary;
  rooms: RoomData[];
  cameras: CameraStream[];
  frigate: FrigateStats;
  storagePool: StoragePool;
  disks: DiskDrive[];
  immich: ImmichStats;
  backups: BackupJob[];
  services: HomelabService[];
  dockerContainers: DockerContainer[];
  energy: EnergyData;
  alerts: SystemAlert[];
  activity: ActivityEvent[];
  logs: SystemLog[];
  integrations: IntegrationSetting[];
  hermesMessages: HermesMessage[];
  isHermesDrawerOpen: boolean;
  setIsHermesDrawerOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  selectedCamera: CameraStream | null;
  setSelectedCamera: (cam: CameraStream | null) => void;
  confirmationModal: ConfirmationModalState;
  requestConfirmation: (params: { title: string; action: string; resource: string; impact: string; onConfirm: () => void }) => void;
  closeConfirmation: () => void;
  toggleLight: (roomId: string, deviceId: string) => void;
  setClimateTemp: (roomId: string, deviceId: string, temp: number) => void;
  toggleLock: (roomId: string, deviceId: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  sendHermesMessage: (text: string) => Promise<void>;
  executeHermesAction: (messageId: string, actionId: string) => void;
  restartVM: (vmid: number) => void;
  stopVM: (vmid: number) => void;
  restartService: (serviceId: string) => void;
  liveThroughput: { rx: number; tx: number };
}

const HomelabContext = createContext<HomelabContextType | undefined>(undefined);

export const HomelabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [demoMode, setDemoMode] = useState<boolean>(true);

  const [overview, setOverview] = useState<GlobalOverview>(initialOverview);
  const [cluster, setCluster] = useState<ProxmoxCluster>(mockProxmoxCluster);
  const [nodes, setNodes] = useState<ProxmoxNode[]>(mockProxmoxNodes);
  const [vms, setVMs] = useState<VirtualMachine[]>(mockVirtualMachines);
  const [containers, setContainers] = useState<LXCContainer[]>(mockLXCContainers);
  const [starlink, setStarlink] = useState<StarlinkTelemetry>(mockStarlink);
  const [unifi, setUniFi] = useState<UniFiNetwork>(mockUniFi);
  const [smartHome, setSmartHome] = useState<SmartHomeSummary>(mockSmartHomeSummary);
  const [rooms, setRooms] = useState<RoomData[]>(mockRooms);
  const [cameras, setCameras] = useState<CameraStream[]>(mockCameras);
  const [frigate, setFrigate] = useState<FrigateStats>(mockFrigate);
  const [storagePool, setStoragePool] = useState<StoragePool>(mockStoragePool);
  const [disks, setDisks] = useState<DiskDrive[]>(mockDisks);
  const [immich, setImmich] = useState<ImmichStats>(mockImmich);
  const [backups, setBackups] = useState<BackupJob[]>(mockBackups);
  const [services, setServices] = useState<HomelabService[]>(mockServices);
  const [dockerContainers, setDockerContainers] = useState<DockerContainer[]>(mockDockerContainers);
  const [energy, setEnergy] = useState<EnergyData>(mockEnergy);
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockAlerts);
  const [activity, setActivity] = useState<ActivityEvent[]>(mockActivity);
  const [logs, setLogs] = useState<SystemLog[]>(mockLogs);
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>(mockIntegrations);
  const [hermesMessages, setHermesMessages] = useState<HermesMessage[]>(initialHermesMessages);

  const [isHermesDrawerOpen, setIsHermesDrawerOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraStream | null>(null);

  const [liveThroughput, setLiveThroughput] = useState<{ rx: number; tx: number }>({ rx: 342.1, tx: 48.6 });

  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    action: '',
    resource: '',
    impact: '',
    onConfirm: () => {}
  });

  const requestConfirmation = useCallback((params: { title: string; action: string; resource: string; impact: string; onConfirm: () => void }) => {
    setConfirmationModal({
      isOpen: true,
      ...params
    });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsHermesDrawerOpen(false);
        setSelectedCamera(null);
        closeConfirmation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeConfirmation]);

  // Realistic live data periodic fluctuations in DEMO MODE
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      // 1. Slightly vary CPU & network throughput
      const rxVariation = +(320 + Math.random() * 40).toFixed(1);
      const txVariation = +(40 + Math.random() * 15).toFixed(1);
      setLiveThroughput({ rx: rxVariation, tx: txVariation });

      // 2. Vary Starlink download / upload & latency
      setStarlink(prev => {
        const newDl = +(240 + (Math.random() * 20 - 10)).toFixed(1);
        const newUl = +(28 + (Math.random() * 4 - 2)).toFixed(1);
        const newLat = Math.max(26, Math.min(42, Math.round(prev.latencyMs + (Math.random() * 4 - 2))));
        return {
          ...prev,
          downloadMbps: newDl,
          uploadMbps: newUl,
          latencyMs: newLat
        };
      });

      // 3. Vary node loads slightly
      setNodes(prev =>
        prev.map(node => {
          const delta = (Math.random() * 4 - 2);
          const newCpu = Math.max(8, Math.min(92, Math.round(node.cpuUsagePct + delta)));
          const tempDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          return {
            ...node,
            cpuUsagePct: newCpu,
            temperatureC: Math.max(38, Math.min(75, node.temperatureC + tempDelta)),
            networkRxMbps: +(node.networkRxMbps + (Math.random() * 6 - 3)).toFixed(1)
          };
        })
      );

      // 4. Vary power watts
      setEnergy(prev => ({
        ...prev,
        currentDrawWatts: Math.round(680 + (Math.random() * 30 - 15))
      }));

      // 5. Update clock string
      setOverview(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
    }, 3500);

    return () => clearInterval(interval);
  }, [demoMode]);

  // Smart Home Controls
  const toggleLight = (roomId: string, deviceId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;
        const updatedDevices = room.devices.map(dev => {
          if (dev.id === deviceId) {
            const newState = !dev.state;
            return {
              ...dev,
              state: newState,
              attributes: {
                ...dev.attributes,
                brightness: newState ? (dev.attributes.brightness || 75) : 0,
                powerWatts: newState ? 24 : 0
              },
              lastUpdated: 'Just now'
            };
          }
          return dev;
        });
        const activeLights = updatedDevices.filter(d => d.domain === 'light' && d.state).length;
        return {
          ...room,
          lightsActive: activeLights,
          devices: updatedDevices
        };
      })
    );

    // Update global smart home light count
    setSmartHome(prev => {
      const allLights = rooms.flatMap(r => r.devices).filter(d => d.domain === 'light');
      const count = allLights.filter(d => d.state).length;
      return { ...prev, lightsOn: count };
    });
  };

  const setClimateTemp = (roomId: string, deviceId: string, temp: number) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          devices: room.devices.map(dev => {
            if (dev.id === deviceId) {
              return {
                ...dev,
                attributes: {
                  ...dev.attributes,
                  targetTemperature: temp
                },
                lastUpdated: 'Just now'
              };
            }
            return dev;
          })
        };
      })
    );
  };

  const toggleLock = (roomId: string, deviceId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          devices: room.devices.map(dev => {
            if (dev.id === deviceId) {
              const isLocked = dev.attributes.locked ?? true;
              const newLocked = !isLocked;
              return {
                ...dev,
                state: newLocked ? 'locked' : 'unlocked',
                attributes: {
                  ...dev.attributes,
                  locked: newLocked
                },
                lastUpdated: 'Just now'
              };
            }
            return dev;
          })
        };
      })
    );
  };

  // Alerts
  const acknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'acknowledged' } : a))
    );
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'resolved' } : a))
    );
  };

  // Hermes AI Assistant
  const sendHermesMessage = async (text: string) => {
    const userMsg: HermesMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    setHermesMessages(prev => [...prev, userMsg]);

    // Simulate AI reasoning delay
    setTimeout(async () => {
      const { hermesService } = await import('../services/adapters/hermes');
      const response = await hermesService.sendMessage(text);
      setHermesMessages(prev => [...prev, response]);
    }, 600);
  };

  const executeHermesAction = (messageId: string, actionId: string) => {
    setHermesMessages(prev =>
      prev.map(msg => {
        if (msg.proposedAction && msg.proposedAction.id === actionId) {
          return {
            ...msg,
            proposedAction: {
              ...msg.proposedAction,
              status: 'executed'
            }
          };
        }
        return msg;
      })
    );

    // Add activity event
    setActivity(prev => [
      {
        id: 'act-' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relativeTime: 'Just now',
        source: 'Hermes AI',
        category: 'Action',
        description: 'User confirmed Hermes automated administrative execution',
        iconType: 'CheckCircle',
        severity: 'success'
      },
      ...prev
    ]);
  };

  // Infrastructure Actions with Confirmation
  const restartVM = (vmid: number) => {
    const targetVM = vms.find(v => v.vmid === vmid);
    requestConfirmation({
      title: 'Restart Virtual Machine',
      action: `Restart VM ${vmid} (${targetVM?.name || 'VM'})`,
      resource: targetVM?.name || `VM ${vmid}`,
      impact: 'Services running on this VM will be momentarily unavailable during reboot (approx. 20-40 seconds).',
      onConfirm: () => {
        setVMs(prev =>
          prev.map(v => (v.vmid === vmid ? { ...v, status: 'running', uptime: '0m' } : v))
        );
        closeConfirmation();
      }
    });
  };

  const stopVM = (vmid: number) => {
    const targetVM = vms.find(v => v.vmid === vmid);
    requestConfirmation({
      title: 'Stop Virtual Machine',
      action: `Graceful Shutdown VM ${vmid} (${targetVM?.name || 'VM'})`,
      resource: targetVM?.name || `VM ${vmid}`,
      impact: 'All processes on this VM will be halted until manually started again.',
      onConfirm: () => {
        setVMs(prev =>
          prev.map(v => (v.vmid === vmid ? { ...v, status: 'stopped' } : v))
        );
        closeConfirmation();
      }
    });
  };

  const restartService = (serviceId: string) => {
    const srv = services.find(s => s.id === serviceId);
    requestConfirmation({
      title: 'Restart Homelab Service',
      action: `Restart Service (${srv?.name || serviceId})`,
      resource: srv?.name || serviceId,
      impact: 'Service daemon will restart and reload configuration in 5-10 seconds.',
      onConfirm: () => {
        setServices(prev =>
          prev.map(s => (s.id === serviceId ? { ...s, uptime: '0m', status: 'Running' } : s))
        );
        closeConfirmation();
      }
    });
  };

  return (
    <HomelabContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        demoMode,
        setDemoMode,
        overview,
        cluster,
        nodes,
        vms,
        containers,
        starlink,
        unifi,
        smartHome,
        rooms,
        cameras,
        frigate,
        storagePool,
        disks,
        immich,
        backups,
        services,
        dockerContainers,
        energy,
        alerts,
        activity,
        logs,
        integrations,
        hermesMessages,
        isHermesDrawerOpen,
        setIsHermesDrawerOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedCamera,
        setSelectedCamera,
        confirmationModal,
        requestConfirmation,
        closeConfirmation,
        toggleLight,
        setClimateTemp,
        toggleLock,
        acknowledgeAlert,
        resolveAlert,
        sendHermesMessage,
        executeHermesAction,
        restartVM,
        stopVM,
        restartService,
        liveThroughput
      }}
    >
      {children}
    </HomelabContext.Provider>
  );
};

export const useHomelab = () => {
  const context = useContext(HomelabContext);
  if (!context) {
    throw new Error('useHomelab must be used within a HomelabProvider');
  }
  return context;
};
