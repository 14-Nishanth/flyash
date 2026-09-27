# 🏭 Fly Ash Manager — React + TypeScript + Vite + Supabase

[![Node.js CI](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml/badge.svg)](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A modern, cloud-connected industrial Manufacturing & Plant Management System built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

---

## ✨ Features & Modules

### 📊 1. Executive Plant Dashboard
* **Live Factory Telemetry:** Today's brick production, dispatches, raw material inward receipts, and operational expenses.
* **Accurate Material Inventory:** Displays only raw materials you actually record (Fly Ash, Cement, Quarry Dust, etc.) without dummy placeholder items.
* **Financial Balances:** Instant summary of Customer Receivables vs. Supplier Payables.

### 👥 2. Parties & Double-Entry Ledgers
* Customer & Supplier accounts directory.
* Automated double-entry running ledger statement with printable sheets.
* Record payments (Cash, UPI, Bank Transfer, Cheque) with instant balance recalculation.

### 🚚 3. Materials & 1-Click WhatsApp Delivery Challans
* Raw material inward tracking (with unit options: Ton, Bags, Kg).
* Finished goods dispatch register.
* **1-Click WhatsApp Delivery Slip Generator:** Instantly share formatted delivery slips to drivers and customers.

### 🧱 4. Production & Live Reactive Piece-Rate Calculator
* **Tray & Track Multiplier:** Computes physical gross pieces based on tray counts.
* **Breakage Cut Deduction:** Deducts broken units from payable labor wages in real-time.
* **Labor Gang / Worker Allocations:** Automatically splits the net labor pool evenly among selected gang workers.

### ⏱️ 5. Worker Attendance & Consolidated Wage Sheets
* Daily attendance register (Present, Half-Day, Absent).
* Combined wage sheet (Base daily wage + Piece-rate allocations).

### ⛽ 6. Plant Expenses
* Categorized logging for Diesel/Fuel, Electricity, Spares, and Plant Maintenance.

### ⚡ 7. Supabase PostgreSQL Cloud Sync
* Plug in your Supabase Project URL and Anon Key in **Settings** to sync data live across team devices.
* Includes offline persistence mode so the entire app works seamlessly both online and offline.

---

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/14-Nishanth/flyash.git
cd flyash
npm install
```

### 2. Configure Environment (Optional)
Create `.env` file in the root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(Or enter your Supabase credentials directly in the in-app **Settings** page).*

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Build for Production (Static Deployable to Vercel, Netlify, GitHub Pages)
```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase PostgreSQL Setup
To set up your cloud database on Supabase:
1. Create a free project on [Supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy and run the SQL migration script from [`src/supabase_schema.sql`](./src/supabase_schema.sql).
4. Copy your project API URL & anon key into the app **Settings**.

---

## 📄 License
ISC License
