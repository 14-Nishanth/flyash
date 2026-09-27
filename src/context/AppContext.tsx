import React, { createContext, useContext, useState, useEffect } from 'react';
import { Party, MaterialInward, MaterialOutward, Payment, JobWageEntry, Employee, AttendanceRecord, Expense, AlertSettings } from '../types';
import { getSupabaseClient } from '../lib/supabase';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
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
  addParty: (party: Omit<Party, 'id' | 'created_at'>) => Promise<void>;
  addInward: (inward: Omit<MaterialInward, 'id' | 'created_at'>) => Promise<void>;
  addOutward: (outward: Omit<MaterialOutward, 'id' | 'created_at'>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  addJob: (job: Omit<JobWageEntry, 'id' | 'created_at'>) => Promise<void>;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  saveAttendance: (date: string, records: { employee_id: string; status: any; notes?: string }[]) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  updateSettings: (newSettings: AlertSettings) => void;
  calculatePartyBalance: (partyId: string) => number;
  getRawMaterialStock: () => { [mat: string]: { quantity: number; unit: string } };
  getProductStock: () => { [prod: string]: { produced: number; dispatched: number; stock: number } };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('flyash_theme') as 'dark' | 'light') || 'dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem('flyash_parties');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Ram Construction', party_type: 'customer', phone: '9876543210', gstin: '33AAAAA0000A1Z5', opening_balance: 0, created_at: new Date().toISOString() },
      { id: '2', name: 'NLC Flyash Supplier', party_type: 'supplier', phone: '9876500000', opening_balance: 0, created_at: new Date().toISOString() },
    ];
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
      { id: '3', name: 'Ravi', role: 'Laborer', daily_wage: 500, joining_date: '2026-01-01', is_active: true },
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

  // Sync to local storage
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

  // Supabase Cloud Sync on mount if available
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    async function fetchData() {
      try {
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
        console.warn('Supabase fetch failed, working with local cache:', err);
      }
    }
    fetchData();
  }, []);

  // Action methods
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

  const addInward = async (inward: Omit<MaterialInward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === inward.party_id);
    const newInward: MaterialInward = {
      ...inward,
      party_name: party?.name || 'Unassigned Supplier',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setInwards((prev) => [newInward, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_inward').insert(newInward);
    }
  };

  const addOutward = async (outward: Omit<MaterialOutward, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === outward.party_id);
    const newOutward: MaterialOutward = {
      ...outward,
      party_name: party?.name || 'Walk-in Customer',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setOutwards((prev) => [newOutward, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('material_outward').insert(newOutward);
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    const party = parties.find((p) => p.id === payment.party_id);
    const newPayment: Payment = {
      ...payment,
      party_name: party?.name || '',
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('payments').insert(newPayment);
    }
  };

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
        addInward,
        addOutward,
        addPayment,
        addJob,
        addEmployee,
        saveAttendance,
        addExpense,
        updateSettings,
        calculatePartyBalance,
        getRawMaterialStock,
        getProductStock,
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
