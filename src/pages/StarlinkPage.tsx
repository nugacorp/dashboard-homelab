import React from 'react';
import { Radio } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const StarlinkPage: React.FC = () => (
  <PlaceholderPage
    title="Starlink"
    subtitle="Sin telemetría de uplink integrada"
    icon={Radio}
    accent="bg-cyan-500/20 text-cyan-400"
    integrationName="Telemetría Starlink"
    description="NUGA HOME no recoge métricas del enlace de internet. Los valores de velocidad, latencia, obstrucciones y temperatura del plato que mostraba la versión anterior eran ficticios y se han eliminado."
    requirement="Requeriría un recolector de la API gRPC del terminal Starlink expuesto al backend."
    planned={[
      'Descarga, subida y latencia medidas',
      'Pérdida de paquetes e histórico de cortes',
      'Obstrucciones y orientación del plato',
      'Estado del terminal',
    ]}
  />
);
