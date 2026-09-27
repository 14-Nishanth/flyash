import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Database,
  Bell,
  CheckCircle,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Lock,
  Download,
  Key,
} from 'lucide-react';
import { updateSupabaseConfig } from '../lib/supabase';
import { UserRole } from '../types';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    addUser,
    deleteUser,
    canManageUsers,
    canDelete,
    currentUser,
    parties,
    inwards,
    outwards,
    jobs,
    expenses,
    employees,
  } = useApp();

  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('flyash_supabase_url') || 'https://laqpdlasfxearjtnnouu.supabase.co'
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('flyash_supabase_anon_key') || 'sb_publishable_HWGUFlrfY9nBdv8dK9ZCVg_qYuiDsOw'
  );
  const [ownerName, setOwnerName] = useState(settings.owner_name || 'Plant Owner');
  const [telegramToken, setTelegramToken] = useState(settings.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegram_chat_id || '');
  const [digestTime, setDigestTime] = useState(settings.daily_digest_time || '19:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User creation state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [newPhone, setNewPhone] = useState('');
  const [userCreatedMsg, setUserCreatedMsg] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) return;
    await addUser({
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      name: newName.trim(),
      role: newRole,
      phone: newPhone.trim(),
    });
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewPhone('');
    setUserCreatedMsg(true);
    setTimeout(() => setUserCreatedMsg(false), 3000);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'admin' || username === 'owner') {
      alert('Master admin/owner accounts cannot be removed.');
      return;
    }
    if (window.confirm(`Delete user account "${username}"?`)) {
      await deleteUser(id);
    }
  };

  const exportDataJSON = () => {
    const data = {
      exported_at: new Date().toISOString(),
      plant: 'Fly Ash Brick & Block Plant Management System',
      parties,
      inwards,
      outwards,
      jobs,
      expenses,
      employees,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flyash_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Settings & User Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage staff logins, role permissions, permanent Supabase database connection, and automated alerts
        </p>
      </div>

      {/* USER MANAGEMENT (Create login for data entry operators who cannot delete) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> User Accounts & Role Permissions
          </h3>
          <span className="text-xs text-slate-500">
            {canManageUsers ? 'Admin Access Granted' : 'View Only Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Create user accounts for plant staff and operators. Users with the <b>Data Entry Operator</b> role can add
          and edit all materials, production, and accounts data, but <b>cannot delete</b> any records from the database.
        </p>

        {/* Create User Form (Admin/Owner only) */}
        {canManageUsers ? (
          <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" /> Create New Staff Login
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh (Shift 1)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="e.g. operator1"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Assigned Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="operator">Operator (Enter/Edit Data, No Delete)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="owner">Plant Owner (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {userCreatedMsg ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> User account created successfully!
                </span>
              ) : <span />}
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4" /> You are logged in as <b>{currentUser?.name}</b> ({currentUser?.role}). Only Administrators or Owners can create and manage user accounts.
          </div>
        )}

        {/* Existing Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-2.5">User Name</th>
                <th className="px-4 py-2.5">Username / Login</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Delete Permission</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{u.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'owner'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.role === 'operator' ? 'Operator (Data Entry)' : u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' || u.role === 'owner' ? (
                      <span className="text-emerald-600 font-semibold">✓ Allowed (Can Delete)</span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Blocked (Cannot Delete)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {canDelete && u.username !== 'admin' && u.username !== 'owner' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Cloud Connection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" /> Permanent Supabase Database Connection
            </h3>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected Permanently
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Your database credentials are permanently locked and synced. All insertions, updates, and authorized deletions are saved directly to Supabase cloud PostgreSQL.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Permanent Database URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://laqpdlasfxearjtnnouu.supabase.co"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Public API Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="sb_publishable_..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Telegram Shift End Digest Automation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-sky-600" /> Telegram Shift End Digest Automation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCdefGHI..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Telegram Chat ID / Channel
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-100123456789"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Shift End Daily Digest Time
            </label>
            <input
              type="text"
              value={digestTime}
              onChange={(e) => setDigestTime(e.target.value)}
              className="w-40 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Backup & Save Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={exportDataJSON}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export All Data Backup (JSON)
          </button>
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Configuration saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
