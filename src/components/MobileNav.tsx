import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Truck, Hammer, Users, Banknote, TrendingUp } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Turnover', icon: TrendingUp },
    { id: 'materials', label: 'Materials', icon: Truck },
    { id: 'production', label: 'Production', icon: Hammer },
    { id: 'parties', label: 'Parties', icon: Users },
    { id: 'wages', label: 'Wages', icon: Banknote },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-xl py-2 px-3 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
