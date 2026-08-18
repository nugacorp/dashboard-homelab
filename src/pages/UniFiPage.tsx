import React from 'react';
import { Wifi } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const UniFiPage: React.FC = () => (
  <PlaceholderPage
    title="UniFi"
    subtitle="No hay equipamiento UniFi desplegado"
    icon={Wifi}
    accent="bg-blue-500/20 text-blue-400"
    integrationName="UniFi Network"
    description="El homelab no tiene gateway, switches ni puntos de acceso UniFi instalados. Esta sección queda reservada para cuando existan."
    requirement="Requiere UniFi Network Application accesible por API y un usuario de solo lectura."
    planned={[
      'Inventario de dispositivos UniFi',
      'Experiencia WiFi por cliente',
      'Puertos PoE y consumo',
      'Eventos de seguridad IPS/IDS',
    ]}
  />
);
