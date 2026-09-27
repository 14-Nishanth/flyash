# 🏭 Fly Ash Plant Management System (React + TypeScript + Vite + Supabase)

[![Deploy to GitHub Pages](https://github.com/14-Nishanth/flyash/actions/workflows/deploy.yml/badge.svg)](https://github.com/14-Nishanth/flyash/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Website-GitHub_Pages-22c55e?style=for-the-badge)](https://14-nishanth.github.io/flyash/)

---

### 🌐 Live Application Link
👉 **[https://14-nishanth.github.io/flyash/](https://14-nishanth.github.io/flyash/)**

*(Click the link above to run and use the full live application directly on any smartphone, tablet, or desktop!)*

---

### 🔑 Login Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Plant Administrator** | `admin` | `admin123` | Full access: View, Add, Edit, Delete all records & Manage Users |
| **Plant Owner** | `owner` | `owner123` | Full access: View, Add, Edit, Delete all records & Financial Reports |
| **Data Entry Operator** | `operator` | `operator123` | Can **Add** and **Edit** all plant data, but **cannot delete** any records |

---

### ✨ Core Capabilities

1. **Light Theme Industrial UI:** Crisp typography, high-contrast layouts, clean white surfaces, and vibrant status badges. Includes a dual sunlight/dark theme toggle in the header.
2. **Full Edit & Delete Across All Fields:** Inward raw materials, outward customer dispatches, parties directory, piece-rate production logs, worker profiles, attendance logs, and operational expenses.
3. **Role-Based Access Control:** Administrators can create new user logins for staff/data entry operators. Operators are permitted to add/edit data, while delete operations are strictly locked for administrator accounts.
4. **Automated Duplicate Warning Popup:** Prevents accidental double entry of materials, vehicles, parties, expenses, or production batches with an interactive popup dialog.
5. **Executive Plant Dashboard:** Real-time production telemetry, dispatches, receivables vs. payables, and accurate active raw inventory stock.
6. **1-Click WhatsApp Delivery Challans:** Instantly generate and share delivery receipts with truck drivers & customers.
7. **Live Reactive Piece-Rate Calculator:** Dynamically computes Gross Pcs, Breakage Wastage Cut, Net Payable Units, and Gang Wage distribution as you enter tray counts.
8. **Parties & Double-Entry Ledgers:** Customer & Supplier accounts with printable statement sheets and payment logging.
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

Open **`http://localhost:3000`** in your browser.
