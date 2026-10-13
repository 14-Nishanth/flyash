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
  LogOut,
  UserCircle,
  TrendingUp,
  Calculator,
  Lock,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

export const MENU_OPTIONS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    shortLabel: 'Dash',
    subtitle: 'Plant KPIs & Live Summary',
    icon: LayoutDashboard, 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20'
  },
  { 
    id: 'analytics', 
    label: 'Turnover & Analytics', 
    shortLabel: 'Turnover',
    subtitle: 'Revenue, Profit & Charts',
    icon: TrendingUp, 
    color: 'text-sky-500',
    bg: 'bg-sky-500/10 border-sky-500/20'
  },
  { 
    id: 'profit-margin', 
    label: 'Profit Margin', 
    shortLabel: 'Margin',
    subtitle: 'Unit cost & profit margin estimator',
    icon: Calculator, 
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20'
  },
  { 
    id: 'materials', 
    label: 'Materials & Stock', 
    shortLabel: 'Materials',
    subtitle: 'Inward Stock & Outward Sales',
    icon: Truck, 
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20'
  },
  { 
    id: 'parties', 
    label: 'Parties & Ledger', 
    shortLabel: 'Parties',
    subtitle: 'Credit, Debit & Remaining Due',
    icon: Users, 
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500/20'
  },
  { 
    id: 'production', 
    label: 'Production', 
    shortLabel: 'Prod',
    subtitle: 'Daily Shift Brick Output',
    icon: Hammer, 
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/20'
  },
  { 
    id: 'employees', 
    label: 'Workers & Gangs', 
    shortLabel: 'Workers',
    subtitle: 'Staff Directory & Attendance',
    icon: ClipboardCheck, 
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 border-teal-500/20'
  },
  { 
    id: 'wages', 
    label: 'Wages Sheet', 
    shortLabel: 'Wages',
    subtitle: 'Labor Payouts & Calculations',
    icon: Banknote, 
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20'
  },
  { 
    id: 'expenses', 
    label: 'Expenses & Purchases', 
    shortLabel: 'Expenses',
    subtitle: 'Material Bills & Pay Supplier Due',
    icon: Receipt, 
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/20'
  },
  { 
    id: 'settings', 
    label: 'Settings & Database', 
    shortLabel: 'Settings',
    subtitle: 'Users, Alerts & Supabase Tables',
    icon: Sliders, 
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20'
  },
];

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    theme, 
    toggleTheme, 
    currentUser, 
    logout,
    syncWithCloud,
    isSyncing,
    lastSyncedTime
  } = useApp();
  const isSupabaseConnected = !!getSupabaseClient();

  const currentNav = MENU_OPTIONS.find((item) => item.id === activeTab) || MENU_OPTIONS[0];
  const CurrentIcon = currentNav.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="w-full px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2">
          {/* Left: Brand Logo + Active Section Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-left group shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/25 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight truncate">
                    Fly Ash ERP
                  </span>
                  <span className="px-1 py-0.2 text-[9px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded">
                    v2.5
                  </span>
                </div>
              </div>
            </button>

            {/* Current Active Page Badge */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 min-w-0">
              <div className={`p-1 rounded-lg border ${currentNav.bg} shrink-0`}>
                <CurrentIcon className={`w-3.5 h-3.5 ${currentNav.color}`} />
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentNav.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status & User Profile (No Right-Side Menu Button) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Interactive Cloud Sync Button */}
            <button
              onClick={() => syncWithCloud()}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition ${
                isSyncing
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 animate-pulse'
                  : isSupabaseConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
              }`}
              title={
                isSyncing
                  ? 'Syncing with Supabase cloud...'
                  : lastSyncedTime
                  ? `Last synced: ${new Date(lastSyncedTime).toLocaleTimeString()}. Click to force sync mobile & laptop.`
                  : 'Click to sync data with Supabase cloud'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                </div>
              )}
              <span className="hidden xs:inline">
                {isSyncing ? 'Syncing...' : 'Live Sync'}
              </span>
            </button>

            {/* Admin Supabase Database Direct Link */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
              <a
                href="https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] font-bold transition"
                title="Open Supabase Cloud Database Tables (Admin Access)"
              >
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Supabase DB</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            )}

            {/* Quick Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Switch Light / Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            {/* User Badge & Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <UserCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{currentUser.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-xs font-semibold transition border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
