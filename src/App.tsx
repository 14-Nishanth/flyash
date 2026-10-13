import React, { useRef } from 'react';
import { useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Navbar, MENU_OPTIONS } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Materials } from './components/Materials';
import { Parties } from './components/Parties';
import { Production } from './components/Production';
import { Analytics } from './components/Analytics';
import { Employees } from './components/Employees';
import { Wages } from './components/Wages';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';
import { Database, LogOut, Sun, Moon, ChevronUp, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, theme, toggleTheme, logout } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Prevent accidental number input scrolling and Ctrl+Wheel zooming
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return;
      }
      const activeEl = document.activeElement;
      if (activeEl && (activeEl as HTMLInputElement).type === 'number') {
        (activeEl as HTMLInputElement).blur();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleScrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: offset, behavior: 'smooth' });
    }
  };

  // If user is not logged in, render the Login Screen inside a fixed-display scrollable container
  if (!currentUser) {
    return (
      <div className="w-full h-full app-scroll-container bg-slate-950">
        <Login />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors select-none">
      {/* Fixed Top Header Bar */}
      <div className="shrink-0">
        <Navbar />
      </div>

      {/* Fixed Display Body: Left-Side Small Button Bar + Scrollable Page Container */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {/* LEFT-SIDE SMALL BUTTON BAR FOR EVERY OPTION */}
        <aside className="h-full w-14 sm:w-36 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-1 sm:p-2 shrink-0 overflow-y-auto z-30">
          {/* Top: Small Button for Every Option */}
          <div className="space-y-1">
            {MENU_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  title={item.label}
                  className={`w-full py-1.5 px-1 sm:px-2.5 rounded-lg flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 transition-all border ${
                    isActive
                      ? 'bg-amber-600 text-white border-amber-500 shadow-xs font-bold'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent font-semibold'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                  <span className="text-[9px] sm:text-[11px] leading-tight truncate max-w-full">
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom: Small Action Buttons (Supabase DB, Theme, Logout) */}
          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
              <a
                href="https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Supabase Cloud Database"
                className="w-full py-1.5 px-1 sm:px-2.5 rounded-lg flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold transition"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-500" />
                <span className="text-[9px] sm:text-[11px] leading-tight truncate">Cloud DB</span>
              </a>
            )}

            <button
              onClick={toggleTheme}
              title="Switch Light / Dark Mode"
              className="w-full py-1.5 px-1 sm:px-2.5 rounded-lg flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-indigo-500" />
              )}
              <span className="text-[9px] sm:text-[11px] leading-tight truncate">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="w-full py-1.5 px-1 sm:px-2.5 rounded-lg flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-800/50 font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-[9px] sm:text-[11px] leading-tight truncate">Exit</span>
            </button>
          </div>
        </aside>

        {/* Dedicated Scrollable Main Page Area (Fixed Display Viewport + Smooth Page Scroll) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full app-scroll-container flex flex-col min-w-0"
        >
          <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-5 lg:px-6 py-4 sm:py-5 pb-16">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'materials' && <Materials />}
            {activeTab === 'parties' && <Parties />}
            {activeTab === 'production' && <Production />}
            {(activeTab === 'employees' || activeTab === 'attendance') && <Employees />}
            {activeTab === 'wages' && <Wages />}
            {activeTab === 'expenses' && <Expenses />}
            {activeTab === 'settings' && <Settings />}
          </main>

          <footer className="border-t border-slate-200 dark:border-slate-800/80 py-3 mt-auto text-center text-[11px] text-slate-500 dark:text-slate-400 px-3">
            <p>© {new Date().getFullYear()} Sri Balamurugan Fly Ash Bricks — Enterprise Management System</p>
          </footer>
        </div>

        {/* Floating Quick Page Scroll Buttons (Up / Down) for Easy Scrolling on Any Device */}
        <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleScrollBy(-320)}
            title="Scroll Page Up"
            className="w-8 h-8 rounded-lg bg-slate-800/85 hover:bg-amber-600 text-white border border-slate-700 shadow-lg flex items-center justify-center transition active:scale-95"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScrollBy(320)}
            title="Scroll Page Down"
            className="w-8 h-8 rounded-lg bg-slate-800/85 hover:bg-amber-600 text-white border border-slate-700 shadow-lg flex items-center justify-center transition active:scale-95"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
