import React from 'react';
import { Terminal } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const LogsPage: React.FC = () => (
  <PlaceholderPage
    title="Logs"
    subtitle="Sin agregación de logs centralizada"
    icon={Terminal}
    accent="bg-indigo-500/20 text-indigo-400"
    integrationName="Agregación de logs"
    description="NUGA HOME no recoge logs de los nodos ni de los servicios. Las líneas de syslog que mostraba la versión anterior estaban escritas a mano."
    requirement="Requeriría un agregador (Loki, Vector, journald remoto) con API de consulta y su configuración en el backend."
    planned={[
      'Stream unificado de journald de los nodos PVE',
      'Filtrado por servicio y nivel',
      'Búsqueda de texto sobre la ventana de retención',
      'Enlace desde una alerta a sus logs',
    ]}
  />
);
