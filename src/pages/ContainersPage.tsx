import React from 'react';
import { Layers, Container } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { GuestFleetTable } from '../components/cards/GuestFleetTable';
import { ResourceGate } from '../components/common/ResourceGate';
import { IntegrationNotConfigured } from '../components/common/IntegrationNotConfigured';

/**
 * LXC containers.
 *
 * The Docker tab is intentionally not backed by an integration: reading the
 * Docker daemon would mean mounting /var/run/docker.sock into this container,
 * which is equivalent to granting it root on the host.
 */
export const ContainersPage: React.FC = () => {
  const { containers } = useHomelab();

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/20 p-2.5 text-indigo-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-100">Contenedores LXC</h2>
            <p className="text-xs text-slate-400">
              Contenedores del sistema gestionados por Proxmox
            </p>
          </div>
        </div>
      </div>

      <ResourceGate
        resource={containers}
        name="Proxmox"
        notConfiguredDescription="Sin credenciales de Proxmox no hay inventario de contenedores."
        notConfiguredRequirement="Define PVE_API_URL, PVE_TOKEN_ID y PVE_TOKEN_SECRET en el backend."
        emptyDescription="El cluster respondió correctamente y no tiene ningún contenedor LXC definido."
      >
        {(guests) => (
          <GuestFleetTable
            guests={guests}
            idLabel="CTID"
            searchPlaceholder="Buscar por CTID o nombre…"
          />
        )}
      </ResourceGate>

      <IntegrationNotConfigured
        name="Contenedores Docker"
        tone="not_configured"
        description="NUGA HOME no lee el demonio Docker. Hacerlo exigiría montar /var/run/docker.sock dentro de este contenedor, lo que equivale a darle root sobre el host."
        requirement="Si en el futuro hace falta, la vía segura es un proxy de socket con lista blanca de endpoints de solo lectura, nunca el socket directo."
        icon={Container}
        compact
      />
    </div>
  );
};
