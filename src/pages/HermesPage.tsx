import React from 'react';
import { HermesChat } from '../components/common/HermesChat';

export const HermesPage: React.FC = () => (
  <div className="h-full pb-8">
    <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]">
      <HermesChat embedded={false} />
    </div>
  </div>
);
