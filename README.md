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

### 🔐 Secure company sign-in and shared sync

The old public demo passwords have been removed. Sign in with a Supabase Auth company email account whose **app metadata** contains:

```json
{
  "role": "admin",
  "flyash_access": true
}
```

For first-admin setup, migration details, user management, and the two-device verification checklist, see [Cloud Sync Setup](docs/CLOUD_SYNC_SETUP.md).

### 🗄️ Shared cloud data

| Store | Purpose |
| :--- | :--- |
| **`app_records`** | Canonical authenticated, realtime store for all app business records, settings, and soft-delete recovery markers |
| **`parties`**, **`employees`** | Existing source tables preserved and copied into the shared store during migration |
| **Other legacy tables** | Retained for compatibility and historical inspection; new app edits use `app_records` |

The new migration is additive. It does not drop, truncate, or reset existing tables. Access to `app_records` is restricted by Row Level Security to authenticated users with server-controlled FlyAsh access metadata.

Direct Table Editor:
👉 **[Supabase project tables](https://supabase.com/dashboard/project/laqpdlasfxearjtnnouu/editor)**

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
10. **Authenticated Supabase Cloud Sync:** Shared records sync across signed-in devices through Realtime, with queued writes and visible sync errors when a connection is unavailable.

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
