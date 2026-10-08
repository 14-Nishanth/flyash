# 🏭 Fly Ash Plant Management System (React + TypeScript + Vite + Supabase)

[![Deploy to GitHub Pages](https://github.com/14-Nishanth/flyash/actions/workflows/deploy.yml/badge.svg)](https://github.com/14-Nishanth/flyash/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Website-GitHub_Pages-22c55e?style=for-the-badge)](https://14-nishanth.github.io/flyash/)
[![Supabase Database](https://img.shields.io/badge/🗄️_Supabase_Database-Table_Editor-3ecf8e?style=for-the-badge)](https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor)

---

### 🌐 Live Application & Database Links

- 🚀 **Live Application (Web & Mobile)**: 👉 **[https://14-nishanth.github.io/flyash/](https://14-nishanth.github.io/flyash/)**
- 🗄️ **Supabase Cloud Database Tables**: 👉 **[https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor](https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor)**
- 🏢 **Supabase Project Dashboard**: 👉 **[https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu](https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu)**

*(Click the link above to view and manage all database tables directly in your browser!)*

---

### 🔑 Default Login Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Plant Administrator** | `admin` | `admin123` | Full access: View, Add, Edit, Delete all records & Manage Staff Accounts |
| **Plant Owner** | `owner` | `owner123` | Full access: View, Add, Edit, Delete all records & Financial Reports |
| **Data Entry Operator** | `operator` | `operator123` | Can **Add** and **Edit** all plant data, but **cannot delete** records |

---

### 🗄️ Supabase Cloud Database Tables

| Table Name | Description & Contents |
| :--- | :--- |
| **`parties`** | Customer, Supplier, and Transporter profiles with opening balance & contact info |
| **`party_adjustments`** | Credit Notes (+ Party owes me) and Debit Notes (+ I need to pay / vouchers) |
| **`material_inward`** | Raw Material Purchases (Fly Ash, Cement, Quarry Dust, Cool Dust, Lime, Gypsum) |
| **`material_outward`** | Finished Goods Dispatches (Fly Ash Bricks, Solid Blocks 4"/6", Hollow Blocks) |
| **`payments`** | Receipts received from customers and payments made to suppliers |
| **`expenses`** | Operational expenses, Raw material purchases, and Supplier due payments |
| **`job_wage_entries`** | Daily piece-rate production batches, gang wage splits, tray counts, and wastage cuts |
| **`employees`** | Worker master records with daily wages and active statuses |
| **`attendance`** | Daily worker muster roll (Present / Absent / Half-Day) |
| **`worker_groups`** | Production gangs and customized wage split percentages/shares |
| **`product_rates`** | Product catalog master rates (labor rates, selling prices, pieces/tray) |
| **`app_users`** | Authenticated staff user accounts with hashed passwords and roles |

Direct Table Editor URL:
👉 **[https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor](https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor)**

---

### ✨ Core System Capabilities

1. **Party Credit / Debit Management:**
   - **Credit (+)**: Parties who need to pay to me (Customer receivables).
   - **Debit (-)**: Who I need to pay (Supplier dues & payables).
   - Dynamic **"Remaining Amount to Pay"** calculation on all statements & party cards.
2. **Raw Material Expenses & Supplier Due Settlement:**
   - Buy materials (Fly Ash, Cement in bags/MT, Quarry Dust, Cool Dust) with full due, instant payment, or partial payment.
   - 1-Click **"Pay Outstanding Due"** to pay amounts toward supplier debts and instantly reduce remaining balance.
3. **Mobile & Desktop Standalone App (Locked Zoom):**
   - Locked fixed viewport scale preventing accidental zooming in/out.
   - PWA support for standalone installation on Windows (Chrome/Edge) and Android/iOS.
4. **Full Edit & Delete Across All Modules:** Inward raw materials, outward customer dispatches, parties, piece-rate production logs, worker profiles, attendance logs, and operational expenses.
5. **Role-Based Access Control:** Administrators can create new user logins for staff. Operators are permitted to add/edit data, while delete operations are strictly locked for administrator accounts.
6. **Automated Duplicate Warning Popup:** Prevents accidental double entry of materials, vehicles, parties, expenses, or production batches with an interactive popup dialog.
7. **Executive Plant Dashboard:** Real-time production telemetry, dispatches, receivables vs. payables, and accurate active raw inventory stock.
8. **1-Click WhatsApp Statements & Delivery Challans:** Instantly generate and share delivery receipts and party account statements.
9. **Daily Attendance Register & Consolidated Wage Sheet:** Worker attendance tracking and combined salary calculation.
10. **Permanent Supabase Cloud Sync:** Direct PostgreSQL connection with real-time cloud storage and offline-resilient local cache.

---

### ⚡ Running via GitHub Pages

1. Go to your repository settings: **[https://github.com/14-Nishanth/flyash/settings/pages](https://github.com/14-Nishanth/flyash/settings/pages)**
2. Under **Build and deployment** $\rightarrow$ **Source**, choose either **`Deploy from a branch` (Branch: `gh-pages` / `root`)** or **`GitHub Actions`**.
3. Open **`https://14-nishanth.github.io/flyash/`** to run the app live.

---

### 🛠️ Local Development

```bash
git clone https://github.com/14-Nishanth/flyash.git
cd flyash
npm install
npm run dev
```

Open **`http://localhost:3000/flyash/`** in your browser.
