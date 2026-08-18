import React from 'react';
import { Cpu } from 'lucide-react';
import { useHomelab } from '../context/HomelabContext';
import { GuestFleetTable } from '../components/cards/GuestFleetTable';
import { ResourceGate } from '../components/common/ResourceGate';

export const VMsPage: React.FC = () => {
  const { vms } = useHomelab();

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-100">Máquinas virtuales</h2>
            <p className="text-xs text-slate-400">
              Instancias QEMU/KVM leídas del cluster Proxmox en modo solo lectura
            </p>
          </div>
        </div>
      </div>

      <ResourceGate
        resource={vms}
        name="Proxmox"
        notConfiguredDescription="Sin credenciales de Proxmox no hay inventario de máquinas virtuales."
        notConfiguredRequirement="Define PVE_API_URL, PVE_TOKEN_ID y PVE_TOKEN_SECRET en el backend."
        emptyDescription="El cluster respondió correctamente y no tiene ninguna máquina virtual definida."
      >
        {(guests) => (
          <GuestFleetTable
            guests={guests}
            idLabel="VMID"
            searchPlaceholder="Buscar por VMID o nombre…"
          />
        )}
      </ResourceGate>
    </div>
  );
};
