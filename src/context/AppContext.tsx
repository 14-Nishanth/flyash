import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Party,
  MaterialInward,
  MaterialOutward,
  Payment,
  JobWageEntry,
  Employee,
  AttendanceRecord,
  Expense,
  AlertSettings,
  AppUser,
  UserRole,
} from '../types';
import { getSupabaseClient } from '../lib/supabase';

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
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (id: string, user: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  parties: Party[];
  inwards: MaterialInward[];
  outwards: MaterialOutward[];
  payments: Payment[];
  jobs: JobWageEntry[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  expenses: Expense[];
  settings: AlertSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Parties CRUD
  addParty: (party: Omit<Party, 'id' | 'created_at'>) => Promise<void>;
  updateParty: (id: string, party: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<boolean>;
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
  // Utilities
  updateSettings: (newSettings: AlertSettings) => void;
  calculatePartyBalance: (partyId: string) => number;
  getRawMaterialStock: () => { [mat: string]: { quantity: number; unit: string } };
  getProductStock: () => { [prod: string]: { produced: number; dispatched: number; stock: number } };
  // Duplicate check
  checkDuplicate: (type: 'party' | 'inward' | 'outward' | 'expense' | 'job' | 'employee', data: any, excludeId?: string) => { isDuplicate: boolean; details?: string };
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set Light theme as default
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('flyash_theme') as 'dark' | 'light') || 'light');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authentication Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('flyash_user_session');
    return saved ? JSON.parse(saved) : null;
  });

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
    return saved ? JSON.parse(saved) : {
      owner_name: 'Plant Owner',
      owner_phone: '',
      daily_digest_enabled: true,
      daily_digest_time: '19:00',
    };
  });

  // Role permissions: Only Admin or Owner can delete data or manage users
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Login handler supporting custom created users + master fallback + Supabase Auth
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Check local users list
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );
    if (foundUser) {
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

    // 2. Fallback built-in credentials
    if (cleanUser === 'admin' && cleanPass === 'admin123') {
      const session: UserSession = {
        username: 'admin',
        name: 'Plant Administrator',
        role: 'admin',
      };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }
    if (cleanUser === 'owner' && cleanPass === 'owner123') {
      const session: UserSession = {
        username: 'owner',
        name: 'Plant Owner',
        role: 'owner',
      };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }
    if (cleanUser === 'operator' && cleanPass === 'operator123') {
      const session: UserSession = {
        username: 'operator',
        name: 'Data Entry Operator',
        role: 'operator',
      };
      setCurrentUser(session);
      localStorage.setItem('flyash_user_session', JSON.stringify(session));
      return { success: true };
    }

    // 3. Supabase Auth if email format
    const supabase = getSupabaseClient();
    if (supabase && cleanUser.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanUser,
          password: cleanPass,
        });
        if (data?.user && !error) {
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

    return { success: false, error: 'Invalid credentials. Please verify your username and password.' };
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
    localStorage.setItem('flyash_jobs', JSON.stringify(jobs));
  }, [jobs]);
  useEffect(() => {
    localStorage.setItem('flyash_employees', JSON.stringify(employees));
  }, [employees]);
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
          // Merge unique users
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

        const { data: jobData } = await supabase!.from('job_wage_entries').select('*');
        if (jobData && jobData.length > 0) setJobs(jobData);

        const { data: empData } = await supabase!.from('employees').select('*');
        if (empData && empData.length > 0) setEmployees(empData);

        const { data: expData } = await supabase!.from('expenses').select('*');
        if (expData && expData.length > 0) setExpenses(expData);
      } catch (err) {
        console.warn('Supabase fetch error, operating in resilient dual-mode:', err);
      }
    }
    fetchData();
  }, []);

  // Duplicate Check Helper
  const checkDuplicate = (
    type: 'party' | 'inward' | 'outward' | 'expense' | 'job' | 'employee',
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
          details: `Worker "${match.name}" already registered in the system.`,
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
    if (supabase) {
      await supabase.from('app_users').insert(newUser);
    }
  };

  const updateUser = async (id: string, updated: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('app_users').update(updated).eq('id', id);
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    if (!canDelete) return false;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('app_users').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('parties').insert(newParty);
    }
  };

  const updateParty = async (id: string, updated: Partial<Party>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('parties').update(updated).eq('id', id);
    }
  };

  const deleteParty = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete parties.');
      return false;
    }
    setParties((prev) => prev.filter((p) => p.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('parties').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('material_inward').insert(newInward);
    }
  };

  const updateInward = async (id: string, updated: Partial<MaterialInward>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setInwards((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_inward').update(updated).eq('id', id);
    }
  };

  const deleteInward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete material entries.');
      return false;
    }
    setInwards((prev) => prev.filter((i) => i.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_inward').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('material_outward').insert(newOutward);
    }
  };

  const updateOutward = async (id: string, updated: Partial<MaterialOutward>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setOutwards((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_outward').update(updated).eq('id', id);
    }
  };

  const deleteOutward = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete dispatch records.');
      return false;
    }
    setOutwards((prev) => prev.filter((o) => o.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_outward').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('payments').insert(newPayment);
    }
  };

  const updatePayment = async (id: string, updated: Partial<Payment>) => {
    if (updated.party_id) {
      const party = parties.find((p) => p.id === updated.party_id);
      if (party) updated.party_name = party.name;
    }
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('payments').update(updated).eq('id', id);
    }
  };

  const deletePayment = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete payments.');
      return false;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('payments').delete().eq('id', id);
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
    if (supabase) {
      await supabase.from('job_wage_entries').insert(newJob);
    }
  };

  const updateJob = async (id: string, updated: Partial<JobWageEntry>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updated } : j)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('job_wage_entries').update(updated).eq('id', id);
    }
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete production entries.');
      return false;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('job_wage_entries').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('employees').insert(newEmp);
    }
  };

  const updateEmployee = async (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('employees').update(updated).eq('id', id);
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove employee profiles.');
      return false;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('employees').delete().eq('id', id);
    }
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
    if (supabase) {
      await supabase.from('attendance').delete().eq('date', date);
    }
    return true;
  };

  // --- EXPENSES CRUD ---
  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('expenses').insert(newExpense);
    }
  };

  const updateExpense = async (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('expenses').update(updated).eq('id', id);
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete expenses.');
      return false;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    return true;
  };

  const updateSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
  };

  // Ledger Calculations
  const calculatePartyBalance = (partyId: string): number => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return 0;

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

    return (party.opening_balance || 0) + totalOutward - totalInward - received + paid;
  };

  // Accurate Raw Material Stock (Only Mentioned / User Recorded)
  const getRawMaterialStock = (): { [mat: string]: { quantity: number; unit: string } } => {
    const result: { [mat: string]: { quantity: number; unit: string } } = {};
    inwards.forEach((item) => {
      const mat = item.material_type;
      if (!result[mat]) {
        result[mat] = { quantity: 0, unit: item.quantity_unit || 'Ton' };
      }
      result[mat].quantity += item.quantity_mt;
    });
    return result;
  };

  // Finished Goods Yard Stock
  const getProductStock = (): { [prod: string]: { produced: number; dispatched: number; stock: number } } => {
    const result: { [prod: string]: { produced: number; dispatched: number; stock: number } } = {};

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
        users,
        addUser,
        updateUser,
        deleteUser,
        parties,
        inwards,
        outwards,
        payments,
        jobs,
        employees,
        attendance,
        expenses,
        settings,
        activeTab,
        setActiveTab,
        addParty,
        updateParty,
        deleteParty,
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
        updateSettings,
        calculatePartyBalance,
        getRawMaterialStock,
        getProductStock,
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
