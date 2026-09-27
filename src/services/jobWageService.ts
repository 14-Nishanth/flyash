import { Database } from '../database/db';
import { EmployeeGroup, JobRateSetting, JobWageEntry } from '../types';

export class JobWageService {
  public static async getJobRates(): Promise<JobRateSetting[]> {
    return await Database.query<JobRateSetting>('SELECT * FROM job_rate_settings ORDER BY product_name ASC, job_type ASC');
  }

  public static async getJobRateByProductAndType(productName: string, jobType: string): Promise<JobRateSetting | undefined> {
    return await Database.get<JobRateSetting>(
      'SELECT * FROM job_rate_settings WHERE product_name = ? AND job_type = ?',
      [productName, jobType]
    );
  }

  public static async saveJobRate(rate: Partial<JobRateSetting>): Promise<void> {
    const existing = await this.getJobRateByProductAndType(rate.product_name!, rate.job_type!);
    if (existing) {
      await Database.run(
        `UPDATE job_rate_settings 
         SET rate_per_piece = ?, pieces_per_tray = ?, wastage_per_tray = ?, opening_stock = ?, unit = ?, notes = ?
         WHERE id = ?`,
        [
          rate.rate_per_piece,
          rate.pieces_per_tray,
          rate.wastage_per_tray,
          rate.opening_stock,
          rate.unit || 'Pieces / Pcs',
          rate.notes || null,
          existing.id,
        ]
      );
    } else {
      await Database.run(
        `INSERT INTO job_rate_settings (product_name, job_type, rate_per_piece, pieces_per_tray, wastage_per_tray, opening_stock, unit, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rate.product_name,
          rate.job_type,
          rate.rate_per_piece,
          rate.pieces_per_tray,
          rate.wastage_per_tray,
          rate.opening_stock || 0,
          rate.unit || 'Pieces / Pcs',
          rate.notes || null,
        ]
      );
    }
  }

  // Groups
  public static async getGroups(): Promise<EmployeeGroup[]> {
    const groups = await Database.query<EmployeeGroup>('SELECT * FROM employee_groups ORDER BY name ASC');
    return await Promise.all(
      groups.map(async (g) => {
        const members = await Database.query<any>(
          `SELECT e.* FROM employees e
           INNER JOIN employee_group_members egm ON e.id = egm.employee_id
           WHERE egm.group_id = ?`,
          [g.id]
        );
        return {
          ...g,
          members,
          member_ids: members.map((m) => m.id),
        };
      })
    );
  }

  public static async createGroup(name: string, description?: string, memberIds: number[] = []): Promise<number> {
    const res = await Database.run('INSERT INTO employee_groups (name, description) VALUES (?, ?)', [
      name,
      description || null,
    ]);
    const groupId = res.lastID;
    for (const empId of memberIds) {
      await Database.run('INSERT INTO employee_group_members (group_id, employee_id) VALUES (?, ?)', [
        groupId,
        empId,
      ]);
    }
    return groupId;
  }

  // Job Wage Entries
  public static async getJobWageEntries(): Promise<JobWageEntry[]> {
    const entries = await Database.query<JobWageEntry>(`
      SELECT j.*, g.name as group_name, p.name as party_name
      FROM job_wage_entries j
      LEFT JOIN employee_groups g ON j.group_id = g.id
      LEFT JOIN parties p ON j.party_id = p.id
      ORDER BY j.date DESC, j.id DESC
    `);

    return await Promise.all(
      entries.map(async (entry) => {
        const allocations = await Database.query<any>(
          `SELECT a.*, e.name as employee_name 
           FROM employee_job_allocations a
           LEFT JOIN employees e ON a.employee_id = e.id
           WHERE a.job_entry_id = ?`,
          [entry.id]
        );
        return {
          ...entry,
          allocations,
        };
      })
    );
  }

  public static async createJobWageEntry(
    data: Partial<JobWageEntry>,
    selectedWorkerIds: number[] = []
  ): Promise<number> {
    const trayCount = data.tray_count || 0;
    const piecesPerTray = data.pieces_per_tray || 105;
    const wastagePerTray = data.wastage_per_tray || 5;
    const ratePerUnit = data.rate_per_unit || 0;

    let grossQty = data.gross_quantity || 0;
    let totalWastage = data.total_wastage || 0;
    let netQty = data.quantity || 0;

    if (trayCount > 0) {
      grossQty = trayCount * piecesPerTray;
      totalWastage = trayCount * wastagePerTray;
      netQty = grossQty - totalWastage;
    }

    const grossAmount = Math.round(grossQty * ratePerUnit * 100) / 100;
    const wastageAmount = Math.round(totalWastage * ratePerUnit * 100) / 100;
    const totalAmount = Math.round(netQty * ratePerUnit * 100) / 100;

    const workerCount = selectedWorkerIds.length > 0 ? selectedWorkerIds.length : (data.worker_count || 1);
    const wagePerWorker = Math.round((totalAmount / workerCount) * 100) / 100;

    const res = await Database.run(
      `INSERT INTO job_wage_entries (
        date, group_id, job_type, product_name, tray_count, pieces_per_tray,
        wastage_per_tray, total_wastage, gross_quantity, quantity, unit,
        rate_per_unit, gross_amount, wastage_amount, total_amount, worker_count,
        wage_per_worker, vehicle_no, notes, party_id, payment_status, payment_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.group_id || null,
        data.job_type || 'Production',
        data.product_name,
        trayCount,
        piecesPerTray,
        wastagePerTray,
        totalWastage,
        grossQty,
        netQty,
        data.unit || 'Pieces / Pcs',
        ratePerUnit,
        grossAmount,
        wastageAmount,
        totalAmount,
        workerCount,
        wagePerWorker,
        data.vehicle_no || null,
        data.notes || null,
        data.party_id || null,
        data.payment_status || 'pending',
        data.payment_mode || null,
      ]
    );

    const entryId = res.lastID;

    // Distribute allocations
    for (const empId of selectedWorkerIds) {
      await Database.run(
        `INSERT INTO employee_job_allocations (job_entry_id, employee_id, allocated_wage)
         VALUES (?, ?, ?)`,
        [entryId, empId, wagePerWorker]
      );
    }

    return entryId;
  }

  public static async deleteJobWageEntry(id: number): Promise<void> {
    await Database.run('DELETE FROM job_wage_entries WHERE id = ?', [id]);
  }
}
