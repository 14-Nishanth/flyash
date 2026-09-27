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
  UserCircle,
  TrendingUp,
  Lock
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, currentUser, logout, canDelete } = useApp();
  const isSupabaseConnected = !!getSupabaseClient();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
    { id: 'analytics', label: 'Turnover & Analytics', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'materials', label: 'Materials & Stock', icon: Truck, color: 'text-amber-600' },
    { id: 'parties', label: 'Parties & Ledger', icon: Users, color: 'text-indigo-600' },
    { id: 'production', label: 'Production', icon: Hammer, color: 'text-amber-600' },
    { id: 'employees', label: 'Workers & Gangs', icon: ClipboardCheck, color: 'text-teal-600' },
    { id: 'wages', label: 'Wages Sheet', icon: Banknote, color: 'text-emerald-600' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, color: 'text-rose-600' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Fly Ash Manager</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded">
                    ERP v2.5
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Industrial Brick & Block Operations</p>
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
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isSupabaseConnected 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
              }`}
              title={isSupabaseConnected ? 'Permanent Cloud Sync to Supabase PostgreSQL' : 'Local Storage Mode'}
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloud Sync</span>
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl border transition ${
                activeTab === 'settings'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Settings & Users"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* User Profile & Role Pill */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <UserCircle className="w-4 h-4 text-amber-600" />
                  <span>{currentUser.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : currentUser.role === 'owner'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {currentUser.role === 'operator' ? 'Data Entry (No Delete)' : currentUser.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-semibold transition border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800"
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
