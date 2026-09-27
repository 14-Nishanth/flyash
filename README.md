# 🏭 Fly Ash Manager — TypeScript Edition

[![Node.js CI](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml/badge.svg)](https://github.com/14-Nishanth/flyash/actions/workflows/ci.yml)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?repo=14-Nishanth/flyash)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](LICENSE)

An enterprise-grade, industrial Plant & Manufacturing Management System built in **TypeScript**, **Node.js**, **Express**, and **SQLite**. Designed specifically for Fly Ash Brick, Solid Block, and Concrete Paver manufacturing plants.

---

## ⚡ How to Run

### Option 1: Run directly inside GitHub in 1-Click (GitHub Codespaces)
You can run this entire fullstack app directly inside GitHub in your browser without installing anything on your PC:
1. Click the **[Open in GitHub Codespaces](https://github.com/codespaces/new?repo=14-Nishanth/flyash)** badge above (or click the green `<> Code` button on GitHub $\to$ **Codespaces** $\to$ **Create codespace on main**).
2. GitHub will automatically install dependencies, build TypeScript, and launch the web server.
3. A popup will appear in the bottom-right corner saying **"Open in Browser"** on Port 5000. Click it to use the app!

---

### Option 2: Run Locally on your Computer

#### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or v20+)
* `npm`

#### Commands:
```bash
# 1. Clone the repository
git clone https://github.com/14-Nishanth/flyash.git
cd flyash

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Or build and start production server
npm run build
npm run serve
```
Open **`http://localhost:5000`** in your browser.

---

### Option 3: Free 1-Click Cloud Deployment (Render / Railway)
1. Go to [Render.com](https://render.com) (free account).
2. Click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository `14-Nishanth/flyash`.
4. It will auto-detect the provided `render.yaml` and deploy a live public HTTPS website URL for your plant!

---

## 🔐 Default Login Credentials
* **Username:** `admin`
* **Password:** `admin123`

---

## ✨ Features & Modules
* **Executive Plant Dashboard:** Real-time production telemetry, outward dispatches, and financial receivables/payables.
* **Accurate Material Inventory:** Displays only raw materials you actually record (Fly Ash, Cement, Dust, etc.).
* **Parties & Ledgers:** Automatic double-entry accounting ledger with printable statements.
* **Production & Labor Wages:** Tray multiplier, breakage cut deduction, and gang allocations.
* **Daily Attendance Register:** Present, Half-day, Absent worker attendance.
* **1-Click WhatsApp Delivery Challans:** Instantly send formatted delivery slips to drivers & customers.
* **Yard Sunlight & Dark Themes:** Dual theme for outdoor and indoor factory environments.

---

## 📄 License
ISC License
