import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  HermesStatusDto,
  HomeAssistantSummaryDto,
  NetworkStatusDto,
  UnifiSummaryDto,
  ProxmoxClusterDto,
  ProxmoxGuestDto,
  ProxmoxNodeDto,
  ReadyResponse,
  SessionResponse,
  UptimeKumaMonitorDto,
  UptimeKumaStatusDto,
  UptimeKumaSummaryDto,
} from '@shared/api';
import { useRawResource, useResource, type Resource } from '../hooks/useResource';
import { apiGetRaw, apiPost, UNAUTHENTICATED_EVENT } from '../services/api/client';

/**
 * Application state.
 *
 * Everything here is either UI state or a live resource backed by /api. There
 * is no demo mode, no simulated telemetry loop and no mock import: if a value
 * is on screen, the backend produced it.
 */

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

/** Poll cadences. Deliberately unhurried: this is infrastructure, not a game. */
const POLL_FAST_MS = 15_000;
const POLL_SLOW_MS = 30_000;
const POLL_LAZY_MS = 60_000;

export interface SessionState {
  loading: boolean;
  authRequired: boolean;
  authenticated: boolean;
  username: string | null;
}

interface HomelabContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;

  session: SessionState;
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string | null }>;
  logout: () => Promise<void>;

  ready: Resource<ReadyResponse>;
  cluster: Resource<ProxmoxClusterDto>;
  nodes: Resource<ProxmoxNodeDto[]>;
  vms: Resource<ProxmoxGuestDto[]>;
  containers: Resource<ProxmoxGuestDto[]>;
  homeAssistant: Resource<HomeAssistantSummaryDto>;
  network: Resource<NetworkStatusDto>;
  unifi: Resource<UnifiSummaryDto>;
  hermes: Resource<HermesStatusDto>;
  uptimeKuma: Resource<UptimeKumaStatusDto>;
  uptimeKumaMonitors: Resource<UptimeKumaMonitorDto[]>;
  uptimeKumaSummary: Resource<UptimeKumaSummaryDto>;

  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isHermesDrawerOpen: boolean;
  setIsHermesDrawerOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

const HomelabContext = createContext<HomelabContextType | undefined>(undefined);

export const HomelabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHermesDrawerOpen, setIsHermesDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [session, setSession] = useState<SessionState>({
    loading: true,
    authRequired: false,
    authenticated: false,
    username: null,
  });

  const loadSession = useCallback(async () => {
    const response = await apiGetRaw<SessionResponse>('/auth/session');
    if (!response) {
      // A missing/failed session endpoint means we cannot prove we are allowed
      // in; treat it as "auth required, not authenticated" rather than opening up.
      setSession({ loading: false, authRequired: true, authenticated: false, username: null });
      return;
    }
    setSession({
      loading: false,
      authRequired: response.authRequired,
      authenticated: response.authenticated,
      username: response.username,
    });
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  // Any 401 anywhere in the app drops us back to the login screen.
  useEffect(() => {
    const onUnauthenticated = () => {
      setSession((prev) => ({ ...prev, loading: false, authRequired: true, authenticated: false }));
    };
    window.addEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
    return () => window.removeEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await apiPost<SessionResponse>('/auth/login', { username, password });
      if (result.ok) {
        await loadSession();
        return { ok: true, message: null };
      }
      return { ok: false, message: result.errorMessage ?? 'No se pudo iniciar sesión.' };
    },
    [loadSession],
  );

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    await loadSession();
  }, [loadSession]);

  const canFetch = !session.loading && (!session.authRequired || session.authenticated);

  // Raw transport on purpose: /api/health/ready answers with a ReadyResponse,
  // not an ApiEnvelope. Routing it through useResource made the envelope guard
  // reject a healthy backend as "formato inesperado".
  const ready = useRawResource<ReadyResponse>('/health/ready', {
    pollMs: POLL_SLOW_MS,
    enabled: canFetch,
  });
  const cluster = useResource<ProxmoxClusterDto>('/proxmox/cluster', 'proxmox', {
    pollMs: POLL_FAST_MS,
    enabled: canFetch,
  });
  const nodes = useResource<ProxmoxNodeDto[]>('/proxmox/nodes', 'proxmox', {
    pollMs: POLL_FAST_MS,
    enabled: canFetch,
    isEmpty: (d) => d.length === 0,
  });
  const vms = useResource<ProxmoxGuestDto[]>('/proxmox/vms', 'proxmox', {
    pollMs: POLL_FAST_MS,
    enabled: canFetch,
    isEmpty: (d) => d.length === 0,
  });
  const containers = useResource<ProxmoxGuestDto[]>('/proxmox/containers', 'proxmox', {
    pollMs: POLL_FAST_MS,
    enabled: canFetch,
    isEmpty: (d) => d.length === 0,
  });
  const homeAssistant = useResource<HomeAssistantSummaryDto>('/home-assistant/summary', 'homeAssistant', {
    pollMs: POLL_SLOW_MS,
    enabled: canFetch,
  });
  const network = useResource<NetworkStatusDto>('/network/status', 'nugaOps', {
    pollMs: POLL_SLOW_MS,
    enabled: canFetch,
  });
  const unifi = useResource<UnifiSummaryDto>('/unifi/summary', 'nugaOps', {
    pollMs: POLL_SLOW_MS,
    enabled: canFetch,
  });
  const hermes = useResource<HermesStatusDto>('/hermes/status', 'hermes', {
    pollMs: POLL_LAZY_MS,
    enabled: canFetch,
  });
  const uptimeKuma = useResource<UptimeKumaStatusDto>('/uptime-kuma/status', 'uptimeKuma', {
    pollMs: POLL_LAZY_MS,
    enabled: canFetch,
  });

  const uptimeKumaMonitors = useResource<UptimeKumaMonitorDto[]>(
    '/uptime-kuma/monitors',
    'uptimeKuma',
    {
      pollMs: POLL_SLOW_MS,
      enabled: canFetch,
      isEmpty: (data) => data.length === 0,
    },
  );

  const uptimeKumaSummary = useResource<UptimeKumaSummaryDto>(
    '/uptime-kuma/summary',
    'uptimeKuma',
    {
      pollMs: POLL_SLOW_MS,
      enabled: canFetch,
    },
  );

  // Ctrl/Cmd+K opens the palette; Escape closes every overlay.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsHermesDrawerOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = useMemo<HomelabContextType>(
    () => ({
      currentPage,
      setCurrentPage,
      session,
      login,
      logout,
      ready,
      cluster,
      nodes,
      vms,
      containers,
      homeAssistant,
      network,
      unifi,
      hermes,
      uptimeKuma,
      uptimeKumaMonitors,
      uptimeKumaSummary,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isHermesDrawerOpen,
      setIsHermesDrawerOpen,
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
    }),
    [
      currentPage,
      session,
      login,
      logout,
      ready,
      cluster,
      nodes,
      vms,
      containers,
      homeAssistant,
      network,
      unifi,
      hermes,
      uptimeKuma,
      uptimeKumaMonitors,
      uptimeKumaSummary,
      isMobileMenuOpen,
      isHermesDrawerOpen,
      isCommandPaletteOpen,
    ],
  );

  return <HomelabContext.Provider value={value}>{children}</HomelabContext.Provider>;
};

export const useHomelab = (): HomelabContextType => {
  const context = useContext(HomelabContext);
  if (!context) {
    throw new Error('useHomelab must be used within a HomelabProvider');
  }
  return context;
};
