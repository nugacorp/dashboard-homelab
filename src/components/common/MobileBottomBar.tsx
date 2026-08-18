import React from 'react';
import { LayoutDashboard, Server, Cpu, Home, Bot, Menu } from 'lucide-react';
import { useHomelab, type NavigationPage } from '../../context/HomelabContext';

/**
 * Mobile quick nav. Points at the four views that currently carry real data,
 * plus the Hermes drawer.
 */
export const MobileBottomBar: React.FC = () => {
  const { currentPage, setCurrentPage, setIsMobileMenuOpen, setIsHermesDrawerOpen } = useHomelab();

  const quickNav: Array<{
    page: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isHermes?: boolean;
  }> = [
    { page: 'overview', label: 'Overview', icon: LayoutDashboard },
    { page: 'proxmox', label: 'Proxmox', icon: Server },
    { page: 'vms', label: 'VMs', icon: Cpu },
    { page: 'smart-home', label: 'Smart Home', icon: Home },
    { page: 'hermes', label: 'Hermes', icon: Bot, isHermes: true },
  ];

  return (
    <div className="z-20 flex h-14 w-full shrink-0 items-center justify-around border-t border-slate-800/90 bg-slate-950/95 px-1 backdrop-blur-xl md:hidden">
      {quickNav.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;

        return (
          <button
            key={item.page}
            onClick={() => {
              if (item.isHermes) setIsHermesDrawerOpen(true);
              else setCurrentPage(item.page);
            }}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive ? 'font-semibold text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="mt-1 truncate text-[10px] leading-none">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-1 flex-col items-center justify-center py-1 text-slate-400 transition-colors hover:text-slate-200"
        title="Abrir menú completo"
      >
        <Menu className="h-4 w-4 text-slate-400" />
        <span className="mt-1 text-[10px] leading-none">Menú</span>
      </button>
    </div>
  );
};
