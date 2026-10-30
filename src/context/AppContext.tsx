import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Party,
  MaterialInward,
  MaterialOutward,
  Payment,
  PartyAdjustment,
  JobWageEntry,
  Employee,
  AttendanceRecord,
  Expense,
  AlertSettings,
  AppUser,
  UserRole,
  WorkerGroup,
  ProductRateMaster,
} from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { CLOUD_COLLECTIONS, CloudCollection, getCloudRole, hasCloudAccess, readCloudRecords, sanitizeCloudRecord, saveCloudRecord, softDeleteCloudRecord } from '../lib/cloudRecords';
import { trackFailedLoginAttempt, resetFailedLoginAttempts } from '../lib/notificationService';

export interface UserSession {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
}

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentUser: UserSession | null;
  canDelete: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (id: string, user: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  parties: Party[];
  inwards: MaterialInward[];
  outwards: MaterialOutward[];
  payments: Payment[];
  partyAdjustments: PartyAdjustment[];
  jobs: JobWageEntry[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  expenses: Expense[];
  workerGroups: WorkerGroup[];
  productRates: ProductRateMaster[];
  settings: AlertSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Parties CRUD
  addParty: (party: Omit<Party, 'id' | 'created_at'>) => Promise<void>;
  updateParty: (id: string, party: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<boolean>;
  // Party Adjustments / Vouchers CRUD
  addPartyAdjustment: (adj: Omit<PartyAdjustment, 'id' | 'created_at'>) => Promise<void>;
  updatePartyAdjustment: (id: string, adj: Partial<PartyAdjustment>) => Promise<void>;
  deletePartyAdjustment: (id: string) => Promise<boolean>;
  // Inward CRUD
  addInward: (inward: Omit<MaterialInward, 'id' | 'created_at'>) => Promise<void>;
  updateInward: (id: string, inward: Partial<MaterialInward>) => Promise<void>;
  deleteInward: (id: string) => Promise<boolean>;
  // Outward CRUD
  addOutward: (outward: Omit<MaterialOutward, 'id' | 'created_at'>) => Promise<void>;
  updateOutward: (id: string, outward: Partial<MaterialOutward>) => Promise<void>;
  deleteOutward: (id: string) => Promise<boolean>;
  // Payments CRUD
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<boolean>;
  // Production / Jobs CRUD
  addJob: (job: Omit<JobWageEntry, 'id' | 'created_at'>) => Promise<void>;
  updateJob: (id: string, job: Partial<JobWageEntry>) => Promise<void>;
  deleteJob: (id: string) => Promise<boolean>;
  // Employees CRUD
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<boolean>;
  // Attendance CRUD
  saveAttendance: (date: string, records: { employee_id: string; status: any; notes?: string }[]) => Promise<void>;
  deleteAttendanceForDate: (date: string) => Promise<boolean>;
  // Expenses CRUD
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<boolean>;
  // Worker Groups CRUD
  addGroup: (group: Omit<WorkerGroup, 'id' | 'created_at'>) => Promise<void>;
  updateGroup: (id: string, group: Partial<WorkerGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<boolean>;
  // Product Rates Master CRUD
  addProductRate: (prod: Omit<ProductRateMaster, 'id' | 'created_at'>) => Promise<void>;
  updateProductRate: (id: string, prod: Partial<ProductRateMaster>) => Promise<void>;
  deleteProductRate: (id: string) => Promise<boolean>;
  // Utilities
  updateSettings: (newSettings: AlertSettings) => void;
  calculatePartyBalance: (partyId: string) => number;
  getRawMaterialStock: () => { [mat: string]: { quantity: number; unit: string; secondaryInfo?: string } };
  getProductStock: () => { [prod: string]: { produced: number; dispatched: number; stock: number } };
  calculateGroupWageDistribution: (groupId: string, totalWageAmount: number, overrideWorkerIds?: string[]) => { workerId: string; wage: number }[];
  // Duplicate check
  checkDuplicate: (type: 'party' | 'inward' | 'outward' | 'payment' | 'adjustment' | 'expense' | 'job' | 'employee' | 'group' | 'product_rate', data: any, excludeId?: string) => { isDuplicate: boolean; details?: string };
  // Multi-Device Cloud Synchronization
  syncWithCloud: () => Promise<boolean>;
  isSyncing: boolean;
  lastSyncedTime: string | null;
  syncError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


const DEFAULT_PRODUCT_RATES: ProductRateMaster[] = [
  {
    id: 'pr-1',
    name: 'Fly Ash Brick 9x4x3',
    category: 'Brick',
    size: '9" × 4" × 3"',
    unit: 'Pieces',
    labor_rate_per_unit: 0.60,
    selling_rate_per_unit: 5.50,
    pieces_per_tray: 105,
    wastage_per_tray: 5,
    opening_stock: 5000,
    notes: 'Standard high-density fly ash brick',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-2',
    name: 'Solid Block 4"',
    category: 'Solid Block',
    size: '4" (400×200×100mm)',
    unit: 'Pieces',
    labor_rate_per_unit: 1.20,
    selling_rate_per_unit: 28.00,
    pieces_per_tray: 48,
    wastage_per_tray: 2,
    opening_stock: 2000,
    notes: '4 inch partition solid block',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-3',
    name: 'Solid Block 6"',
    category: 'Solid Block',
    size: '6" (400×200×150mm)',
    unit: 'Pieces',
    labor_rate_per_unit: 1.50,
    selling_rate_per_unit: 36.00,
    pieces_per_tray: 36,
    wastage_per_tray: 2,
    opening_stock: 1800,
    notes: '6 inch load bearing solid block',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-4',
    name: 'Solid Block 6x8"',
    category: 'Solid Block',
    size: '6" × 8"',
    unit: 'Pieces',
    labor_rate_per_unit: 1.80,
    selling_rate_per_unit: 42.00,
    pieces_per_tray: 30,
    wastage_per_tray: 1,
    opening_stock: 1200,
    notes: '6x8 inch concrete block',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-5',
    name: 'Solid Block 8x8"',
    category: 'Solid Block',
    size: '8" × 8"',
    unit: 'Pieces',
    labor_rate_per_unit: 2.20,
    selling_rate_per_unit: 50.00,
    pieces_per_tray: 24,
    wastage_per_tray: 1,
    opening_stock: 1000,
    notes: '8x8 inch heavy duty foundation block',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-6',
    name: 'Solid Block 9x9"',
    category: 'Solid Block',
    size: '9" × 9"',
    unit: 'Pieces',
    labor_rate_per_unit: 2.50,
    selling_rate_per_unit: 58.00,
    pieces_per_tray: 20,
    wastage_per_tray: 1,
    opening_stock: 800,
    notes: '9x9 inch structural column block',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-7',
    name: 'M-Sand (Manufactured Sand)',
    category: 'Sand & Aggregate',
    size: '0-4.75mm Graded',
    unit: 'Tons',
    labor_rate_per_unit: 0,
    selling_rate_per_unit: 1250,
    pieces_per_tray: 0,
    wastage_per_tray: 0,
    opening_stock: 50,
    notes: 'High quality concrete M-Sand',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-8',
    name: 'P-Sand (Plastering Sand)',
    category: 'Sand & Aggregate',
    size: '0-2.36mm Fine',
    unit: 'Tons',
    labor_rate_per_unit: 0,
    selling_rate_per_unit: 1450,
    pieces_per_tray: 0,
    wastage_per_tray: 0,
    opening_stock: 35,
    notes: 'Triple washed plastering sand',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pr-9',
    name: 'Quarry Dust',
    category: 'Sand & Aggregate',
    size: 'Fine Aggregate Dust',
    unit: 'Tons',
    labor_rate_per_unit: 0,
    selling_rate_per_unit: 850,
    pieces_per_tray: 0,
    wastage_per_tray: 0,
    opening_stock: 60,
    notes: 'Base blue metal stone dust',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_WORKER_GROUPS: WorkerGroup[] = [
  {
    id: 'grp-1',
    name: 'Production Gang 1 (Press Team)',
    description: 'Automatic brick & block machine press operators and feed loaders',
    member_ids: ['1', '2'],
    split_type: 'equal',
    member_shares: { '1': 1.0, '2': 1.0 },
    created_at: new Date().toISOString(),
  },
  {
    id: 'grp-2',
    name: 'Gang 2 (Stacking & Curing Team)',
    description: 'Pallet unloading, curing yard stacking, and dispatch helpers',
    member_ids: ['1'],
    split_type: 'equal',
    member_shares: { '1': 1.0 },
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: AlertSettings = {
  owner_name: 'Plant Owner',
  owner_phone: '',
  owner_email: '',
  owner_whatsapp: '',
  alert_channel_email: false,
  alert_channel_telegram: true,
  alert_channel_whatsapp: true,
  telegram_bot_token: '',
  telegram_chat_id: '',
  alert_wrong_password_enabled: true,
  alert_wrong_password_threshold: 1,
  alert_new_login_enabled: false,
  alert_low_stock_enabled: true,
  alert_low_stock_threshold_cement: 50,
  alert_low_stock_threshold_flyash: 20,
  alert_high_expense_enabled: true,
  alert_high_expense_threshold: 10000,
  max_alerts_per_day: 10,
  daily_digest_enabled: true,
  daily_digest_time: '19:00',
};

// Universal RFC4122 v4 UUID generator (works on all mobile & desktop browsers)
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUuid(id: any): boolean {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Database payload sanitizers (matches Supabase PostgreSQL schema exactly)
function sanitizePartyForDb(p: any) {
  return {
    id: isValidUuid(p.id) ? p.id : generateUuid(),
    name: p.name || 'Unnamed Party',
    party_type: p.party_type || 'customer',
    phone: p.phone || '',
    address: p.address || '',
    gstin: p.gstin || '',
    opening_balance: Number(p.opening_balance) || 0,
    created_at: p.created_at || new Date().toISOString(),
  };
}

function sanitizeExpenseForDb(e: any) {
  let notes = e.notes || '';
  if (e.material_type && !notes.includes(e.material_type)) {
    const meta = `[${e.material_type} | ${e.quantity || ''} ${e.unit || ''} @ ₹${e.rate || ''} | Status: ${e.payment_status || 'unpaid'}]`;
    notes = notes ? `${meta} ${notes}` : meta;
  }
  return {
    id: isValidUuid(e.id) ? e.id : generateUuid(),
    date: e.date || new Date().toISOString().split('T')[0],
    category: e.category || 'General Expense',
    title: e.title || 'Expense',
    amount: Number(e.amount) || 0,
    payment_mode: e.payment_mode || e.mode || 'cash',
    paid_to: e.paid_to || '',
    reference_no: e.reference_no || e.ref || '',
    notes,
    created_at: e.created_at || new Date().toISOString(),
  };
}

function sanitizePaymentForDb(p: any) {
  return {
    id: isValidUuid(p.id) ? p.id : generateUuid(),
    date: p.date || new Date().toISOString().split('T')[0],
    party_id: isValidUuid(p.party_id) ? p.party_id : null,
    party_name: p.party_name || '',
    payment_type: p.payment_type || 'received',
    amount: Number(p.amount) || 0,
    mode: p.mode || p.payment_mode || 'cash',
    reference_no: p.reference_no || p.ref || '',
    notes: p.notes || '',
    created_at: p.created_at || new Date().toISOString(),
  };
}

function sanitizeInwardForDb(i: any) {
  const numPartyId = Number(i.party_id);
  const payload: any = {
    date: i.date || new Date().toISOString().split('T')[0],
    party_id: !isNaN(numPartyId) && numPartyId > 0 ? numPartyId : 1,
    material_type: i.material_type || 'Fly Ash',
    quantity_mt: Number(i.quantity_mt) || 0,
    quantity_unit: i.quantity_unit || 'Ton',
    vehicle_no: i.vehicle_no || '',
    rate: Number(i.rate) || 0,
    amount: Number(i.amount) || 0,
    notes: i.party_name && !i.notes?.includes(i.party_name)
      ? `[Party: ${i.party_name}] ${i.notes || ''}`.trim()
      : (i.notes || ''),
  };
  if (typeof i.id === 'number') {
    payload.id = i.id;
  }
  return payload;
}

function sanitizeOutwardForDb(o: any) {
  const numPartyId = Number(o.party_id);
  const payload: any = {
    date: o.date || new Date().toISOString().split('T')[0],
    party_id: !isNaN(numPartyId) && numPartyId > 0 ? numPartyId : null,
    material_type: o.material_type || 'Fly Ash Bricks 9x4x3',
    quantity_mt: Number(o.quantity_mt) || 0,
    quantity_unit: o.quantity_unit || 'Pieces',
    vehicle_no: o.vehicle_no || '',
    rate: Number(o.rate) || 0,
    amount: Number(o.amount) || 0,
    notes: o.party_name && !o.notes?.includes(o.party_name)
      ? `[Customer: ${o.party_name}] ${o.notes || ''}`.trim()
      : (o.notes || ''),
  };
  if (typeof o.id === 'number') {
    payload.id = o.id;
  }
  return payload;
}

function sanitizeJobForDb(j: any) {
  return {
    id: isValidUuid(j.id) ? j.id : generateUuid(),
    date: j.date || new Date().toISOString().split('T')[0],
    group_name: j.group_name || '',
    job_type: j.job_type || 'Production',
    product_name: j.product_name || 'Brick 9x4x3',
    tray_count: Number(j.tray_count) || 0,
    pieces_per_tray: Number(j.pieces_per_tray) || 105,
    wastage_per_tray: Number(j.wastage_per_tray) || 5,
    total_wastage: Number(j.total_wastage) || 0,
    gross_quantity: Number(j.gross_quantity) || 0,
    quantity: Number(j.quantity) || 0,
    rate_per_unit: Number(j.rate_per_unit) || 0.60,
    gross_amount: Number(j.gross_amount) || 0,
    wastage_amount: Number(j.wastage_amount) || 0,
    total_amount: Number(j.total_amount) || 0,
    worker_count: Number(j.worker_count) || 1,
    wage_per_worker: Number(j.wage_per_worker) || 0,
    worker_ids: Array.isArray(j.worker_ids) ? j.worker_ids.filter((id: unknown) => typeof id === 'string') : [],
    vehicle_no: j.vehicle_no || '',
    notes: j.notes || '',
    created_at: j.created_at || new Date().toISOString(),
  };
}

function sanitizeEmployeeForDb(emp: any) {
  return {
    id: isValidUuid(emp.id) ? emp.id : generateUuid(),
    name: emp.name || 'Worker',
    phone: emp.phone || '',
    role: emp.role || 'Laborer',
    daily_wage: Number(emp.daily_wage) || 0,
    joining_date: emp.joining_date || new Date().toISOString().split('T')[0],
    is_active: emp.is_active ?? true,
    created_at: emp.created_at || new Date().toISOString(),
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set Light theme as default
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('flyash_theme') as 'dark' | 'light') || 'light');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Cloud sync status state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncInFlightRef = useRef(false);

  // Authentication Session - Requires login on every open/load per user preference
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // User Accounts
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('flyash_users');
    if (!saved) return [];
    try { return (JSON.parse(saved) as AppUser[]).map(({ password: _password, ...safeUser }) => safeUser); } catch { return []; }
  });

  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem('flyash_parties');
    return saved ? JSON.parse(saved) : [];
  });

  const [inwards, setInwards] = useState<MaterialInward[]>(() => {
    const saved = localStorage.getItem('flyash_inwards');
    return saved ? JSON.parse(saved) : [];
  });

  const [outwards, setOutwards] = useState<MaterialOutward[]>(() => {
    const saved = localStorage.getItem('flyash_outwards');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('flyash_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [partyAdjustments, setPartyAdjustments] = useState<PartyAdjustment[]>(() => {
    const saved = localStorage.getItem('flyash_party_adjustments');
    return saved ? JSON.parse(saved) : [];
  });

  const [jobs, setJobs] = useState<JobWageEntry[]>(() => {
    const saved = localStorage.getItem('flyash_jobs');
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('flyash_employees');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Muthu', role: 'Machine Operator', daily_wage: 700, joining_date: '2026-01-01', is_active: true },
      { id: '2', name: 'Kumar', role: 'Laborer', daily_wage: 500, joining_date: '2026-01-01', is_active: true },
    ];
  });

  const [workerGroups, setWorkerGroups] = useState<WorkerGroup[]>(() => {
    const saved = localStorage.getItem('flyash_worker_groups');
    return saved ? JSON.parse(saved) : DEFAULT_WORKER_GROUPS;
  });

  const [productRates, setProductRates] = useState<ProductRateMaster[]>(() => {
    const saved = localStorage.getItem('flyash_product_rates');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCT_RATES;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('flyash_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('flyash_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem('flyash_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Role permissions: Only Admin or Owner can delete data or manage users
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const canDelete = isAdmin;
  const canEdit = isAdmin || currentUser?.role === 'manager';
  const canManageUsers = isAdmin;
  const assertCanEdit = (label = 'business records') => {
    if (!canEdit) throw new Error(`Access denied: only Admin or Manager can edit ${label}.`);
  };

  // Shared data requires a real Supabase Auth identity; browser-only demo credentials cannot sync securely.
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const email = username.trim().toLowerCase();
    if (!email.includes('@')) return { success: false, error: 'Use your company email address. Local demo accounts cannot access shared cloud data.' };
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Cloud database is not configured. Check the Supabase URL and publishable key.' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return { success: false, error: error?.message || 'Sign-in failed. Check your email and password.' };
      if (!hasCloudAccess(data.user)) {
        await supabase.auth.signOut();
        return { success: false, error: 'This account is not enabled for FlyAsh cloud access. An administrator must set app_metadata.flyash_access=true and assign a role in Supabase.' };
      }
      resetFailedLoginAttempts();
      const session: UserSession = { id: data.user.id, username: data.user.email || email, name: data.user.user_metadata?.name || data.user.email || 'Plant Staff', role: getCloudRole(data.user), phone: data.user.user_metadata?.phone };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      void refreshUsers(data.user);
      setSyncError(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unexpected sign-in error.' };
    }
  };

  const logout = () => {
    const supabase = getSupabaseClient();
    if (supabase) void supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('flyash_user_session');
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('flyash_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('flyash_parties', JSON.stringify(parties));
  }, [parties]);
  useEffect(() => {
    localStorage.setItem('flyash_inwards', JSON.stringify(inwards));
  }, [inwards]);
  useEffect(() => {
    localStorage.setItem('flyash_outwards', JSON.stringify(outwards));
  }, [outwards]);
  useEffect(() => {
    localStorage.setItem('flyash_payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem('flyash_party_adjustments', JSON.stringify(partyAdjustments));
  }, [partyAdjustments]);
  useEffect(() => {
    localStorage.setItem('flyash_jobs', JSON.stringify(jobs));
  }, [jobs]);
  useEffect(() => {
    localStorage.setItem('flyash_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('flyash_worker_groups', JSON.stringify(workerGroups));
  }, [workerGroups]);
  useEffect(() => {
    localStorage.setItem('flyash_product_rates', JSON.stringify(productRates));
  }, [productRates]);
  useEffect(() => {
    localStorage.setItem('flyash_attendance', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('flyash_expenses', JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem('flyash_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle Theme
  useEffect(() => {
    localStorage.setItem('flyash_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const pendingWritesKey = 'flyash_pending_cloud_writes';
  type PendingCloudWrite = { collection: CloudCollection; id: string; data?: Record<string, unknown>; deleted: boolean };
  const updatePendingWrite = (entry: PendingCloudWrite) => {
    try { const pending = JSON.parse(localStorage.getItem(pendingWritesKey) || '[]') as PendingCloudWrite[]; localStorage.setItem(pendingWritesKey, JSON.stringify([...pending.filter((x) => !(x.collection === entry.collection && x.id === entry.id)), entry])); }
    catch (error) { console.error('Could not queue cloud write:', error); }
  };
  const clearPendingWrite = (collection: CloudCollection, id: string) => {
    try { const pending = JSON.parse(localStorage.getItem(pendingWritesKey) || '[]') as PendingCloudWrite[]; localStorage.setItem(pendingWritesKey, JSON.stringify(pending.filter((x) => !(x.collection === collection && x.id === id)))); }
    catch (error) { console.error('Could not clear queued cloud write:', error); }
  };
  const persistRecord = async (collection: CloudCollection, record: Record<string, unknown>) => {
    const cloudRecord = sanitizeCloudRecord(collection, record);
    const id = String(cloudRecord.id ?? '');
    if (!id) { setSyncError(`Cannot sync ${collection}: record ID is missing.`); return false; }
    const supabase = getSupabaseClient();
    if (!supabase) { updatePendingWrite({ collection, id, data: cloudRecord, deleted: false }); setSyncError('Cloud database is not configured. Changes are queued on this device.'); return false; }
    try { await saveCloudRecord(supabase, collection, cloudRecord); clearPendingWrite(collection, id); setSyncError(null); return true; }
    catch (error) {
      updatePendingWrite({ collection, id, data: cloudRecord, deleted: false });
      const message = error instanceof Error ? error.message : 'Could not save the change to the cloud.';
      setSyncError(`${message} The change is queued on this device and will retry.`);
      console.error('Cloud save failed:', message); return false;
    }
  };
  const removeCloudRecord = async (collection: CloudCollection, id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) { updatePendingWrite({ collection, id, deleted: true }); setSyncError('Cloud database is not configured. The delete is queued on this device.'); return false; }
    try { await softDeleteCloudRecord(supabase, collection, id); clearPendingWrite(collection, id); setSyncError(null); return true; }
    catch (error) {
      updatePendingWrite({ collection, id, deleted: true });
      const message = error instanceof Error ? error.message : 'Could not delete the record from the cloud.';
      setSyncError(`${message} The delete is queued on this device and will retry.`);
      console.error('Cloud delete failed:', message); return false;
    }
  };

  const syncWithCloud = async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) { setSyncError('Cloud database is not configured.'); return false; }
    if (syncInFlightRef.current) return false;
    syncInFlightRef.current = true; setIsSyncing(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Cloud authentication failed: ${authError.message}`);
      if (!authData.user || !hasCloudAccess(authData.user)) throw new Error('Sign in with an authorized company account to sync across devices.');
      let pending: PendingCloudWrite[] = [];
      try { pending = JSON.parse(localStorage.getItem(pendingWritesKey) || '[]'); } catch { pending = []; }
      for (const item of pending) {
        try {
          if (item.deleted) await softDeleteCloudRecord(supabase, item.collection, item.id);
          else if (item.data) await saveCloudRecord(supabase, item.collection, item.data);
          clearPendingWrite(item.collection, item.id);
        } catch (error) { setSyncError(error instanceof Error ? error.message : 'A queued change could not be synchronized.'); }
      }
      const rows = await readCloudRecords(supabase);
      const rowKeys = new Set(rows.map((row) => `${row.collection}::${row.id}`));
      const byCollection = new Map<CloudCollection, typeof rows>();
      for (const collection of CLOUD_COLLECTIONS) byCollection.set(collection, rows.filter((row) => row.collection === collection));
      const local: Record<CloudCollection, Record<string, unknown>[]> = {
        parties: parties as unknown as Record<string, unknown>[], inwards: inwards as unknown as Record<string, unknown>[],
        outwards: outwards as unknown as Record<string, unknown>[], payments: payments as unknown as Record<string, unknown>[],
        partyAdjustments: partyAdjustments as unknown as Record<string, unknown>[], jobs: jobs as unknown as Record<string, unknown>[],
        employees: employees as unknown as Record<string, unknown>[], attendance: attendance as unknown as Record<string, unknown>[],
        expenses: expenses as unknown as Record<string, unknown>[], workerGroups: workerGroups as unknown as Record<string, unknown>[],
        productRates: productRates as unknown as Record<string, unknown>[], settings: [sanitizeCloudRecord('settings', { ...settings, id: 'global' })],
      };
      const merged = {} as Record<CloudCollection, Record<string, unknown>[]>;
      for (const collection of CLOUD_COLLECTIONS) {
        const collectionRows = byCollection.get(collection) || [];
        const activeCloud = collectionRows.filter((row) => !row.deleted_at).map((row) => ({ ...(row.data || {}), id: String(row.id) }));
        const localOnly = local[collection].filter((record) => {
          const id = record.id == null ? '' : String(record.id);
          return id !== '' && !rowKeys.has(`${collection}::${id}`);
        });
        for (const record of localOnly) await saveCloudRecord(supabase, collection, record);
        merged[collection] = [...activeCloud, ...localOnly];
      }
      setParties(merged.parties as unknown as Party[]);
      setInwards(merged.inwards.map((r) => ({ ...r, id: String(r.id), party_id: String(r.party_id ?? '') })) as unknown as MaterialInward[]);
      setOutwards(merged.outwards.map((r) => ({ ...r, id: String(r.id), party_id: r.party_id == null ? undefined : String(r.party_id) })) as unknown as MaterialOutward[]);
      setPayments(merged.payments as unknown as Payment[]); setPartyAdjustments(merged.partyAdjustments as unknown as PartyAdjustment[]);
      setJobs(merged.jobs as unknown as JobWageEntry[]); setEmployees(merged.employees as unknown as Employee[]);
      setAttendance(merged.attendance.map((r) => ({ ...r, id: String(r.id), employee_id: String(r.employee_id ?? '') })) as unknown as AttendanceRecord[]);
      setExpenses(merged.expenses as unknown as Expense[]); setWorkerGroups(merged.workerGroups as unknown as WorkerGroup[]);
      setProductRates(merged.productRates as unknown as ProductRateMaster[]);
      if (merged.settings.length > 0) {
        const cloudSettings = merged.settings[0] as unknown as AlertSettings & { id?: string };
        const { id: _ignored, ...withoutId } = cloudSettings;
        // Provider credentials remain device-local and are never copied into the shared cloud record.
        setSettings({
          ...DEFAULT_SETTINGS,
          ...withoutId,
          supabase_url: settings.supabase_url,
          supabase_anon_key: settings.supabase_anon_key,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_chat_id: settings.telegram_chat_id,
          email_service_id: settings.email_service_id,
          email_template_id: settings.email_template_id,
          email_public_key: settings.email_public_key,
        });
      }
      setLastSyncedTime(new Date().toLocaleTimeString('en-IN'));
      const remaining = JSON.parse(localStorage.getItem(pendingWritesKey) || '[]') as PendingCloudWrite[];
      if (remaining.length === 0) setSyncError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cloud sync failed unexpectedly.';
      setSyncError(message); console.error('FlyAsh cloud sync failed:', message); return false;
    } finally { syncInFlightRef.current = false; setIsSyncing(false); }
  };

  const syncWithCloudRef = useRef(syncWithCloud);
  syncWithCloudRef.current = syncWithCloud;

  useEffect(() => {
    const supabase = getSupabaseClient(); if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) { setSyncError(`Could not restore sign-in session: ${error.message}`); return; }
      const user = data.session?.user;
      if (user && hasCloudAccess(user)) {
        setCurrentUser({ id: user.id, username: user.email || '', name: user.user_metadata?.name || user.email || 'Plant Staff', role: getCloudRole(user), phone: user.user_metadata?.phone });
        void refreshUsers(user);
        void syncWithCloudRef.current();
      } else setCurrentUser(null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user;
      if (user && hasCloudAccess(user)) {
        setCurrentUser({ id: user.id, username: user.email || '', name: user.user_metadata?.name || user.email || 'Plant Staff', role: getCloudRole(user), phone: user.user_metadata?.phone });
        // Defer Supabase API calls until the Auth callback releases its internal lock.
        window.setTimeout(() => {
          if (active) {
            void refreshUsers(user);
            void syncWithCloudRef.current();
          }
        }, 0);
      } else setCurrentUser(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient(); if (!supabase) return;
    let channel: any = null;
    try {
      channel = supabase.channel('flyash-app-records-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_records' }, () => { void syncWithCloudRef.current(); })
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncError('Realtime is unavailable. Automatic refresh will retry; check the Supabase Realtime publication if this persists.');
        });
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Realtime subscription could not start.'); }
    const focus = () => { void syncWithCloudRef.current(); };
    const visibility = () => { if (document.visibilityState === 'visible') void syncWithCloudRef.current(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visibility);
    const interval = window.setInterval(() => { void syncWithCloudRef.current(); }, 30000);
    return () => {
      if (channel) void supabase.removeChannel(channel);
      window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); window.clearInterval(interval);
    };
  }, []);

  // Dynamic Group Wage Split Calculator
  const calculateGroupWageDistribution = (
    groupId: string,
    totalWageAmount: number,
    overrideWorkerIds?: string[]
  ): { workerId: string; wage: number }[] => {
    const group = workerGroups.find((g) => g.id === groupId);
    const workerIds = overrideWorkerIds && overrideWorkerIds.length > 0
      ? overrideWorkerIds
      : group?.member_ids || [];

    if (workerIds.length === 0) return [];

    if (!group || group.split_type === 'equal') {
      const perWorker = totalWageAmount / workerIds.length;
      return workerIds.map((id) => ({ workerId: id, wage: perWorker }));
    }

    // Shares based
    let totalShares = 0;
    workerIds.forEach((id) => {
      const share = group.member_shares?.[id] || 1.0;
      totalShares += share;
    });

    if (totalShares === 0) totalShares = 1;

    return workerIds.map((id) => {
      const share = group.member_shares?.[id] || 1.0;
      return {
        workerId: id,
        wage: (totalWageAmount * share) / totalShares,
      };
    });
  };

  // Duplicate Check Helper
  const checkDuplicate = (
    type: 'party' | 'inward' | 'outward' | 'payment' | 'adjustment' | 'expense' | 'job' | 'employee' | 'group' | 'product_rate',
    data: any,
    excludeId?: string
  ): { isDuplicate: boolean; details?: string } => {
    if (type === 'party') {
      const match = parties.find(
        (p) =>
          p.id !== excludeId &&
          (p.name.trim().toLowerCase() === data.name?.trim().toLowerCase() ||
            (data.phone && p.phone && p.phone.trim() === data.phone.trim()))
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Party "${match.name}" already exists with phone: ${match.phone || 'N/A'}.`,
        };
      }
    }

    if (type === 'inward') {
      const match = inwards.find(
        (i) =>
          i.id !== excludeId &&
          i.date === data.date &&
          ((data.vehicle_no && i.vehicle_no && i.vehicle_no.trim().toUpperCase() === data.vehicle_no.trim().toUpperCase()) ||
            (i.party_id === data.party_id && i.material_type === data.material_type && Number(i.quantity_mt) === Number(data.quantity_mt)))
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Inward for ${match.material_type} (${match.quantity_mt} ${match.quantity_unit}) on ${match.date} with vehicle "${match.vehicle_no || 'N/A'}" already recorded.`,
        };
      }
    }

    if (type === 'outward') {
      const match = outwards.find(
        (o) =>
          o.id !== excludeId &&
          o.date === data.date &&
          ((data.vehicle_no && o.vehicle_no && o.vehicle_no.trim().toUpperCase() === data.vehicle_no.trim().toUpperCase()) ||
            (o.party_id === data.party_id && o.material_type === data.material_type && Number(o.quantity_mt) === Number(data.quantity_mt)))
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Dispatch for ${match.material_type} (${match.quantity_mt} ${match.quantity_unit}) on ${match.date} with vehicle "${match.vehicle_no || 'N/A'}" already recorded.`,
        };
      }
    }

    if (type === 'expense') {
      const match = expenses.find(
        (e) =>
          e.id !== excludeId &&
          e.date === data.date &&
          e.category === data.category &&
          Number(e.amount) === Number(data.amount)
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Expense "${match.title}" (₹${match.amount}) under "${match.category}" on ${match.date} already recorded.`,
        };
      }
    }

    if (type === 'job') {
      const match = jobs.find(
        (j) =>
          j.id !== excludeId &&
          j.date === data.date &&
          j.product_name === data.product_name &&
          Number(j.tray_count) === Number(data.tray_count) &&
          Number(j.quantity) === Number(data.quantity)
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Production job for ${match.product_name} (${match.quantity} pcs) on ${match.date} already recorded.`,
        };
      }
    }

    if (type === 'employee') {
      const match = employees.find(
        (e) =>
          e.id !== excludeId &&
          (e.name.trim().toLowerCase() === data.name?.trim().toLowerCase() ||
            (data.phone && e.phone && e.phone.trim() === data.phone.trim()))
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Worker "${match.name}" already registered in the directory.`,
        };
      }
    }

    if (type === 'group') {
      const match = workerGroups.find(
        (g) => g.id !== excludeId && g.name.trim().toLowerCase() === data.name?.trim().toLowerCase()
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Worker Gang "${match.name}" already exists.`,
        };
      }
    }

    if (type === 'product_rate') {
      const match = productRates.find(
        (p) => p.id !== excludeId && p.name.trim().toLowerCase() === data.name?.trim().toLowerCase()
      );
      if (match) {
        return {
          isDuplicate: true,
          details: `Product "${match.name}" is already configured in rate master.`,
        };
      }
    }

    if (type === 'payment') {
      const match = payments.find((p) => p.id !== excludeId && p.date === data.date && p.party_id === data.party_id && p.payment_type === data.payment_type && Number(p.amount) === Number(data.amount) && p.mode === data.mode);
      if (match) return { isDuplicate: true, details: `Payment of ₹${match.amount} (${match.payment_type}) for ${match.party_name || 'this party'} on ${match.date} already exists.` };
    }
    if (type === 'adjustment') {
      const match = partyAdjustments.find((a) => a.id !== excludeId && a.date === data.date && a.party_id === data.party_id && a.voucher_type === data.voucher_type && a.category === data.category && Number(a.amount) === Number(data.amount));
      if (match) return { isDuplicate: true, details: `${match.voucher_type} voucher of ₹${match.amount} for ${match.party_name || 'this party'} on ${match.date} already exists.` };
    }

    return { isDuplicate: false };
  };

  // User management is performed through a server-side Supabase Edge Function; never store user passwords in browser state.
  const refreshUsers = async (user: { app_metadata?: Record<string, unknown> } | null | undefined) => {
    const role = getCloudRole(user);
    if (role !== 'admin') { setUsers([]); return; }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'list' } });
    if (error) {
      setSyncError(`Could not load company users: ${error.message}`);
      return;
    }
    const safeUsers = Array.isArray(data?.users) ? data.users.map((u: AppUser) => {
      const { password: _password, ...safe } = u;
      return safe;
    }) : [];
    setUsers(safeUsers);
  };

  const addUser = async (user: Omit<AppUser, 'id' | 'created_at'>) => {
    if (!canManageUsers) throw new Error('Only an administrator or owner can add company users.');
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Cloud authentication is not configured.');
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email: user.username, password: user.password, name: user.name, role: user.role, phone: user.phone },
    });
    if (error || !data?.user) throw new Error(error?.message || data?.error || 'Could not create company user.');
    setUsers((prev) => [...prev.filter((u) => u.id !== data.user.id), data.user]);
  };

  const updateUser = async (id: string, updated: Partial<AppUser>) => {
    if (!canManageUsers) throw new Error('Only an administrator or owner can edit company users.');
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Cloud authentication is not configured.');
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update', user_id: id, email: updated.username, password: updated.password, name: updated.name, role: updated.role, phone: updated.phone },
    });
    if (error || !data?.user) throw new Error(error?.message || data?.error || 'Could not update company user.');
    setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    if (!canDelete) return false;
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Cloud authentication is not configured.');
    const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'delete', user_id: id } });
    if (error || !data?.success) throw new Error(error?.message || data?.error || 'Could not delete company user.');
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'No active user session' };
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 8) return { success: false, message: 'Password must be at least 8 characters long.' };
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Cloud authentication is not configured.' };
    try {
      const { data, error } = await supabase.auth.updateUser({ password: cleanPass });
      if (error || !data.user) return { success: false, message: error?.message || 'Password update failed.' };
      return { success: true, message: 'Company account password updated successfully.' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Password update failed.' };
    }
  };

  // --- WORKER GROUPS CRUD ---
  const addGroup = async (group: Omit<WorkerGroup, 'id' | 'created_at'>) => {
    const newGroup: WorkerGroup = {
      ...group,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setWorkerGroups((prev) => [...prev, newGroup]);
    await persistRecord('workerGroups', newGroup as unknown as Record<string, unknown>);
  };

  const updateGroup = async (id: string, updated: Partial<WorkerGroup>) => {
    assertCanEdit();
    const mergedGroup = { ...(workerGroups.find((g) => g.id === id) || {}), ...updated, id };
    setWorkerGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    await persistRecord('workerGroups', mergedGroup as unknown as Record<string, unknown>);
  };

  const deleteGroup = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete worker gangs.');
      return false;
    }
    setWorkerGroups((prev) => prev.filter((g) => g.id !== id));
    await removeCloudRecord('workerGroups', id);
    return true;
  };

  // --- PRODUCT RATES MASTER CRUD ---
  const addProductRate = async (prod: Omit<ProductRateMaster, 'id' | 'created_at'>) => {
    const newProd: ProductRateMaster = {
      ...prod,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setProductRates((prev) => [...prev, newProd]);
    await persistRecord('productRates', newProd as unknown as Record<string, unknown>);
  };

  const updateProductRate = async (id: string, updated: Partial<ProductRateMaster>) => {
    assertCanEdit();
    const mergedRate = { ...(productRates.find((p) => p.id === id) || {}), ...updated, id };
    setProductRates((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    await persistRecord('productRates', mergedRate as unknown as Record<string, unknown>);
  };

  const deleteProductRate = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove product rates.');
      return false;
    }
    setProductRates((prev) => prev.filter((p) => p.id !== id));
    await removeCloudRecord('productRates', id);
    return true;
  };

  // --- PARTIES CRUD ---
  const addParty = async (party: Omit<Party, 'id' | 'created_at'>) => {
    const newParty: Party = {
      ...party,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setParties((prev) => [newParty, ...prev]);
    await persistRecord('parties', newParty as unknown as Record<string, unknown>);
};

  const updateParty = async (id: string, updated: Partial<Party>) => {
    assertCanEdit();
    const mergedParty = { ...(parties.find((p) => p.id === id) || {}), ...updated, id };
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    await persistRecord('parties', mergedParty as unknown as Record<string, unknown>);
};

  const deleteParty = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete parties.');
      return false;
    }
    setParties((prev) => prev.filter((p) => p.id !== id));
    await removeCloudRecord('parties', id);
return true;
  };

  // --- INWARD CRUD ---
  const addInward = async (inward: Omit<MaterialInward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === inward.party_id);
    const newInward: MaterialInward = {
      ...inward,
      party_name: party?.name || inward.party_name || 'Unassigned Supplier',
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setInwards((prev) => [newInward, ...prev]);
await persistRecord('inwards', newInward as unknown as Record<string, unknown>);
  };

  const updateInward = async (id: string, updated: Partial<MaterialInward>) => {
    assertCanEdit();
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    const mergedInward = { ...(inwards.find((i) => i.id === id) || {}), ...updated, id };
    setInwards((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    await persistRecord('inwards', mergedInward as unknown as Record<string, unknown>);
};

  const deleteInward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete material entries.');
      return false;
    }
    setInwards((prev) => prev.filter((i) => i.id !== id));
    await removeCloudRecord('inwards', id);
return true;
  };

  // --- OUTWARD CRUD ---
  const addOutward = async (outward: Omit<MaterialOutward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === outward.party_id);
    const newOutward: MaterialOutward = {
      ...outward,
      party_name: party?.name || outward.party_name || 'Walk-in Customer',
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setOutwards((prev) => [newOutward, ...prev]);
await persistRecord('outwards', newOutward as unknown as Record<string, unknown>);
  };

  const updateOutward = async (id: string, updated: Partial<MaterialOutward>) => {
    assertCanEdit();
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    const mergedOutward = { ...(outwards.find((o) => o.id === id) || {}), ...updated, id };
    setOutwards((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    await persistRecord('outwards', mergedOutward as unknown as Record<string, unknown>);
};

  const deleteOutward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete dispatch records.');
      return false;
    }
    setOutwards((prev) => prev.filter((o) => o.id !== id));
    await removeCloudRecord('outwards', id);
return true;
  };

  // --- PAYMENTS CRUD ---
  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === payment.party_id);
    const newPayment: Payment = {
      ...payment,
      party_name: party?.name || payment.party_name || '',
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);
    await persistRecord('payments', newPayment as unknown as Record<string, unknown>);
};

  const updatePayment = async (id: string, updated: Partial<Payment>) => {
    assertCanEdit();
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    const mergedPayment = { ...(payments.find((p) => p.id === id) || {}), ...updated, id };
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    await persistRecord('payments', mergedPayment as unknown as Record<string, unknown>);
};

  const deletePayment = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete payments.');
      return false;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    await removeCloudRecord('payments', id);
return true;
  };

  // --- PARTY ADJUSTMENTS / CREDIT & DEBIT VOUCHERS CRUD ---
  const addPartyAdjustment = async (adj: Omit<PartyAdjustment, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === adj.party_id);
    const newAdj: PartyAdjustment = {
      ...adj,
      party_name: party?.name || adj.party_name || '',
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setPartyAdjustments((prev) => [newAdj, ...prev]);
    await persistRecord('partyAdjustments', newAdj as unknown as Record<string, unknown>);
};

  const updatePartyAdjustment = async (id: string, updated: Partial<PartyAdjustment>) => {
    assertCanEdit();
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    const mergedAdjustment = { ...(partyAdjustments.find((a) => a.id === id) || {}), ...updated, id };
    setPartyAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    await persistRecord('partyAdjustments', mergedAdjustment as unknown as Record<string, unknown>);
};

  const deletePartyAdjustment = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete vouchers.');
      return false;
    }
    setPartyAdjustments((prev) => prev.filter((a) => a.id !== id));
    await removeCloudRecord('partyAdjustments', id);
return true;
  };

  // --- PRODUCTION / JOBS CRUD ---
  const addJob = async (job: Omit<JobWageEntry, 'id' | 'created_at'>) => {
    const newJob: JobWageEntry = {
      ...job,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
    await persistRecord('jobs', newJob as unknown as Record<string, unknown>);
};

  const updateJob = async (id: string, updated: Partial<JobWageEntry>) => {
    assertCanEdit();
    const mergedJob = { ...(jobs.find((j) => j.id === id) || {}), ...updated, id };
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updated } : j)));
    await persistRecord('jobs', mergedJob as unknown as Record<string, unknown>);
};

  const deleteJob = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete production entries.');
      return false;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    await removeCloudRecord('jobs', id);
return true;
  };

  // --- EMPLOYEES CRUD ---
  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: generateUuid(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    await persistRecord('employees', newEmp as unknown as Record<string, unknown>);
};

  const updateEmployee = async (id: string, updated: Partial<Employee>) => {
    assertCanEdit();
    const mergedEmployee = { ...(employees.find((e) => e.id === id) || {}), ...updated, id };
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    await persistRecord('employees', mergedEmployee as unknown as Record<string, unknown>);
};

  const deleteEmployee = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove employee profiles.');
      return false;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await removeCloudRecord('employees', id);
return true;
  };

  // --- ATTENDANCE CRUD ---
  const saveAttendance = async (date: string, records: { employee_id: string; status: any; notes?: string }[]) => {
    assertCanEdit('attendance');
    const newRecords: AttendanceRecord[] = records.map((r) => {
      const emp = employees.find((e) => e.id === r.employee_id);
      return {
        id: generateUuid(),
        employee_id: r.employee_id,
        employee_name: emp?.name || '',
        date,
        status: r.status,
        notes: r.notes || '',
      };
    });

    const previousForDate = attendance.filter((a) => a.date === date);
    setAttendance((prev) => {
      const filtered = prev.filter((a) => a.date !== date);
      return [...filtered, ...newRecords];
    });
    for (const oldRecord of previousForDate) await removeCloudRecord('attendance', oldRecord.id);
    for (const record of newRecords) await persistRecord('attendance', record as unknown as Record<string, unknown>);

};

  const deleteAttendanceForDate = async (date: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can clear attendance logs.');
      return false;
    }
    setAttendance((prev) => prev.filter((a) => a.date !== date));
    for (const record of attendance.filter((a) => a.date === date)) await removeCloudRecord('attendance', record.id);
return true;
  };

  // --- EXPENSES CRUD ---
  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    let partyName = expense.party_name;
    let paidTo = expense.paid_to;
    if (expense.party_id) {
      const party = parties.find((p) => p.id === expense.party_id);
      if (party) {
        partyName = party.name;
        if (!paidTo) paidTo = party.name;
      }
    }
    const newExpense: Expense = {
      ...expense,
      paid_to: paidTo,
      party_name: partyName,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    await persistRecord('expenses', newExpense as unknown as Record<string, unknown>);
};

  const findLinkedMaterialInward = (expense?: Expense) => {
    if (!expense || expense.expense_type !== 'material_purchase') return undefined;
    return inwards.find((inward) =>
      inward.date === expense.date &&
      inward.party_id === expense.party_id &&
      String(inward.material_type || '').trim().toLowerCase() === String(expense.material_type || '').trim().toLowerCase() &&
      Math.abs((Number(inward.amount) || 0) - (Number(expense.amount) || 0)) < 0.01 &&
      String(inward.notes || '').startsWith('Logged via Material Expense')
    );
  };

  const updateExpense = async (id: string, updated: Partial<Expense>) => {
    assertCanEdit();
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) {
        updated.party_name = party.name;
        if (!updated.paid_to) updated.paid_to = party.name;
      }
    }
    const existingExpense = expenses.find((e) => e.id === id);
    const mergedExpense = { ...(existingExpense || {}), ...updated, id } as Expense;
    const linkedInward = findLinkedMaterialInward(existingExpense);
    setExpenses((prev) => prev.map((e) => (e.id === id ? mergedExpense : e)));
    await persistRecord('expenses', mergedExpense as unknown as Record<string, unknown>);

    // Keep the stock entry created from this expense in step with edits and deletions.
    if (linkedInward) {
      if (mergedExpense.expense_type === 'material_purchase' && mergedExpense.material_type && Number(mergedExpense.quantity) > 0) {
        const party = parties.find((p) => p.id === mergedExpense.party_id);
        const updatedInward: MaterialInward = {
          ...linkedInward,
          date: mergedExpense.date,
          party_id: mergedExpense.party_id,
          party_name: party?.name || mergedExpense.party_name || linkedInward.party_name,
          material_type: mergedExpense.material_type,
          quantity_mt: Number(mergedExpense.quantity),
          quantity_unit: mergedExpense.unit || linkedInward.quantity_unit,
          rate: Number(mergedExpense.rate) || Number(mergedExpense.amount) / Number(mergedExpense.quantity),
          amount: Number(mergedExpense.amount) || 0,
          notes: `Logged via Material Expense [${mergedExpense.title}]`,
        };
        setInwards((prev) => prev.map((item) => item.id === linkedInward.id ? updatedInward : item));
        await persistRecord('inwards', updatedInward as unknown as Record<string, unknown>);
      } else {
        setInwards((prev) => prev.filter((item) => item.id !== linkedInward.id));
        await removeCloudRecord('inwards', linkedInward.id);
      }
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete expenses.');
      return false;
    }
    const existingExpense = expenses.find((e) => e.id === id);
    const linkedInward = findLinkedMaterialInward(existingExpense);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await removeCloudRecord('expenses', id);
    if (linkedInward) {
      setInwards((prev) => prev.filter((item) => item.id !== linkedInward.id));
      await removeCloudRecord('inwards', linkedInward.id);
    }
    return true;
  };

  const updateSettings = async (newSettings: AlertSettings) => {
    if (!isAdmin) throw new Error('Access denied: only Admin can change company settings.');
    setSettings(newSettings);
    await persistRecord('settings', { ...newSettings, id: 'global' });
  };

  // Ledger Calculations: Credit = Party needs to pay me (Receivable), Debit = I need to pay party (Payable)
  const calculatePartyBalance = (partyId: string): number => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return 0;

    const opening = Number(party.opening_balance) || 0;
    const opBal = party.opening_balance_type === 'debit' ? -opening : opening;
    const totalOutward = outwards.filter((m) => m.party_id === partyId).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalInward = inwards.filter((m) => m.party_id === partyId).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const received = payments.filter((p) => p.party_id === partyId && p.payment_type === 'received' && p.mode !== 'adjustment').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const paid = payments.filter((p) => p.party_id === partyId && p.payment_type === 'paid' && p.mode !== 'adjustment').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const adjCredit = partyAdjustments.filter((a) => a.party_id === partyId && a.voucher_type === 'credit').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const adjDebit = partyAdjustments.filter((a) => a.party_id === partyId && a.voucher_type === 'debit').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    // Expense entries can mirror a material inward when "Add to stock" is selected.
    // Match each expense to at most one inward so the purchase is not counted twice.
    const matchedInwardIds = new Set<string>();
    const materialPurchaseExpensesWithInward = expenses.filter((expense) => {
      if (expense.party_id !== partyId || expense.expense_type !== 'material_purchase') return false;
      const match = inwards.find((inward) =>
        !matchedInwardIds.has(inward.id) &&
        inward.party_id === partyId &&
        inward.date === expense.date &&
        String(inward.material_type || '').trim().toLowerCase() === String(expense.material_type || '').trim().toLowerCase() &&
        Math.abs((Number(inward.amount) || 0) - (Number(expense.amount) || 0)) < 0.01
      );
      if (!match) return false;
      matchedInwardIds.add(match.id);
      return true;
    });
    const paidAgainstInwardPurchases = materialPurchaseExpensesWithInward.reduce((sum, expense) => sum + (Number(expense.paid_amount) || 0), 0);

    const partyPaidExpenses = expenses
      .filter((e) => e.party_id === partyId &&
        (e.expense_type === 'supplier_payment' ||
          e.category === 'Supplier Due Payment' ||
          e.category.includes('Supplier Due Payment') ||
          e.category.includes('Outstanding Settlement')))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const unpaidExpenses = expenses
      .filter((e) => e.party_id === partyId &&
        e.expense_type !== 'supplier_payment' &&
        !e.category.includes('Supplier Due Payment') &&
        !e.category.includes('Outstanding Settlement') &&
        !materialPurchaseExpensesWithInward.includes(e) &&
        (e.payment_status === 'unpaid' || e.payment_status === 'partial' || e.is_paid === false || e.payment_mode === 'credit'))
      .reduce((sum, e) => sum + (Number(e.due_amount ?? e.amount) || 0), 0);

    // Positive = customer receivable; negative = supplier payable.
    // Paid amounts on mirrored material purchases offset the inward liability exactly once.
    return opBal + totalOutward - totalInward - unpaidExpenses - received +
      paid + partyPaidExpenses + paidAgainstInwardPurchases + adjCredit - adjDebit;
  };

  // Raw-material stock is displayed in a consistent unit. Dust/sand purchased
  // in "Units" is converted using the plant's confirmed rate: 1 unit = 3.2 tonnes.
  // This only changes calculated display totals; original purchase records remain intact.
  const getRawMaterialStock = (): { [mat: string]: { quantity: number; unit: string; secondaryInfo?: string } } => {
    const result: { [mat: string]: { quantity: number; unit: string; secondaryInfo?: string } } = {};

    const canonicalMaterialName = (rawName: string) => {
      const name = String(rawName || '').trim().replace(/\\s+/g, ' ');
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (key.includes('cool dust') || key.includes('cooldust') || key.includes('fine p sand dust')) {
        return 'Cool Dust (Fine P-Sand Dust)';
      }
      if (key.includes('quarry dust') || key.includes('blue metal dust')) {
        return 'Quarry Dust / Blue Metal Dust';
      }
      return name || 'Unspecified Material';
    };

    // Keep the quantity and unit the user entered. Convert only for optional
    // equivalent information; never replace the displayed stock unit with Ton.
    const normalizeUnit = (rawUnit: string) => {
      const unit = String(rawUnit || 'Ton').trim();
      const key = unit.toLowerCase();
      if (['unit', 'units'].includes(key)) return 'Units';
      if (['pc', 'pcs', 'piece', 'pieces'].includes(key)) return 'Pieces';
      if (['ton', 'tons', 'mt', 'tonne', 'tonnes'].includes(key)) return 'Ton';
      if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(key)) return 'Kg';
      if (['bag', 'bags'].includes(key)) return 'Bags';
      return unit || 'Units';
    };

    inwards.forEach((item) => {
      const mat = canonicalMaterialName(item.material_type);
      const quantity = Number(item.quantity_mt) || 0;
      const unit = normalizeUnit(item.quantity_unit || 'Ton');
      const isCement = mat.toLowerCase().includes('cement');
      const isDustOrSand = /dust|sand|aggregate|blue metal/.test(mat.toLowerCase());

      // Aggregate only records with the same material AND unit. This preserves
      // entered units and avoids mixing Units, Kg, Bags, and Ton in one balance.
      const resultKey = `${mat} (${unit})`;
      if (!result[resultKey]) result[resultKey] = { quantity: 0, unit };
      result[resultKey].quantity += quantity;

      if (isDustOrSand && unit === 'Units') {
        result[resultKey].secondaryInfo = `≈ ${(result[resultKey].quantity * 3.2).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes (1 Unit = 3.2 Tonnes)`;
      } else if (unit === 'Kg') {
        result[resultKey].secondaryInfo = `≈ ${(result[resultKey].quantity / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes`;
      } else if (unit === 'Bags' && isCement) {
        result[resultKey].secondaryInfo = `≈ ${(result[resultKey].quantity * 0.05).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes (50 kg/bag)`;
      }
    });

    // Explicit raw-material outward movements reduce the matching stock bucket.
    // Entries in a different unit are kept separate rather than silently mixed.
    outwards.forEach((item) => {
      const mat = canonicalMaterialName(item.material_type);
      const unit = normalizeUnit(item.quantity_unit || 'Ton');
      const resultKey = `${mat} (${unit})`;
      if (result[resultKey]) result[resultKey].quantity -= Number(item.quantity_mt) || 0;
    });

    Object.keys(result).forEach((mat) => {
      const entry = result[mat];
      entry.quantity = Math.round(entry.quantity * 1000) / 1000;
      const isCement = mat.toLowerCase().includes('cement');
      const isDustOrSand = /dust|sand|aggregate|blue metal/.test(mat.toLowerCase());
      if (isDustOrSand && entry.unit === 'Units') {
        entry.secondaryInfo = `≈ ${(entry.quantity * 3.2).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes (1 Unit = 3.2 Tonnes)`;
      } else if (entry.unit === 'Kg') {
        entry.secondaryInfo = `≈ ${(entry.quantity / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes`;
      } else if (entry.unit === 'Bags' && isCement) {
        entry.secondaryInfo = `≈ ${(entry.quantity * 0.05).toLocaleString(undefined, { maximumFractionDigits: 3 })} Tonnes (50 kg/bag)`;
      }
    });

    return result;
  };

  // Finished Goods Yard Stock. Normalize spelling/plural variants so production
  // and dispatch entries for the same product share one stock balance.
  const getProductStock = (): { [prod: string]: { produced: number; dispatched: number; stock: number } } => {
    const byKey: { [key: string]: { produced: number; dispatched: number; stock: number } } = {};
    const displayNameByKey: { [key: string]: string } = {};
    const productKey = (name: string | undefined) =>
      String(name || '').trim().toLowerCase().replace(/\\s+/g, ' ').replace(/\\bbricks\\b/g, 'brick');

    const ensureProduct = (name: string | undefined) => {
      const key = productKey(name);
      if (!key) return '';
      if (!displayNameByKey[key]) displayNameByKey[key] = String(name).trim().replace(/\\s+/g, ' ');
      if (!byKey[key]) byKey[key] = { produced: 0, dispatched: 0, stock: 0 };
      return key;
    };

    // Prefer the configured product-rate name for consistent labels.
    productRates.forEach((pr) => {
      const key = ensureProduct(pr.name);
      if (key) {
        displayNameByKey[key] = String(pr.name).trim().replace(/\\s+/g, ' ');
        const opening = Number(pr.opening_stock) || 0;
        // Opening stock is available stock, not production made during the report period.
        byKey[key].stock += opening;
      }
    });

    jobs.forEach((job) => {
      // Gang work and loading/unloading wages are not finished-goods production.
      if (job.job_type !== 'Only Production' && job.job_type !== 'Production') return;
      const key = ensureProduct(job.product_name);
      if (!key) return;
      const quantity = Number(job.quantity) || 0;
      byKey[key].produced += quantity;
      byKey[key].stock += quantity;
    });

    outwards.forEach((outward) => {
      const key = ensureProduct(outward.material_type);
      if (!key) return;
      const quantity = Number(outward.quantity_mt) || 0;
      byKey[key].dispatched += quantity;
      byKey[key].stock -= quantity;
    });

    const result: { [prod: string]: { produced: number; dispatched: number; stock: number } } = {};
    Object.keys(byKey).forEach((key) => {
      result[displayNameByKey[key] || key] = byKey[key];
    });
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        canDelete,
        canEdit,
        canManageUsers,
        login,
        logout,
        changePassword,
        users,
        addUser,
        updateUser,
        deleteUser,
        parties,
        inwards,
        outwards,
        payments,
        partyAdjustments,
        jobs,
        employees,
        attendance,
        expenses,
        workerGroups,
        productRates,
        settings,
        activeTab,
        setActiveTab,
        addParty,
        updateParty,
        deleteParty,
        addPartyAdjustment,
        updatePartyAdjustment,
        deletePartyAdjustment,
        addInward,
        updateInward,
        deleteInward,
        addOutward,
        updateOutward,
        deleteOutward,
        addPayment,
        updatePayment,
        deletePayment,
        addJob,
        updateJob,
        deleteJob,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        saveAttendance,
        deleteAttendanceForDate,
        addExpense,
        updateExpense,
        deleteExpense,
        addGroup,
        updateGroup,
        deleteGroup,
        addProductRate,
        updateProductRate,
        deleteProductRate,
        updateSettings,
        calculatePartyBalance,
        getRawMaterialStock,
        getProductStock,
        calculateGroupWageDistribution,
        checkDuplicate,
        syncWithCloud,
        isSyncing,
        lastSyncedTime,
        syncError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
