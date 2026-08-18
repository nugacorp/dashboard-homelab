import React from 'react';
import { Camera } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const CamerasPage: React.FC = () => (
  <PlaceholderPage
    title="Cámaras y NVR"
    subtitle="No hay cámaras ni NVR en el homelab"
    icon={Camera}
    accent="bg-indigo-500/20 text-indigo-400"
    integrationName="Videovigilancia"
    description="No existen cámaras, ni Frigate, ni UniFi Protect, ni acelerador Coral TPU. La matriz de 8 cámaras de la versión anterior era íntegramente simulada."
    requirement="Requeriría desplegar un NVR (Frigate o UniFi Protect) y conectarlo al backend."
    planned={[
      'Matriz de streams en vivo',
      'Detecciones por objeto con marca temporal',
      'Estado de grabación y retención',
      'Métricas del acelerador de inferencia',
    ]}
  />
);
