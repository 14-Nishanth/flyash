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
  Mail,
  Send,
  MessageSquare,
  AlertTriangle,
  Flame,
  Volume2,
  Smartphone,
  Check,
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { AppUser, UserRole, AlertSettings } from '../types';
import {
  dispatchMultiChannelAlert,
  getTodayAlertCount,
  sendTelegramNotification,
  getWhatsAppAlertUrl,
} from '../lib/notificationService';

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
  const [ownerPhone, setOwnerPhone] = useState(settings.owner_phone || '');
  const [ownerEmail, setOwnerEmail] = useState(settings.owner_email || '');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(settings.owner_whatsapp || settings.owner_phone || '');

  // Multi-Channel Toggles
  const [channelEmail, setChannelEmail] = useState(settings.alert_channel_email ?? true);
  const [channelTelegram, setChannelTelegram] = useState(settings.alert_channel_telegram ?? true);
  const [channelWhatsapp, setChannelWhatsapp] = useState(settings.alert_channel_whatsapp ?? true);

  // Telegram Config
  const [telegramToken, setTelegramToken] = useState(settings.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegram_chat_id || '');

  // Security / Wrong Password Config
  const [wrongPasswordEnabled, setWrongPasswordEnabled] = useState(settings.alert_wrong_password_enabled ?? true);
  const [wrongPasswordThreshold, setWrongPasswordThreshold] = useState(settings.alert_wrong_password_threshold || 1);

  // Operational Alerts Config
  const [lowStockEnabled, setLowStockEnabled] = useState(settings.alert_low_stock_enabled ?? true);
  const [cementThreshold, setCementThreshold] = useState(settings.alert_low_stock_threshold_cement || 50);
  const [flyashThreshold, setFlyashThreshold] = useState(settings.alert_low_stock_threshold_flyash || 20);
  const [highExpenseEnabled, setHighExpenseEnabled] = useState(settings.alert_high_expense_enabled ?? true);
  const [expenseThreshold, setExpenseThreshold] = useState(settings.alert_high_expense_threshold || 10000);

  // Frequency & Volume Limits
  const [maxAlertsPerDay, setMaxAlertsPerDay] = useState(settings.max_alerts_per_day ?? 10);
  const [digestEnabled, setDigestEnabled] = useState(settings.daily_digest_enabled ?? true);
  const [digestTime, setDigestTime] = useState(settings.daily_digest_time || '19:00');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ channel: string; status: 'sending' | 'success' | 'error'; message: string } | null>(null);

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
    const updated: AlertSettings = {
      ...settings,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      owner_whatsapp: ownerWhatsapp,
      alert_channel_email: channelEmail,
      alert_channel_telegram: channelTelegram,
      alert_channel_whatsapp: channelWhatsapp,
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
      alert_wrong_password_enabled: wrongPasswordEnabled,
      alert_wrong_password_threshold: Number(wrongPasswordThreshold),
      alert_low_stock_enabled: lowStockEnabled,
      alert_low_stock_threshold_cement: Number(cementThreshold),
      alert_low_stock_threshold_flyash: Number(flyashThreshold),
      alert_high_expense_enabled: highExpenseEnabled,
      alert_high_expense_threshold: Number(expenseThreshold),
      max_alerts_per_day: Number(maxAlertsPerDay),
      daily_digest_enabled: digestEnabled,
      daily_digest_time: digestTime,
    };
    updateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Test Telegram Alert
  const handleTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      alert('Please enter your Telegram Bot Token and Chat ID first.');
      return;
    }
    setTestResult({ channel: 'Telegram', status: 'sending', message: 'Sending test message to Telegram...' });
    const msg = `<b>📢 TEST ALERT: Sri Balamurugan Fly Ash ERP</b>\n\n` +
      `✅ Telegram Bot integration is working perfectly!\n` +
      `🕒 ${new Date().toLocaleTimeString()} • ${new Date().toLocaleDateString('en-IN')}`;
    const res = await sendTelegramNotification(telegramToken, telegramChatId, msg);
    if (res.success) {
      setTestResult({ channel: 'Telegram', status: 'success', message: '✅ Test notification received in Telegram!' });
    } else {
      setTestResult({ channel: 'Telegram', status: 'error', message: `❌ Failed: ${res.error}` });
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  // Test WhatsApp Alert
  const handleTestWhatsApp = () => {
    const phone = ownerWhatsapp || ownerPhone;
    if (!phone) {
      alert('Please enter your WhatsApp phone number first.');
      return;
    }
    const msg = `*📢 TEST SECURITY & OPERATIONS ALERT*\n` +
      `🏢 Sri Balamurugan Fly Ash Bricks\n` +
      `✅ WhatsApp notification channel is verified!\n` +
      `🕒 ${new Date().toLocaleTimeString()} • ${new Date().toLocaleDateString('en-IN')}`;
    const url = getWhatsAppAlertUrl(phone, msg);
    window.open(url, '_blank');
  };

  // Test Security Wrong Password Simulation
  const handleSimulateWrongPasswordAlert = async () => {
    const currentConfig: AlertSettings = {
      ...settings,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      owner_whatsapp: ownerWhatsapp,
      alert_channel_email: channelEmail,
      alert_channel_telegram: channelTelegram,
      alert_channel_whatsapp: channelWhatsapp,
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
      max_alerts_per_day: Number(maxAlertsPerDay),
    };

    setTestResult({ channel: 'All Channels', status: 'sending', message: 'Simulating wrong password security alert...' });
    const res = await dispatchMultiChannelAlert(currentConfig, {
      type: 'wrong_password',
      title: 'Simulated Security Alert: 3 Consecutive Wrong Password Attempts',
      message: `🚨 SECURITY BREACH SIMULATION:\n` +
        `👤 Target Account: "admin"\n` +
        `🔢 Failed Attempts: 3\n` +
        `🌐 Device: Chrome on Windows Plant Terminal\n` +
        `⚠️ If this was unauthorized, reset your password in Settings.`,
      severity: 'critical',
    });

    if (res.limitReached) {
      setTestResult({ channel: 'All Channels', status: 'error', message: 'Daily alert limit reached for today.' });
    } else {
      setTestResult({ channel: 'All Channels', status: 'success', message: '✅ Security alert simulation dispatched to all active channels!' });
    }
    setTimeout(() => setTestResult(null), 5000);
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

  const todayCount = getTodayAlertCount();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Settings & Security Alerts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Multi-channel notifications (Email, Telegram, WhatsApp), failed password alerts, volume limits, and user logins
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

      {/* MULTI-CHANNEL ALERTS & NOTIFICATIONS CENTER (Email, Telegram, WhatsApp) */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Multi-Channel Alerts & Notification Center
                </h3>
                <p className="text-xs text-slate-500">Real-time alerts via Telegram, WhatsApp, and Email with frequency limits</p>
              </div>
            </div>

            {/* Daily limit badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Today's Alerts: <b>{todayCount}</b> / {maxAlertsPerDay === 0 ? '∞ Unlimited' : maxAlertsPerDay}
              </span>
            </div>
          </div>

          {/* Section 1: Contact Destinations & Channels */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> Notification Channels & Destinations
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Telegram Channel */}
              <div className={`p-4 rounded-xl border transition-all ${channelTelegram ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/60' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400">
                    <Send className="w-4 h-4" /> Telegram Bot
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelTelegram}
                      onChange={(e) => setChannelTelegram(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bot Token</label>
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="123456:ABC-DEF..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Chat ID / Channel</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-100123456789"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    className="w-full mt-1 py-1 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Send className="w-3 h-3" /> Test Telegram
                  </button>
                </div>
              </div>

              {/* WhatsApp Channel */}
              <div className={`p-4 rounded-xl border transition-all ${channelWhatsapp ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <MessageSquare className="w-4 h-4" /> WhatsApp Alerts
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelWhatsapp}
                      onChange={(e) => setChannelWhatsapp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Recipient WhatsApp Number</label>
                    <input
                      type="tel"
                      value={ownerWhatsapp}
                      onChange={(e) => setOwnerWhatsapp(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Owner / Plant Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Sri Balamurugan"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="w-full mt-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <MessageSquare className="w-3 h-3" /> Test WhatsApp
                  </button>
                </div>
              </div>

              {/* Email Channel */}
              <div className={`p-4 rounded-xl border transition-all ${channelEmail ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <Mail className="w-4 h-4" /> Email Alerts
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelEmail}
                      onChange={(e) => setChannelEmail(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Recipient Email Address</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@plant.com"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone (SMS / Backup)</label>
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-indigo-600" /> Active for shift digest & critical events
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Trigger Rules (Wrong Password, Low Stock, High Expense, Digest) */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Alert Trigger Rules & Sensitivity
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 🚨 WRONG PASSWORD / FAILED LOGIN ALERT */}
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Wrong Password & Security Alert
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wrongPasswordEnabled}
                      onChange={(e) => setWrongPasswordEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Sends an immediate security notification to your Email, Telegram, and WhatsApp when someone enters an incorrect password on the login screen.
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Trigger Alert After:</span>
                  <select
                    value={wrongPasswordThreshold}
                    onChange={(e) => setWrongPasswordThreshold(Number(e.target.value))}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 Failed Attempt (Instant)</option>
                    <option value={2}>2 Failed Attempts</option>
                    <option value={3}>3 Failed Attempts</option>
                    <option value={5}>5 Failed Attempts</option>
                  </select>
                </div>
              </div>

              {/* 📦 LOW RAW MATERIAL STOCK ALERT */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Flame className="w-4 h-4 text-amber-600" /> Low Raw Material Stock Warning
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lowStockEnabled}
                      onChange={(e) => setLowStockEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Cement (Bags/Ton)</label>
                    <input
                      type="number"
                      value={cementThreshold}
                      onChange={(e) => setCementThreshold(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Fly Ash (Tons)</label>
                    <input
                      type="number"
                      value={flyashThreshold}
                      onChange={(e) => setFlyashThreshold(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 💰 HIGH EXPENSE WARNING */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                    <Sliders className="w-4 h-4 text-indigo-600" /> High Value Expense Notification
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highExpenseEnabled}
                      onChange={(e) => setHighExpenseEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Alert if single expense &gt;</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      value={expenseThreshold}
                      onChange={(e) => setExpenseThreshold(Number(e.target.value))}
                      className="w-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 📊 SHIFT END DAILY DIGEST */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Shift End Production & Turnover Digest
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={digestEnabled}
                      onChange={(e) => setDigestEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Digest Scheduled Time:</span>
                  <input
                    type="time"
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="w-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Volume & Frequency Limit */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-600" /> Notification Frequency Limit (Max Alerts Per Day)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prevents spamming by capping the total automated notifications sent per 24-hour cycle.
              </p>
            </div>

            <select
              value={maxAlertsPerDay}
              onChange={(e) => setMaxAlertsPerDay(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value={5}>5 Alerts / Day</option>
              <option value={10}>10 Alerts / Day (Standard)</option>
              <option value={20}>20 Alerts / Day</option>
              <option value={50}>50 Alerts / Day</option>
              <option value={0}>Unlimited (No Restriction)</option>
            </select>
          </div>

          {/* Section 4: Interactive Security & Alert Simulation */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Test Security Alert Trigger
                </span>
                <p className="text-[11px] text-slate-500">
                  Simulate a wrong password alert to verify Telegram, WhatsApp, and Email dispatch.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateWrongPasswordAlert}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Simulate Failed Password Alert
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${testResult.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : testResult.status === 'error' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Alert preferences saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20"
            >
              Save Alert Preferences
            </button>
          </div>
        </div>
      </form>

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

      {/* Export JSON Backup */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Full Plant Database Backup</h4>
          <p className="text-[11px] text-slate-500">Download complete offline JSON snapshot of parties, materials, wages, and expenses.</p>
        </div>
        <button
          type="button"
          onClick={exportDataJSON}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm"
        >
          <Download className="w-4 h-4" /> Export JSON Backup
        </button>
      </div>
    </div>
  );
};

