# 🏭 Fly Ash Manager — TypeScript Edition

[![Node.js CI](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml/badge.svg)](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

An enterprise-grade, industrial Plant & Manufacturing Management System built from the ground up in **TypeScript**, **Node.js**, **Express**, and **SQLite**. Designed specifically for Fly Ash Brick, Solid Block, and Concrete Paver manufacturing plants.

---

## ✨ Features & Architecture

### 📊 1. Executive Plant Dashboard
* **Real-time KPI Telemetry:** Today's brick production, dispatches, raw material inward, and operational expenses.
* **Financial Overview:** Instant breakdown of Customer Receivables vs. Supplier Payables.
* **Accurate Yard & Silo Inventory:** Displays active raw materials and finished product stocks without dummy placeholders.

### 👥 2. Parties & Double-Entry Ledgers
* Complete Customer & Supplier registry with GSTIN and contact details.
* Automated running ledger tracking Inwards, Outwards, Cash/UPI/Bank payments, Adjustments, and Labor charges.
* One-click printable account statements.

### 🚚 3. Materials & Dispatches (Challans)
* **Raw Material Inward:** Fly Ash, Cement, Quarry Dust, Lime, and Gypsum tracking with vehicle numbers and weight metrics.
* **Finished Goods Outward:** Fly Ash Bricks, Solid Blocks (4", 6"), and Hollow Blocks dispatches.
* **1-Click WhatsApp Delivery Challans:** Instantly generate and share delivery receipts directly with truck drivers and clients.

### 🧱 4. Production & Piece-Rate Labor
* **Tray & Track Calculations:** Automatically calculates physical gross pieces based on standard tray stack capacities.
* **Breakage & Wastage Deductions:** Real-time deduction of broken bricks (e.g. 5 pcs/tray cut from payable labor wages).
* **Labor Gang / Team Wage Split:** Distributes net pool wages evenly among assigned gang workers.

### ⏱️ 5. Attendance & Wage Statements
* Daily worker attendance register (Present, Half-Day, Absent).
* Consolidated wage statements combining base daily wages and piece-rate job allocations.
* Weekly wage disbursement tracking.

### ⛽ 6. Plant Expenses
* Categorized logging for Diesel/Fuel, Electricity, Machine Repairs, Spares, and Plant Maintenance.

### 🔔 7. Alerts & Telegram Automation
* Automated shift end daily digest and Telegram bot alerts.

---

## 🛠️ Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or higher, v20+ recommended)
* `npm` (v9+ or higher)

### 1. Clone the repository
```bash
git clone https://github.com/14-Nishanth/flyash.git
cd flyash
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (optional, defaults provided):
```env
PORT=5000
JWT_SECRET=flyash-enterprise-secret-key-2026
DB_PATH=flyash_ts.db
NODE_ENV=development
```

### 4. Run the Application

#### Development Mode (Live reload):
```bash
npm run dev
```

#### Production Mode (Build & Serve):
```bash
npm run build
npm run serve
```

---

## 🔐 Default Admin Credentials
* **URL:** `http://localhost:5000`
* **Username:** `admin`
* **Password:** `admin123`

---

## 📁 Project Structure

```
flyash/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow
├── src/
│   ├── database/
│   │   └── db.ts              # Typed SQLite database engine & migrations
│   ├── routes/
│   │   ├── api.ts             # REST API endpoints
│   │   └── web.ts             # Web UI view controllers
│   ├── services/
│   │   ├── alertService.ts    # Telegram & email automation
│   │   ├── authService.ts     # JWT & password security
│   │   ├── dashboardService.ts# KPI metrics calculation
│   │   ├── employeeService.ts # Attendance & salary register
│   │   ├── expenseService.ts  # Operational expenses
│   │   ├── jobWageService.ts  # Piece-rate production & tray formulas
│   │   ├── materialService.ts # Inward / outward inventory
│   │   └── partyService.ts    # Ledger statements & running balances
│   ├── types/
│   │   └── index.ts           # Strict TypeScript interfaces
│   ├── views/                 # EJS dynamic UI templates
│   │   └── partials/          # Header, footer, nav
│   ├── public/
│   │   ├── css/style.css      # Dynamic theme styles
│   │   └── js/app.js          # Reactive calculators & WhatsApp tools
│   └── index.ts               # Express server entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📄 License
This project is licensed under the ISC License.
