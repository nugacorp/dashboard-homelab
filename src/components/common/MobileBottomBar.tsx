import React from 'react';
import {
  LayoutDashboard,
  Server,
  Home,
  Camera,
  Bot,
  Menu
} from 'lucide-react';
import { useHomelab, NavigationPage } from '../../context/HomelabContext';

export const MobileBottomBar: React.FC = () => {
  const { currentPage, setCurrentPage, setIsMobileMenuOpen, setIsHermesDrawerOpen } = useHomelab();

  const quickNav = [
    { page: 'overview' as NavigationPage, label: 'Overview', icon: LayoutDashboard },
    { page: 'proxmox' as NavigationPage, label: 'Proxmox', icon: Server },
    { page: 'smart-home' as NavigationPage, label: 'Smart Home', icon: Home },
    { page: 'cameras' as NavigationPage, label: 'Cameras', icon: Camera },
    { page: 'hermes' as NavigationPage, label: 'Hermes', icon: Bot, isHermes: true },
  ];

  return (
    <div className="flex h-14 w-full items-center justify-around border-t border-slate-800/90 bg-slate-950/95 px-1 backdrop-blur-xl md:hidden shrink-0 z-20">
      {quickNav.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;

        return (
          <button
            key={item.page}
            onClick={() => {
              if (item.isHermes) {
                setIsHermesDrawerOpen(true);
              } else {
                setCurrentPage(item.page);
              }
            }}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="mt-1 text-[10px] leading-none truncate">{item.label}</span>
          </button>
        );
      })}

      {/* Menu / All Services Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-1 flex-col items-center justify-center py-1 text-slate-400 transition-colors hover:text-slate-200"
        title="Open Full Navigation Menu"
      >
        <Menu className="h-4 w-4 text-slate-400" />
        <span className="mt-1 text-[10px] leading-none">Menu</span>
      </button>
    </div>
  );
};
