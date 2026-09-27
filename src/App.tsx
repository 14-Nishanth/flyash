import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { Materials } from './components/Materials';
import { Parties } from './components/Parties';
import { Production } from './components/Production';
import { Attendance } from './components/Attendance';
import { Wages } from './components/Wages';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';

export const App: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-8">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'parties' && <Parties />}
        {activeTab === 'production' && <Production />}
        {activeTab === 'attendance' && <Attendance />}
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
