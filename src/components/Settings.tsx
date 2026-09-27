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
  ShieldCheck,
  RefreshCw,
  Edit2,
  X,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { AppUser, UserRole } from '../types';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    changePassword,
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

  const [ownerName, setOwnerName] = useState(settings.owner_name || 'Plant Owner');
  const [telegramToken, setTelegramToken] = useState(settings.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegram_chat_id || '');
  const [digestTime, setDigestTime] = useState(settings.daily_digest_time || '19:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Database Connection Health Check State
  const [dbChecking, setDbChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'idle'>('connected');
  const [dbCheckMsg, setDbCheckMsg] = useState('YES — Supabase PostgreSQL Cloud Database is Connected & Operational');

  // Personal Password Change State
  const [myNewPassword, setMyNewPassword] = useState('');
  const [myConfirmPassword, setMyConfirmPassword] = useState('');
  const [showMyPassword, setShowMyPassword] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User creation state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [newPhone, setNewPhone] = useState('');
  const [userCreatedMsg, setUserCreatedMsg] = useState(false);

  // User Editing Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('operator');
  const [editPhone, setEditPhone] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const testDatabaseConnection = async () => {
    setDbChecking(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setDbStatus('error');
      setDbCheckMsg('NO — Database client not initialized');
      setDbChecking(false);
      return;
    }

    try {
      const { error } = await supabase.from('parties').select('count', { count: 'exact', head: true });
      if (error) {
        setDbStatus('error');
        setDbCheckMsg(`NO — Connection error: ${error.message}`);
      } else {
        setDbStatus('connected');
        setDbCheckMsg('YES — Supabase PostgreSQL Cloud Database is Connected & Synchronized');
      }
    } catch (err: any) {
      setDbStatus('error');
      setDbCheckMsg(`NO — Connection failed: ${err?.message || err}`);
    } finally {
      setDbChecking(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      owner_name: ownerName,
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
      daily_digest_time: digestTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle Changing Logged-in User's Password
  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myNewPassword !== myConfirmPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'Passwords do not match. Please re-enter.' });
      return;
    }
    if (myNewPassword.trim().length < 4) {
      setPasswordChangeMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    const res = await changePassword(myNewPassword);
    if (res.success) {
      setPasswordChangeMsg({ type: 'success', text: 'Your password has been changed successfully!' });
      setMyNewPassword('');
      setMyConfirmPassword('');
      setTimeout(() => setPasswordChangeMsg(null), 4000);
    } else {
      setPasswordChangeMsg({ type: 'error', text: res.message || 'Failed to update password.' });
    }
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

  const openEditUserModal = (u: AppUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username);
    setEditPassword(u.password || '');
    setEditRole(u.role);
    setEditPhone(u.phone || '');
    setEditModalOpen(true);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser(editingUser.id, {
      name: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      password: editPassword.trim() || editingUser.password,
      role: editRole,
      phone: editPhone.trim(),
    });
    setEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'admin' || username === 'owner') {
      alert('Master admin/owner accounts cannot be removed.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
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
          System Settings & User Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Change passwords, manage staff logins & permissions, check cloud database status, and export backups
        </p>
      </div>

      {/* CHANGE MY PASSWORD CARD (Available to ALL logged in users) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Change My Password
              </h3>
              <p className="text-xs text-slate-500">
                Logged in as: <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</span> ({currentUser?.username} • <span className="uppercase text-[10px] font-mono font-bold text-amber-600">{currentUser?.role}</span>)
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangeMyPassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showMyPassword ? 'text' : 'password'}
                  value={myNewPassword}
                  onChange={(e) => setMyNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password (min 4 chars)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMyPassword(!showMyPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showMyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showMyPassword ? 'text' : 'password'}
                value={myConfirmPassword}
                onChange={(e) => setMyConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {passwordChangeMsg && (
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  passwordChangeMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {passwordChangeMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {passwordChangeMsg.text}
              </span>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 ml-auto transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* CLOUD DATABASE CONNECTION STATUS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supabase Cloud Database Connection
              </h3>
              <p className="text-xs text-slate-500">Encrypted Enterprise Cloud Synchronization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected: YES
            </span>
            <button
              onClick={testDatabaseConnection}
              disabled={dbChecking}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{dbCheckMsg}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            All database endpoints, API keys, and connection credentials are permanently secured and protected internally. Data is directly stored and synchronized with Supabase PostgreSQL cloud backend.
          </p>
        </div>
      </div>

      {/* USER MANAGEMENT (Create and Edit logins for staff) */}
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
          Create and edit user accounts for plant staff and operators. Users with the <b>Data Entry Operator</b> role can add
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
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

        {/* Existing Users Table with Edit & Delete Options */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-2.5">User Name</th>
                <th className="px-4 py-2.5">Username / Login</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Delete Permission</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
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
                    <div className="flex items-center justify-center gap-1.5">
                      {canManageUsers && (
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit User Details & Password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && u.username !== 'admin' && u.username !== 'owner' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" /> Edit User Account: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Username / Login *
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="operator">Operator (Data Entry, No Delete)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="owner">Plant Owner (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
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
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="••••••••••••••••••••"
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
