import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Boxes, 
  LayoutDashboard, 
  Truck, 
  Users, 
  Hammer, 
  ClipboardCheck, 
  Banknote, 
  Receipt, 
  Sliders, 
  Sun, 
  Moon,
  Cloud,
  HardDrive,
  LogOut,
  UserCircle
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, currentUser, logout } = useApp();
  const isSupabaseConnected = !!getSupabaseClient();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'materials', label: 'Materials & Stock', icon: Truck, color: 'text-emerald-500' },
    { id: 'parties', label: 'Parties & Ledger', icon: Users, color: 'text-indigo-500' },
    { id: 'production', label: 'Production & Labor', icon: Hammer, color: 'text-amber-500' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, color: 'text-teal-500' },
    { id: 'wages', label: 'Wages Sheet', icon: Banknote, color: 'text-green-500' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, color: 'text-rose-500' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Fly Ash Manager</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded">
                    React + Vite
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Industrial Enterprise ERP</p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Utilities: Supabase Status, Theme, User, Settings, Logout */}
          <div className="flex items-center gap-2">
            {/* Supabase status pill */}
            <div 
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isSupabaseConnected 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
              }`}
              title={isSupabaseConnected ? 'Connected to Supabase Cloud PostgreSQL' : 'Operating in Local Storage Mode'}
            >
              {isSupabaseConnected ? <Cloud className="w-3 h-3 text-emerald-500" /> : <HardDrive className="w-3 h-3" />}
              <span>{isSupabaseConnected ? 'Supabase Cloud' : 'Local Mode'}</span>
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
              title="Toggle Yard Sunlight / Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-xl border transition ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Settings & Cloud Config"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <UserCircle className="w-4 h-4 text-blue-500" />
                  <span>{currentUser.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition border border-rose-500/20"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
