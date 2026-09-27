import { Database } from '../database/db';
import { Attendance, Employee, EmployeeSalaryPayment } from '../types';

export class EmployeeService {
  public static async getAllEmployees(): Promise<Employee[]> {
    return await Database.query<Employee>('SELECT * FROM employees ORDER BY name ASC');
  }

  public static async getEmployeeById(id: number): Promise<Employee | undefined> {
    return await Database.get<Employee>('SELECT * FROM employees WHERE id = ?', [id]);
  }

  public static async createEmployee(data: Partial<Employee>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO employees (name, phone, role, daily_wage, joining_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.phone || null,
        data.role || 'Laborer',
        data.daily_wage || 0,
        data.joining_date || new Date().toISOString().split('T')[0],
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      ]
    );
    return res.lastID;
  }

  public static async updateEmployee(id: number, data: Partial<Employee>): Promise<void> {
    await Database.run(
      `UPDATE employees
       SET name = ?, phone = ?, role = ?, daily_wage = ?, is_active = ?
       WHERE id = ?`,
      [
        data.name,
        data.phone,
        data.role,
        data.daily_wage,
        data.is_active ? 1 : 0,
        id,
      ]
    );
  }

  public static async deleteEmployee(id: number): Promise<void> {
    await Database.run('DELETE FROM employees WHERE id = ?', [id]);
  }

  // Attendance
  public static async getAttendanceForDate(date: string): Promise<any[]> {
    const employees = await this.getAllEmployees();
    const attendanceRecords = await Database.query<Attendance>(
      'SELECT * FROM attendance WHERE date = ?',
      [date]
    );

    const map = new Map<number, Attendance>();
    attendanceRecords.forEach((a) => map.set(a.employee_id, a));

    return employees.map((emp) => ({
      employee: emp,
      status: map.get(emp.id)?.status || 'present',
      notes: map.get(emp.id)?.notes || '',
    }));
  }

  public static async saveAttendance(date: string, records: { employee_id: number; status: string; notes?: string }[]): Promise<void> {
    for (const r of records) {
      const existing = await Database.get(
        'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
        [r.employee_id, date]
      );
      if (existing) {
        await Database.run(
          'UPDATE attendance SET status = ?, notes = ? WHERE id = ?',
          [r.status, r.notes || null, existing.id]
        );
      } else {
        await Database.run(
          'INSERT INTO attendance (employee_id, date, status, notes) VALUES (?, ?, ?, ?)',
          [r.employee_id, date, r.status, r.notes || null]
        );
      }
    }
  }

  // Salary & Wage Sheet
  public static async calculateEmployeeWages(
    periodFrom: string,
    periodTo: string
  ): Promise<any[]> {
    const employees = await this.getAllEmployees();

    return await Promise.all(
      employees.map(async (emp) => {
        // Daily wage attendance total
        const attendances = await Database.query<Attendance>(
          'SELECT status FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ?',
          [emp.id, periodFrom, periodTo]
        );

        let presentDays = 0;
        attendances.forEach((a) => {
          if (a.status === 'present') presentDays += 1;
          else if (a.status === 'half-day') presentDays += 0.5;
        });

        const dailyWageEarnings = Math.round(presentDays * emp.daily_wage * 100) / 100;

        // Piece rate job allocations
        const jobAllocations = (await Database.get<{ total_wage: number }>(`
          SELECT SUM(a.allocated_wage) as total_wage
          FROM employee_job_allocations a
          INNER JOIN job_wage_entries j ON a.job_entry_id = j.id
          WHERE a.employee_id = ? AND j.date BETWEEN ? AND ?
        `, [emp.id, periodFrom, periodTo]))?.total_wage || 0;

        // Past disbursements paid
        const paidAmount = (await Database.get<{ total_paid: number }>(`
          SELECT SUM(amount) as total_paid
          FROM employee_salary_payments
          WHERE employee_id = ? AND period_from >= ? AND period_to <= ?
        `, [emp.id, periodFrom, periodTo]))?.total_paid || 0;

        const totalEarned = Math.round((dailyWageEarnings + jobAllocations) * 100) / 100;
        const netPayable = Math.round((totalEarned - paidAmount) * 100) / 100;

        return {
          employee: emp,
          presentDays,
          dailyWageRate: emp.daily_wage,
          dailyWageEarnings,
          pieceRateEarnings: Math.round(jobAllocations * 100) / 100,
          totalEarned,
          paidAmount,
          netPayable,
        };
      })
    );
  }

  public static async recordSalaryDisbursement(payment: Partial<EmployeeSalaryPayment>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO employee_salary_payments (employee_id, period_from, period_to, payment_date, amount, payment_mode, reference_no, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.employee_id,
        payment.period_from,
        payment.period_to,
        payment.payment_date || new Date().toISOString().split('T')[0],
        payment.amount,
        payment.payment_mode || 'cash',
        payment.reference_no || null,
        payment.notes || null,
      ]
    );
    return res.lastID;
  }
}
