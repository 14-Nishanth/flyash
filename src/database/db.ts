import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'flyash_ts.db');

export class Database {
  private static instance: sqlite3.Database;

  public static getDb(): sqlite3.Database {
    if (!Database.instance) {
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      Database.instance = new sqlite3.Database(DB_PATH);
      Database.instance.run('PRAGMA foreign_keys = ON');
    }
    return Database.instance;
  }

  public static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = Database.getDb();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
      });
    });
  }

  public static async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = Database.getDb();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row as T | undefined);
      });
    });
  }

  public static async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const db = Database.getDb();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  public static async init(): Promise<void> {
    const db = Database.getDb();

    await Database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        phone TEXT,
        preferred_language TEXT DEFAULT 'en',
        is_active INTEGER DEFAULT 1,
        employee_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT NOT NULL,
        email TEXT,
        user_role TEXT,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'SUCCESS',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS alert_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_enabled INTEGER DEFAULT 1,
        channel TEXT DEFAULT 'whatsapp',
        phone_number TEXT,
        owner_name TEXT DEFAULT 'Plant Owner',
        owner_email TEXT DEFAULT 'owner@flyash.local',
        email_alerts_enabled INTEGER DEFAULT 1,
        smtp_host TEXT DEFAULT 'smtp.gmail.com',
        smtp_port INTEGER DEFAULT 587,
        smtp_user TEXT,
        smtp_password TEXT,
        api_key TEXT,
        chat_id TEXT,
        telegram_bot_token TEXT,
        telegram_chat_id TEXT,
        daily_digest_enabled INTEGER DEFAULT 1,
        daily_digest_time TEXT DEFAULT '19:00',
        daily_digest_channel TEXT DEFAULT 'both',
        daily_digest_email TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS job_rate_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        job_type TEXT NOT NULL,
        rate_per_piece REAL NOT NULL DEFAULT 0.0,
        pieces_per_tray REAL DEFAULT 105.0,
        wastage_per_tray REAL DEFAULT 5.0,
        opening_stock REAL DEFAULT 0.0,
        unit TEXT DEFAULT 'Pieces / Pcs',
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_name, job_type)
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS employee_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        default_job_type TEXT,
        default_product_name TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        daily_wage REAL DEFAULT 0,
        joining_date DATE DEFAULT (DATE('now')),
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS employee_group_members (
        group_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        PRIMARY KEY(group_id, employee_id),
        FOREIGN KEY(group_id) REFERENCES employee_groups(id) ON DELETE CASCADE,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        party_type TEXT DEFAULT 'customer',
        phone TEXT,
        address TEXT,
        gstin TEXT,
        opening_balance REAL DEFAULT 0.0,
        default_selling_rate REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS party_product_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        party_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        rate REAL NOT NULL DEFAULT 0.0,
        unit TEXT DEFAULT 'Pieces / Pcs',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE CASCADE,
        UNIQUE(party_id, product_name)
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS material_inward (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        party_id INTEGER NOT NULL,
        material_type TEXT DEFAULT 'Fly Ash',
        quantity_mt REAL NOT NULL,
        quantity_unit TEXT DEFAULT 'Ton',
        vehicle_no TEXT,
        rate REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE CASCADE
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS material_outward (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        party_id INTEGER,
        material_type TEXT DEFAULT 'Fly Ash Bricks',
        quantity_mt REAL NOT NULL,
        quantity_unit TEXT DEFAULT 'Pieces',
        vehicle_no TEXT,
        rate REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE SET NULL
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        party_id INTEGER NOT NULL,
        payment_type TEXT NOT NULL,
        amount REAL NOT NULL,
        mode TEXT DEFAULT 'cash',
        reference_no TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE CASCADE
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS party_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        party_id INTEGER NOT NULL,
        date DATE NOT NULL,
        adjustment_type TEXT DEFAULT 'past_unpaid_due',
        amount REAL DEFAULT 0.0,
        reason TEXT NOT NULL,
        reference_no TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE CASCADE
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        category TEXT NOT NULL DEFAULT 'Diesel / Fuel',
        title TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0.0,
        payment_mode TEXT DEFAULT 'cash',
        paid_to TEXT,
        reference_no TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        item_type TEXT DEFAULT 'product',
        item_name TEXT NOT NULL,
        quantity REAL DEFAULT 0.0,
        unit TEXT DEFAULT 'Pieces',
        adjustment_type TEXT DEFAULT 'past_month_stock',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS job_wage_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        group_id INTEGER,
        job_type TEXT NOT NULL,
        product_name TEXT NOT NULL,
        tray_count REAL DEFAULT 0.0,
        pieces_per_tray REAL DEFAULT 105.0,
        wastage_per_tray REAL DEFAULT 5.0,
        total_wastage REAL DEFAULT 0.0,
        gross_quantity REAL DEFAULT 0.0,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Pieces / Pcs',
        rate_per_unit REAL NOT NULL DEFAULT 0.0,
        gross_amount REAL DEFAULT 0.0,
        wastage_amount REAL DEFAULT 0.0,
        total_amount REAL NOT NULL DEFAULT 0.0,
        worker_count INTEGER DEFAULT 1,
        wage_per_worker REAL DEFAULT 0.0,
        vehicle_no TEXT,
        notes TEXT,
        party_id INTEGER,
        payment_status TEXT DEFAULT 'pending',
        payment_mode TEXT,
        payment_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(group_id) REFERENCES employee_groups(id) ON DELETE SET NULL,
        FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE SET NULL
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS employee_job_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_entry_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        allocated_wage REAL NOT NULL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_entry_id) REFERENCES job_wage_entries(id) ON DELETE CASCADE,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        date DATE NOT NULL,
        status TEXT DEFAULT 'present',
        notes TEXT,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(employee_id, date)
      );
    `);

    await Database.run(`
      CREATE TABLE IF NOT EXISTS employee_salary_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        period_from DATE NOT NULL,
        period_to DATE NOT NULL,
        payment_date DATE NOT NULL,
        amount REAL DEFAULT 0.0,
        payment_mode TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'paid',
        reference_no TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );
    `);

    await Database.seedDefaults();
  }

  private static async seedDefaults(): Promise<void> {
    const adminUser = await Database.get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await Database.run(
        `INSERT INTO users (name, email, username, password_hash, role, preferred_language)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Plant Admin', 'admin@flyash.local', 'admin', passwordHash, 'owner', 'en']
      );
      console.log('✅ Default Admin User seeded (admin / admin123)');
    }

    const defaultRates = [
      { product_name: 'Fly Ash Brick 9x4x3', job_type: 'Production', rate: 0.60, tray: 105, waste: 5, unit: 'Pieces / Pcs' },
      { product_name: 'Solid Block 4"', job_type: 'Production', rate: 1.20, tray: 70, waste: 3, unit: 'Pieces / Pcs' },
      { product_name: 'Solid Block 6"', job_type: 'Production', rate: 1.80, tray: 50, waste: 2, unit: 'Pieces / Pcs' },
      { product_name: 'Hollow Block 6"', job_type: 'Production', rate: 2.00, tray: 50, waste: 2, unit: 'Pieces / Pcs' },
      { product_name: 'Fly Ash Brick 9x4x3', job_type: 'Loading Only', rate: 0.25, tray: 105, waste: 0, unit: 'Pieces / Pcs' },
      { product_name: 'Solid Block 4"', job_type: 'Loading Only', rate: 0.40, tray: 70, waste: 0, unit: 'Pieces / Pcs' },
      { product_name: 'Solid Block 6"', job_type: 'Loading Only', rate: 0.55, tray: 50, waste: 0, unit: 'Pieces / Pcs' },
    ];

    for (const r of defaultRates) {
      const existing = await Database.get(
        'SELECT id FROM job_rate_settings WHERE product_name = ? AND job_type = ?',
        [r.product_name, r.job_type]
      );
      if (!existing) {
        await Database.run(
          `INSERT INTO job_rate_settings (product_name, job_type, rate_per_piece, pieces_per_tray, wastage_per_tray, unit)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [r.product_name, r.job_type, r.rate, r.tray, r.waste, r.unit]
        );
      }
    }

    const alertSetting = await Database.get('SELECT id FROM alert_settings LIMIT 1');
    if (!alertSetting) {
      await Database.run(`
        INSERT INTO alert_settings (owner_name, owner_email, is_enabled, daily_digest_enabled)
        VALUES ('Plant Owner', 'admin@flyash.local', 1, 1)
      `);
    }
  }
}
