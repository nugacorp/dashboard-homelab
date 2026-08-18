import React from 'react';
import { Zap } from 'lucide-react';
import { PlaceholderPage } from '../components/common/PlaceholderPage';

export const EnergyPage: React.FC = () => (
  <PlaceholderPage
    title="Energía"
    subtitle="Sin medición eléctrica ni SAI"
    icon={Zap}
    accent="bg-amber-500/20 text-amber-400"
    integrationName="Telemetría energética"
    description="No hay medidores de consumo, ni SAI monitorizado, ni paneles solares. Los 684 W, el coste mensual y la batería al 100% que se mostraban antes eran inventados."
    requirement="Requeriría un medidor con API (Shelly EM, enchufes inteligentes en Home Assistant) o un SAI con NUT."
    planned={[
      'Consumo instantáneo real por circuito',
      'Histórico y coste calculado a partir de tu tarifa',
      'Estado y autonomía del SAI',
      'Temperatura ambiente del rack',
    ]}
  />
);
