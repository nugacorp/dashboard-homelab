import React from 'react';
import { HardDrive, Database, Archive, Image } from 'lucide-react';
import type { ProxmoxStorageDto } from '@shared/api';
import { useResource } from '../hooks/useResource';
import { useHomelab } from '../context/HomelabContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ResourceProgress } from '../components/ui/ResourceProgress';
import { ResourceGate } from '../components/common/ResourceGate';
import { IntegrationNotConfigured } from '../components/common/IntegrationNotConfigured';
import { formatBytes, ratioPct, NOT_AVAILABLE } from '../lib/format';

/**
 * Storage.
 *
 * Real content: the Proxmox storage inventory (local / local-lvm per node).
 * Everything the old page displayed - a 12 TB ZFS RAID-Z2 pool, six IronWolf
 * drives with SMART data, Immich statistics, PBS backup jobs - described
 * hardware that does not exist. There is no Ceph and no shared storage in this
 * cluster, which the layout below now reflects.
 */
export const StoragePage: React.FC = () => {
  const { session } = useHomelab();
  const canFetch = !session.loading && (!session.authRequired || session.authenticated);

  const storage = useResource<ProxmoxStorageDto[]>('/proxmox/storage', 'proxmox', {
    pollMs: 30_000,
    enabled: canFetch,
    isEmpty: (d) => d.length === 0,
  });

  const byNode = (storage.data ?? []).reduce<Record<string, ProxmoxStorageDto[]>>((acc, entry) => {
    (acc[entry.node] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-100">Almacenamiento Proxmox</h2>
            <p className="text-xs text-slate-400">
              Almacenes locales por nodo · sin Ceph ni almacenamiento compartido en este cluster
            </p>
          </div>
        </div>
      </div>

      <ResourceGate
        resource={storage}
        name="Almacenamiento Proxmox"
        notConfiguredDescription="Sin credenciales de Proxmox no se puede listar el almacenamiento."
        notConfiguredRequirement="Define PVE_API_URL, PVE_TOKEN_ID y PVE_TOKEN_SECRET en el backend."
        emptyDescription="El cluster no reportó ningún almacén."
      >
        {() => (
          <div className="space-y-6">
            {Object.entries(byNode).map(([node, entries]) => (
              <div
                key={node}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    {node}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-500">
                    {entries.length} {entries.length === 1 ? 'almacén' : 'almacenes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {entries.map((entry) => (
                    <StorageCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ResourceGate>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <IntegrationNotConfigured
          name="NAS / ZFS"
          tone="not_configured"
          description="No hay TrueNAS ni pool ZFS en el homelab. La versión anterior mostraba un RAID-Z2 de 12 TB con seis discos y estado SMART: era íntegramente simulado."
          icon={Database}
          compact
        />
        <IntegrationNotConfigured
          name="Proxmox Backup Server"
          tone="coming_later"
          description="No hay PBS desplegado, así que no se listan trabajos de copia de seguridad. Cuando exista, se leerá por su propia API."
          icon={Archive}
          compact
        />
        <IntegrationNotConfigured
          name="Immich"
          tone="not_configured"
          description="No hay servidor de fotos Immich en el homelab. Las 48.240 fotos y 2,84 TB que aparecían antes eran datos de ejemplo."
          icon={Image}
          compact
        />
      </div>
    </div>
  );
};

const StorageCard: React.FC<{ entry: ProxmoxStorageDto }> = ({ entry }) => {
  const usedPct = ratioPct(entry.usedBytes, entry.totalBytes);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2.5">
        <div className="min-w-0">
          <h4 className="truncate font-mono text-sm font-bold text-slate-100">{entry.storage}</h4>
          <p className="text-[11px] text-slate-400">
            {entry.type}
            {entry.shared ? ' · compartido' : ' · local'}
          </p>
        </div>
        <StatusBadge
          status={entry.status ?? 'unknown'}
          size="sm"
          showPulse={entry.status === 'available'}
        />
      </div>

      <div className="mt-3">
        <ResourceProgress
          label="Uso"
          percentage={usedPct}
          usedText={formatBytes(entry.usedBytes)}
          totalText={formatBytes(entry.totalBytes)}
          size="sm"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[11px] text-slate-400">
        <span>
          Libre:{' '}
          <strong className="font-mono text-slate-200">{formatBytes(entry.availableBytes)}</strong>
        </span>
        <span className="truncate font-mono text-[10px] text-slate-500">
          {entry.contentTypes.length > 0 ? entry.contentTypes.join(', ') : NOT_AVAILABLE}
        </span>
      </div>
    </div>
  );
};
