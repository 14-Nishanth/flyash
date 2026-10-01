import React from 'react';
import { useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { Materials } from './components/Materials';
import { Parties } from './components/Parties';
import { Production } from './components/Production';
import { Analytics } from './components/Analytics';
import { Employees } from './components/Employees';
import { Wages } from './components/Wages';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';

export const App: React.FC = () => {
  const { currentUser, activeTab } = useApp();

  React.useEffect(() => {
    const handleWheel = () => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl as HTMLInputElement).type === 'number') {
        (activeEl as HTMLInputElement).blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // If user is not logged in, render the Login Screen
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <footer className="hidden lg:block border-t border-slate-200 dark:border-slate-800/80 py-4 mt-auto text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Sri Balamurugan Fly Ash Bricks — Enterprise Management System (React + TypeScript + Vite + Supabase)</p>
      </footer>

      <MobileNav />
    </div>
  );
};

export default App;
