import React from 'react';
import { HermesChat } from '../components/common/HermesChat';

export const HermesPage: React.FC = () => {
  return (
    <div className="h-full pb-8">
      <div className="h-[calc(100vh-8rem)] rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden">
        <HermesChat embedded={false} />
      </div>
    </div>
  );
};
