import React from 'react';
import { Network } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const NetworkPage: React.FC = () => (
  <PlaceholderPage
    title="Red y topología"
    subtitle="Sin controlador de red integrado en NUGA HOME"
    icon={Network}
    accent="bg-blue-500/20 text-blue-400"
    integrationName="Integración de red"
    description="No hay ningún controlador de red conectado al dashboard. El cableado y el enrutamiento del homelab existen, pero NUGA HOME no tiene todavía una fuente de datos para describirlos."
    requirement="Requiere un UniFi Network Application (u otro controlador con API) y las variables de entorno correspondientes en el backend."
    planned={[
      'VLANs y subredes reales leídas del controlador',
      'Clientes conectados con IP, MAC y puerto',
      'Estado de gateway, switches y puntos de acceso',
      'Throughput WAN/LAN medido, no estimado',
    ]}
  />
);
