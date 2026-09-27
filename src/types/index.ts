export type UserRole = 'owner' | 'admin' | 'operator' | 'accountant' | 'staff';

export type JobType = 'Production' | 'Loading Only' | 'Unloading Only' | 'Both Loading & Unloading' | 'Custom';

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque';

export type PaymentType = 'received' | 'paid';

export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface User {
  id: number;
  name: string;
  email?: string | null;
  username: string;
  password_hash: string;
  role: UserRole;
  phone?: string | null;
  preferred_language: string;
  is_active: boolean;
  employee_id?: number | null;
  created_at: string;
}

export interface Party {
  id: number;
  name: string;
  party_type: 'supplier' | 'customer' | 'both';
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  opening_balance: number; // positive = party owes us, negative = we owe party
  default_selling_rate: number;
  created_at: string;
}

export interface PartyProductRate {
  id: number;
  party_id: number;
  product_name: string;
  rate: number;
  unit: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialInward {
  id: number;
  date: string; // YYYY-MM-DD
  party_id: number;
  material_type: string; // Fly Ash, Cement, Quarry Dust, Lime, Gypsum
  quantity_mt: number;
  quantity_unit: string; // Ton, Bags, MT
  vehicle_no?: string | null;
  rate: number;
  amount: number;
  notes?: string | null;
  created_at: string;
  party_name?: string;
}

export interface MaterialOutward {
  id: number;
  date: string; // YYYY-MM-DD
  party_id?: number | null;
  material_type: string; // Fly Ash Bricks, Solid Blocks 4", Solid Blocks 6", Fly Ash
  quantity_mt: number; // Quantity / Pcs
  quantity_unit: string; // Pieces, Ton
  vehicle_no?: string | null;
  rate: number;
  amount: number;
  notes?: string | null;
  created_at: string;
  party_name?: string;
}

export interface Payment {
  id: number;
  date: string;
  party_id: number;
  payment_type: PaymentType;
  amount: number;
  mode: PaymentMode;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
  party_name?: string;
}

export interface PartyAdjustment {
  id: number;
  party_id: number;
  date: string;
  adjustment_type: 'past_unpaid_due' | 'past_advance' | 'discount_waiver' | 'debit' | 'credit';
  amount: number;
  reason: string;
  reference_no?: string | null;
  created_at: string;
  party_name?: string;
}

export interface JobRateSetting {
  id: number;
  product_name: string; // e.g. Fly Ash Brick, Solid Block 4", Solid Block 6"
  job_type: string; // Production, Loading Only, etc.
  rate_per_piece: number;
  pieces_per_tray: number;
  wastage_per_tray: number;
  opening_stock: number;
  unit: string;
  notes?: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface EmployeeGroup {
  id: number;
  name: string;
  description?: string | null;
  default_job_type?: string | null;
  default_product_name?: string | null;
  is_active: boolean;
  created_at: string;
  member_ids?: number[];
  members?: Employee[];
}

export interface Employee {
  id: number;
  name: string;
  phone?: string | null;
  role?: string | null;
  daily_wage: number;
  joining_date: string;
  is_active: boolean;
  created_at: string;
}

export interface JobWageEntry {
  id: number;
  date: string;
  group_id?: number | null;
  job_type: string;
  product_name: string;
  tray_count: number;
  pieces_per_tray: number;
  wastage_per_tray: number;
  total_wastage: number;
  gross_quantity: number;
  quantity: number; // Net payable pieces
  unit: string;
  rate_per_unit: number;
  gross_amount: number;
  wastage_amount: number;
  total_amount: number; // Net total wage pool
  worker_count: number;
  wage_per_worker: number;
  vehicle_no?: string | null;
  notes?: string | null;
  party_id?: number | null;
  payment_status: 'pending' | 'received' | 'not_applicable';
  payment_mode?: PaymentMode | null;
  payment_reference?: string | null;
  created_at: string;
  group_name?: string;
  party_name?: string;
  allocations?: EmployeeJobAllocation[];
}

export interface EmployeeJobAllocation {
  id: number;
  job_entry_id: number;
  employee_id: number;
  allocated_wage: number;
  created_at: string;
  employee_name?: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  employee_name?: string;
}

export interface EmployeeSalaryPayment {
  id: number;
  employee_id: number;
  period_from: string;
  period_to: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  status: string;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
  employee_name?: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  title: string;
  amount: number;
  payment_mode: PaymentMode;
  paid_to?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface StockAdjustment {
  id: number;
  date: string;
  item_type: 'product' | 'raw_material';
  item_name: string;
  quantity: number;
  unit: string;
  adjustment_type: 'past_month_stock' | 'opening_balance' | 'physical_correction' | 'wastage_loss';
  notes?: string | null;
  created_at: string;
}

export interface AlertSettings {
  id: number;
  is_enabled: boolean;
  channel: string;
  phone_number?: string | null;
  owner_name: string;
  owner_email: string;
  email_alerts_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user?: string | null;
  smtp_password?: string | null;
  api_key?: string | null;
  chat_id?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  daily_digest_channel: string;
  daily_digest_email?: string | null;
  updated_at: string;
}

export interface DashboardSummary {
  todayInwardTons: number;
  todayInwardCost: number;
  todayOutwardUnits: number;
  todayOutwardRevenue: number;
  todayProductionUnits: number;
  todayLaborWages: number;
  todayExpenses: number;
  totalReceivables: number;
  totalPayables: number;
  rawMaterialStocks: { [material: string]: number };
  productStocks: { [product: string]: number };
  recentInwards: MaterialInward[];
  recentOutwards: MaterialOutward[];
  recentJobs: JobWageEntry[];
  recentExpenses: Expense[];
}
