import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Boxes, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Login failed. Please verify credentials.');
    }
  };

  const autofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 space-y-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        {/* Branding header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Fly Ash Plant Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Industrial Operations, Inventory & Accounts ERP
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Username or Staff Account
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin / operator"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/25 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Plant System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill Credentials */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-500 text-center font-semibold">Quick Role Sign-In:</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => autofill('admin', 'admin123')}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700 transition"
              title="Admin: Full Access"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => autofill('owner', 'owner123')}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 transition"
              title="Owner: Full Access"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => autofill('operator', 'operator123')}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
              title="Data Entry Operator: Enter & Edit, Cannot Delete"
            >
              Operator
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Permanent Supabase Cloud Sync Active</span>
        </div>
      </div>
    </div>
  );
};
