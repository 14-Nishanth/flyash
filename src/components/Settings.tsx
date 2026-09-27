import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sliders, Database, Bell, CheckCircle } from 'lucide-react';
import { updateSupabaseConfig } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('flyash_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('flyash_supabase_anon_key') || ''
  );
  const [ownerName, setOwnerName] = useState(settings.owner_name || 'Plant Owner');
  const [telegramToken, setTelegramToken] = useState(settings.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegram_chat_id || '');
  const [digestTime, setDigestTime] = useState(settings.daily_digest_time || '19:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(supabaseUrl, supabaseKey);
    updateSettings({
      ...settings,
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseKey,
      owner_name: ownerName,
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
      daily_digest_time: digestTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Configuration & Cloud Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Configure your Supabase PostgreSQL cloud database, Telegram alerts, and owner details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Cloud Connection */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Database className="w-5 h-5 text-emerald-500" /> Supabase Cloud Database Integration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect your free Supabase project to automatically sync all data live across devices & team smartphones.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Project URL (VITE_SUPABASE_URL)</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Anon / Public API Key (VITE_SUPABASE_ANON_KEY)</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Telegram Bot Automation */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-sky-500" /> Telegram Shift End Digest Automation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Telegram Bot Token</label>
              <input
                type="text"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCdefGHI..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Telegram Chat ID / Channel</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-100123456789"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Shift End Daily Digest Time</label>
            <input
              type="text"
              value={digestTime}
              onChange={(e) => setDigestTime(e.target.value)}
              className="w-40 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <CheckCircle className="w-4 h-4" /> Configuration saved successfully!
            </span>
          ) : <span />}
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20"
          >
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};
