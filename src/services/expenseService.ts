import { Database } from '../database/db';
import { Expense } from '../types';

export class ExpenseService {
  public static async getExpenses(): Promise<Expense[]> {
    return await Database.query<Expense>('SELECT * FROM expenses ORDER BY date DESC, id DESC');
  }

  public static async createExpense(data: Partial<Expense>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO expenses (date, category, title, amount, payment_mode, paid_to, reference_no, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.category || 'General',
        data.title,
        data.amount || 0,
        data.payment_mode || 'cash',
        data.paid_to || null,
        data.reference_no || null,
        data.notes || null,
      ]
    );
    return res.lastID;
  }

  public static async deleteExpense(id: number): Promise<void> {
    await Database.run('DELETE FROM expenses WHERE id = ?', [id]);
  }

  public static async getExpenseCategorySummary(): Promise<{ category: string; total: number }[]> {
    return await Database.query<{ category: string; total: number }>(`
      SELECT category, SUM(amount) as total
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);
  }
}
