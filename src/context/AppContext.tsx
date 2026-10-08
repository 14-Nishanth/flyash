import React, { createContext, useContext, useState, useEffect } from 'react';
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
  checkDuplicate: (type: 'party' | 'inward' | 'outward' | 'expense' | 'job' | 'employee' | 'group' | 'product_rate', data: any, excludeId?: string) => { isDuplicate: boolean; details?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    password: 'admin123',
    name: 'Plant Administrator',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-owner-1',
    username: 'owner',
    password: 'owner123',
    name: 'Plant Owner',
    role: 'owner',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-operator-1',
    username: 'operator',
    password: 'operator123',
    name: 'Data Entry Operator',
    role: 'operator',
    created_at: new Date().toISOString(),
  },
];

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set Light theme as default
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('flyash_theme') as 'dark' | 'light') || 'light');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authentication Session - Requires login on every open/load per user preference
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // User Accounts
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('flyash_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
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
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Login handler
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );
    if (foundUser) {
      resetFailedLoginAttempts();
      const session: UserSession = {
        id: foundUser.id,
        username: foundUser.username,
        name: foundUser.name,
        role: foundUser.role,
        phone: foundUser.phone,
      };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }

    if (cleanUser === 'admin' && cleanPass === 'admin123') {
      resetFailedLoginAttempts();
      const session: UserSession = { username: 'admin', name: 'Plant Administrator', role: 'admin' };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }
    if (cleanUser === 'owner' && cleanPass === 'owner123') {
      resetFailedLoginAttempts();
      const session: UserSession = { username: 'owner', name: 'Plant Owner', role: 'owner' };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }
    if (cleanUser === 'operator' && cleanPass === 'operator123') {
      resetFailedLoginAttempts();
      const session: UserSession = { username: 'operator', name: 'Data Entry Operator', role: 'operator' };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }

    const supabase = getSupabaseClient();
    if (supabase && cleanUser.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanUser,
          password: cleanPass,
        });
        if (data?.user && !error) {
          resetFailedLoginAttempts();
          const session: UserSession = {
            username: data.user.email || cleanUser,
            name: data.user.user_metadata?.name || 'Plant Staff',
            role: (data.user.user_metadata?.role as UserRole) || 'operator',
          };
          setCurrentUser(session);
          localStorage.setItem('flyash_user_session', JSON.stringify(session));
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase auth error:', err);
      }
    }

    // Trigger security alert on failed login attempt
    try {
      await trackFailedLoginAttempt(settings, cleanUser);
    } catch (e) {
      console.warn('Failed login notification error:', e);
    }

    return { success: false, error: 'Invalid credentials. Please check your username and password.' };
  };

  const logout = () => {
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

  // Supabase Cloud Sync on mount
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function fetchData() {
      try {
        const { data: uData } = await supabase!.from('app_users').select('*');
        if (uData && uData.length > 0) {
          setUsers((prev) => {
            const combined = [...prev];
            uData.forEach((u) => {
              if (!combined.some((p) => p.username.toLowerCase() === u.username.toLowerCase())) {
                combined.push(u);
              }
            });
            return combined;
          });
        }

        const { data: pData } = await supabase!.from('parties').select('*');
        if (pData && pData.length > 0) setParties(pData);

        const { data: inData } = await supabase!.from('material_inward').select('*');
        if (inData && inData.length > 0) setInwards(inData);

        const { data: outData } = await supabase!.from('material_outward').select('*');
        if (outData && outData.length > 0) setOutwards(outData);

        const { data: payData } = await supabase!.from('payments').select('*');
        if (payData && payData.length > 0) setPayments(payData);

        const { data: adjData } = await supabase!.from('party_adjustments').select('*');
        if (adjData && adjData.length > 0) setPartyAdjustments(adjData);

        const { data: jobData } = await supabase!.from('job_wage_entries').select('*');
        if (jobData && jobData.length > 0) setJobs(jobData);

        const { data: empData } = await supabase!.from('employees').select('*');
        if (empData && empData.length > 0) setEmployees(empData);

        const { data: expData } = await supabase!.from('expenses').select('*');
        if (expData && expData.length > 0) setExpenses(expData);

        const { data: grpData } = await supabase!.from('worker_groups').select('*');
        if (grpData && grpData.length > 0) setWorkerGroups(grpData);

        const { data: prData } = await supabase!.from('product_rates').select('*');
        if (prData && prData.length > 0) setProductRates(prData);
      } catch (err) {
        console.warn('Supabase fetch dual-mode resilience:', err);
      }
    }
    fetchData();
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
    type: 'party' | 'inward' | 'outward' | 'expense' | 'job' | 'employee' | 'group' | 'product_rate',
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

    return { isDuplicate: false };
  };

  // --- USER MANAGEMENT ---
  const addUser = async (user: Omit<AppUser, 'id' | 'created_at'>) => {
    const newUser: AppUser = {
      ...user,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('app_users').insert(newUser);
  };

  const updateUser = async (id: string, updated: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('app_users').update(updated).eq('id', id);
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    if (!canDelete) return false;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('app_users').delete().eq('id', id);
    return true;
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'No active user session' };
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long' };
    }

    // Check if user exists in users array
    const existingIndex = users.findIndex(
      (u) => u.username.toLowerCase() === currentUser.username.toLowerCase()
    );

    if (existingIndex >= 0) {
      const targetUser = users[existingIndex];
      const updatedUser = { ...targetUser, password: cleanPass };
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('app_users').update({ password: cleanPass }).eq('id', targetUser.id);
        } catch (e) {
          console.warn('Supabase password sync:', e);
        }
      }
    } else {
      // Create new user entry for this login
      const newUser: AppUser = {
        id: currentUser.id || String(Date.now()),
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        phone: currentUser.phone,
        password: cleanPass,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('app_users').insert(newUser);
        } catch (e) {
          console.warn('Supabase password sync:', e);
        }
      }
    }

    return { success: true, message: 'Password updated successfully!' };
  };

  // --- WORKER GROUPS CRUD ---
  const addGroup = async (group: Omit<WorkerGroup, 'id' | 'created_at'>) => {
    const newGroup: WorkerGroup = {
      ...group,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setWorkerGroups((prev) => [...prev, newGroup]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('worker_groups').insert(newGroup);
  };

  const updateGroup = async (id: string, updated: Partial<WorkerGroup>) => {
    setWorkerGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('worker_groups').update(updated).eq('id', id);
  };

  const deleteGroup = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete worker gangs.');
      return false;
    }
    setWorkerGroups((prev) => prev.filter((g) => g.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('worker_groups').delete().eq('id', id);
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
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('product_rates').insert(newProd);
  };

  const updateProductRate = async (id: string, updated: Partial<ProductRateMaster>) => {
    setProductRates((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('product_rates').update(updated).eq('id', id);
  };

  const deleteProductRate = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove product rates.');
      return false;
    }
    setProductRates((prev) => prev.filter((p) => p.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('product_rates').delete().eq('id', id);
    return true;
  };

  // --- PARTIES CRUD ---
  const addParty = async (party: Omit<Party, 'id' | 'created_at'>) => {
    const newParty: Party = {
      ...party,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setParties((prev) => [newParty, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('parties').insert(newParty);
  };

  const updateParty = async (id: string, updated: Partial<Party>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('parties').update(updated).eq('id', id);
  };

  const deleteParty = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete parties.');
      return false;
    }
    setParties((prev) => prev.filter((p) => p.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('parties').delete().eq('id', id);
    return true;
  };

  // --- INWARD CRUD ---
  const addInward = async (inward: Omit<MaterialInward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === inward.party_id);
    const newInward: MaterialInward = {
      ...inward,
      party_name: party?.name || inward.party_name || 'Unassigned Supplier',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setInwards((prev) => [newInward, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_inward').insert(newInward);
  };

  const updateInward = async (id: string, updated: Partial<MaterialInward>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setInwards((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_inward').update(updated).eq('id', id);
  };

  const deleteInward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete material entries.');
      return false;
    }
    setInwards((prev) => prev.filter((i) => i.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_inward').delete().eq('id', id);
    return true;
  };

  // --- OUTWARD CRUD ---
  const addOutward = async (outward: Omit<MaterialOutward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === outward.party_id);
    const newOutward: MaterialOutward = {
      ...outward,
      party_name: party?.name || outward.party_name || 'Walk-in Customer',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setOutwards((prev) => [newOutward, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_outward').insert(newOutward);
  };

  const updateOutward = async (id: string, updated: Partial<MaterialOutward>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setOutwards((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_outward').update(updated).eq('id', id);
  };

  const deleteOutward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete dispatch records.');
      return false;
    }
    setOutwards((prev) => prev.filter((o) => o.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('material_outward').delete().eq('id', id);
    return true;
  };

  // --- PAYMENTS CRUD ---
  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === payment.party_id);
    const newPayment: Payment = {
      ...payment,
      party_name: party?.name || payment.party_name || '',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('payments').insert(newPayment);
  };

  const updatePayment = async (id: string, updated: Partial<Payment>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('payments').update(updated).eq('id', id);
  };

  const deletePayment = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete payments.');
      return false;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('payments').delete().eq('id', id);
    return true;
  };

  // --- PARTY ADJUSTMENTS / CREDIT & DEBIT VOUCHERS CRUD ---
  const addPartyAdjustment = async (adj: Omit<PartyAdjustment, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === adj.party_id);
    const newAdj: PartyAdjustment = {
      ...adj,
      party_name: party?.name || adj.party_name || '',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setPartyAdjustments((prev) => [newAdj, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('party_adjustments').insert(newAdj);
      } catch (e) {
        console.warn('Supabase party adjustment insert sync:', e);
      }
    }
  };

  const updatePartyAdjustment = async (id: string, updated: Partial<PartyAdjustment>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setPartyAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('party_adjustments').update(updated).eq('id', id);
      } catch (e) {
        console.warn('Supabase party adjustment update sync:', e);
      }
    }
  };

  const deletePartyAdjustment = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete vouchers.');
      return false;
    }
    setPartyAdjustments((prev) => prev.filter((a) => a.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('party_adjustments').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase party adjustment delete sync:', e);
      }
    }
    return true;
  };

  // --- PRODUCTION / JOBS CRUD ---
  const addJob = async (job: Omit<JobWageEntry, 'id' | 'created_at'>) => {
    const newJob: JobWageEntry = {
      ...job,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('job_wage_entries').insert(newJob);
  };

  const updateJob = async (id: string, updated: Partial<JobWageEntry>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updated } : j)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('job_wage_entries').update(updated).eq('id', id);
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete production entries.');
      return false;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('job_wage_entries').delete().eq('id', id);
    return true;
  };

  // --- EMPLOYEES CRUD ---
  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    };
    setEmployees((prev) => [...prev, newEmp]);
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('employees').insert(newEmp);
  };

  const updateEmployee = async (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('employees').update(updated).eq('id', id);
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove employee profiles.');
      return false;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('employees').delete().eq('id', id);
    return true;
  };

  // --- ATTENDANCE CRUD ---
  const saveAttendance = async (date: string, records: { employee_id: string; status: any; notes?: string }[]) => {
    const newRecords: AttendanceRecord[] = records.map((r) => {
      const emp = employees.find((e) => e.id === r.employee_id);
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        employee_id: r.employee_id,
        employee_name: emp?.name || '',
        date,
        status: r.status,
        notes: r.notes || '',
      };
    });

    setAttendance((prev) => {
      const filtered = prev.filter((a) => a.date !== date);
      return [...filtered, ...newRecords];
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('attendance').delete().eq('date', date);
      await supabase.from('attendance').insert(newRecords);
    }
  };

  const deleteAttendanceForDate = async (date: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can clear attendance logs.');
      return false;
    }
    setAttendance((prev) => prev.filter((a) => a.date !== date));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('attendance').delete().eq('date', date);
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
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('expenses').insert(newExpense);
      } catch (e) {
        console.warn('Supabase expense insert sync:', e);
      }
    }
  };

  const updateExpense = async (id: string, updated: Partial<Expense>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) {
        updated.party_name = party.name;
        if (!updated.paid_to) updated.paid_to = party.name;
      }
    }
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('expenses').update(updated).eq('id', id);
      } catch (e) {
        console.warn('Supabase expense update sync:', e);
      }
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete expenses.');
      return false;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) await supabase.from('expenses').delete().eq('id', id);
    return true;
  };

  const updateSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
  };

  // Ledger Calculations: Credit = Party needs to pay me (Receivable), Debit = I need to pay party (Payable)
  const calculatePartyBalance = (partyId: string): number => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return 0;

    let opBal = party.opening_balance || 0;
    // If opening balance was set as debit (I need to pay), make it negative; if credit (party needs to pay me), make it positive
    if (party.opening_balance_type === 'debit') {
      opBal = -opBal;
    }

    const totalOutward = outwards
      .filter((m) => m.party_id === partyId)
      .reduce((sum, item) => sum + item.amount, 0);

    const totalInward = inwards
      .filter((m) => m.party_id === partyId)
      .reduce((sum, item) => sum + item.amount, 0);

    const received = payments
      .filter((p) => p.party_id === partyId && p.payment_type === 'received')
      .reduce((sum, item) => sum + item.amount, 0);

    const paid = payments
      .filter((p) => p.party_id === partyId && p.payment_type === 'paid')
      .reduce((sum, item) => sum + item.amount, 0);

    const adjCredit = partyAdjustments
      .filter((a) => a.party_id === partyId && a.voucher_type === 'credit')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const adjDebit = partyAdjustments
      .filter((a) => a.party_id === partyId && a.voucher_type === 'debit')
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    // Supplier payments logged from Expenses (reduces what I need to pay to supplier)
    const partyPaidExpenses = expenses
      .filter(
        (e) =>
          e.party_id === partyId &&
          (e.expense_type === 'supplier_payment' ||
            e.category === 'Supplier Due Payment' ||
            e.category.includes('Supplier Due Payment') ||
            e.category.includes('Outstanding Settlement'))
      )
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Unpaid material purchases or expenses (increases what I need to pay / Debit)
    const unpaidExpenses = expenses
      .filter(
        (e) =>
          e.party_id === partyId &&
          e.expense_type !== 'supplier_payment' &&
          !e.category.includes('Supplier Due Payment') &&
          !e.category.includes('Outstanding Settlement') &&
          (e.payment_status === 'unpaid' || e.payment_status === 'partial' || e.is_paid === false || e.payment_mode === 'credit')
      )
      .reduce((sum, e) => {
        if (e.payment_status === 'partial' && e.due_amount !== undefined) {
          return sum + e.due_amount;
        }
        return sum + (e.amount || 0);
      }, 0);

    // +Credit increases party's due to me (party needs to pay me)
    // -Debit increases what I need to pay party
    return opBal + totalOutward - totalInward - unpaidExpenses - received + (paid + partyPaidExpenses) + adjCredit - adjDebit;
  };

  // Accurate Raw Material Stock (Only Mentioned / User Recorded)
  const getRawMaterialStock = (): { [mat: string]: { quantity: number; unit: string; secondaryInfo?: string } } => {
    const result: { [mat: string]: { quantity: number; unit: string; secondaryInfo?: string } } = {};
    inwards.forEach((item) => {
      const mat = item.material_type;
      const unit = item.quantity_unit || 'Ton';
      if (!result[mat]) {
        result[mat] = { quantity: 0, unit };
      }
      result[mat].quantity += item.quantity_mt;
    });

    // Add secondary bag conversions for Cement if stored in Tons
    Object.keys(result).forEach((mat) => {
      const isCement = mat.toLowerCase().includes('cement');
      if (isCement) {
        if (result[mat].unit === 'Ton' || result[mat].unit === 'MT') {
          const bags = result[mat].quantity * 20;
          result[mat].secondaryInfo = `(${bags.toLocaleString()} Bags @ 50kg)`;
        } else if (result[mat].unit === 'Bags') {
          const tons = (result[mat].quantity / 20).toFixed(2);
          result[mat].secondaryInfo = `(${tons} Tons)`;
        }
      }
    });

    return result;
  };

  // Finished Goods Yard Stock
  const getProductStock = (): { [prod: string]: { produced: number; dispatched: number; stock: number } } => {
    const result: { [prod: string]: { produced: number; dispatched: number; stock: number } } = {};

    // Initial opening stock from product rates
    productRates.forEach((pr) => {
      if (pr.opening_stock) {
        result[pr.name] = { produced: pr.opening_stock, dispatched: 0, stock: pr.opening_stock };
      }
    });

    jobs.forEach((j) => {
      const prod = j.product_name;
      if (!result[prod]) {
        result[prod] = { produced: 0, dispatched: 0, stock: 0 };
      }
      result[prod].produced += j.quantity;
      result[prod].stock += j.quantity;
    });

    outwards.forEach((o) => {
      const prod = o.material_type;
      if (!result[prod]) {
        result[prod] = { produced: 0, dispatched: 0, stock: 0 };
      }
      result[prod].dispatched += o.quantity_mt;
      result[prod].stock -= o.quantity_mt;
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
