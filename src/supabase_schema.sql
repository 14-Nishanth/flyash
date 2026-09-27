-- Fly Ash Plant Management System - Supabase PostgreSQL Schema

-- 1. Parties (Customers & Suppliers)
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party_type TEXT DEFAULT 'customer',
  phone TEXT,
  address TEXT,
  gstin TEXT,
  opening_balance NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Material Inward (Raw Materials)
CREATE TABLE IF NOT EXISTS material_inward (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  party_name TEXT,
  material_type TEXT NOT NULL DEFAULT 'Fly Ash',
  quantity_mt NUMERIC NOT NULL,
  quantity_unit TEXT DEFAULT 'Ton',
  vehicle_no TEXT,
  rate NUMERIC DEFAULT 0.0,
  amount NUMERIC DEFAULT 0.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Material Outward (Finished Goods Dispatches)
CREATE TABLE IF NOT EXISTS material_outward (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  party_name TEXT,
  material_type TEXT NOT NULL DEFAULT 'Fly Ash Bricks 9x4x3',
  quantity_mt NUMERIC NOT NULL,
  quantity_unit TEXT DEFAULT 'Pieces',
  vehicle_no TEXT,
  rate NUMERIC DEFAULT 0.0,
  amount NUMERIC DEFAULT 0.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments (Received / Paid)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  party_name TEXT,
  payment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  mode TEXT DEFAULT 'cash',
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Production & Piece-Rate Job Entries
CREATE TABLE IF NOT EXISTS job_wage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  group_name TEXT,
  job_type TEXT NOT NULL DEFAULT 'Production',
  product_name TEXT NOT NULL,
  tray_count NUMERIC DEFAULT 0,
  pieces_per_tray NUMERIC DEFAULT 105,
  wastage_per_tray NUMERIC DEFAULT 5,
  total_wastage NUMERIC DEFAULT 0,
  gross_quantity NUMERIC DEFAULT 0,
  quantity NUMERIC NOT NULL,
  rate_per_unit NUMERIC NOT NULL DEFAULT 0.60,
  gross_amount NUMERIC DEFAULT 0,
  wastage_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  worker_count INTEGER DEFAULT 1,
  wage_per_worker NUMERIC DEFAULT 0,
  vehicle_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'Laborer',
  daily_wage NUMERIC DEFAULT 0,
  joining_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Daily Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Plant Operational Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Diesel / Fuel',
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  paid_to TEXT,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. App Users (Role-based access: Admin, Owner, Operator)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Worker Gangs & Groups
CREATE TABLE IF NOT EXISTS worker_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  member_ids JSONB DEFAULT '[]'::jsonb,
  split_type TEXT DEFAULT 'equal',
  member_shares JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Master Product & Material Rates
CREATE TABLE IF NOT EXISTS product_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Solid Block',
  size TEXT,
  unit TEXT DEFAULT 'Pieces',
  labor_rate_per_unit NUMERIC DEFAULT 0.60,
  selling_rate_per_unit NUMERIC DEFAULT 32.0,
  pieces_per_tray NUMERIC DEFAULT 105,
  wastage_per_tray NUMERIC DEFAULT 5,
  opening_stock NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inward ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_outward ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_wage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_rates ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous access for standard plant users
CREATE POLICY "Public Read All" ON parties FOR ALL USING (true);
CREATE POLICY "Public Read All Inward" ON material_inward FOR ALL USING (true);
CREATE POLICY "Public Read All Outward" ON material_outward FOR ALL USING (true);
CREATE POLICY "Public Read All Payments" ON payments FOR ALL USING (true);
CREATE POLICY "Public Read All Jobs" ON job_wage_entries FOR ALL USING (true);
CREATE POLICY "Public Read All Employees" ON employees FOR ALL USING (true);
CREATE POLICY "Public Read All Attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Public Read All Expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Public Read All Users" ON app_users FOR ALL USING (true);
CREATE POLICY "Public Read All Groups" ON worker_groups FOR ALL USING (true);
CREATE POLICY "Public Read All ProductRates" ON product_rates FOR ALL USING (true);


