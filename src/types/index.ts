export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque';
export type PaymentType = 'received' | 'paid';
export type AttendanceStatus = 'present' | 'absent' | 'half-day';

export interface Party {
  id: string;
  name: string;
  party_type: 'customer' | 'supplier' | 'both';
  phone?: string;
  address?: string;
  gstin?: string;
  opening_balance: number;
  created_at: string;
}

export interface MaterialInward {
  id: string;
  date: string;
  party_id: string;
  party_name?: string;
  material_type: string; // Fly Ash, Cement, Quarry Dust, Lime, Gypsum, etc.
  quantity_mt: number;
  quantity_unit: string; // Ton, Bags, MT, Kg
  vehicle_no?: string;
  rate: number;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface MaterialOutward {
  id: string;
  date: string;
  party_id?: string;
  party_name?: string;
  material_type: string; // Fly Ash Bricks, Solid Blocks 4", Solid Blocks 6", Hollow Blocks
  quantity_mt: number;
  quantity_unit: string; // Pieces, Units, Tons
  vehicle_no?: string;
  rate: number;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  date: string;
  party_id: string;
  party_name?: string;
  payment_type: PaymentType;
  amount: number;
  mode: PaymentMode;
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export interface PartyAdjustment {
  id: string;
  party_id: string;
  date: string;
  adjustment_type: 'past_unpaid_due' | 'past_advance' | 'discount_waiver';
  amount: number;
  reason: string;
  reference_no?: string;
  created_at: string;
}

export interface JobRateSetting {
  id: string;
  product_name: string;
  job_type: string;
  rate_per_piece: number;
  pieces_per_tray: number;
  wastage_per_tray: number;
  opening_stock: number;
  unit: string;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  daily_wage: number;
  joining_date: string;
  is_active: boolean;
}

export interface JobWageEntry {
  id: string;
  date: string;
  group_name?: string;
  job_type: string;
  product_name: string;
  tray_count: number;
  pieces_per_tray: number;
  wastage_per_tray: number;
  total_wastage: number;
  gross_quantity: number;
  quantity: number; // Net payable pieces
  rate_per_unit: number;
  gross_amount: number;
  wastage_amount: number;
  total_amount: number;
  worker_count: number;
  wage_per_worker: number;
  worker_ids?: string[];
  vehicle_no?: string;
  notes?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  title: string;
  amount: number;
  payment_mode: PaymentMode;
  paid_to?: string;
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export interface AlertSettings {
  supabase_url?: string;
  supabase_anon_key?: string;
  owner_name: string;
  owner_phone?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  daily_digest_enabled: boolean;
  daily_digest_time: string;
}
