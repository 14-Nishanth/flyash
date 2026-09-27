import { Database } from '../database/db';
import { MaterialService } from './materialService';
import { PartyService } from './partyService';

export class DashboardService {
  public static async getDashboardData(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // Today's Inward
    const todayInward = await Database.get<{ total_qty: number; total_amount: number }>(
      'SELECT SUM(quantity_mt) as total_qty, SUM(amount) as total_amount FROM material_inward WHERE date = ?',
      [today]
    );

    // Today's Outward
    const todayOutward = await Database.get<{ total_qty: number; total_amount: number }>(
      'SELECT SUM(quantity_mt) as total_qty, SUM(amount) as total_amount FROM material_outward WHERE date = ?',
      [today]
    );

    // Today's Production & Piece-rate Labor
    const todayJobs = await Database.get<{ total_qty: number; total_wages: number }>(
      `SELECT SUM(CASE WHEN gross_quantity > 0 THEN gross_quantity ELSE quantity END) as total_qty,
              SUM(total_amount) as total_wages
       FROM job_wage_entries
       WHERE date = ? AND (LOWER(job_type) LIKE '%production%' OR tray_count > 0)`,
      [today]
    );

    // Today's Expenses
    const todayExpenses = await Database.get<{ total: number }>(
      'SELECT SUM(amount) as total FROM expenses WHERE date = ?',
      [today]
    );

    // Live Stocks
    const rawMaterialStocks = await MaterialService.getRawMaterialStockSummary();
    const productStocks = await MaterialService.getProductStockSummary();

    // Outstanding Totals
    const allParties = await PartyService.getAllParties();
    let totalReceivables = 0;
    let totalPayables = 0;

    allParties.forEach((p) => {
      if (p.outstanding > 0) {
        totalReceivables += p.outstanding;
      } else if (p.outstanding < 0) {
        totalPayables += Math.abs(p.outstanding);
      }
    });

    // Recent activities
    const recentInwards = await Database.query(
      `SELECT m.*, p.name as party_name FROM material_inward m LEFT JOIN parties p ON m.party_id = p.id ORDER BY m.date DESC, m.id DESC LIMIT 5`
    );
    const recentOutwards = await Database.query(
      `SELECT m.*, p.name as party_name FROM material_outward m LEFT JOIN parties p ON m.party_id = p.id ORDER BY m.date DESC, m.id DESC LIMIT 5`
    );
    const recentJobs = await Database.query(
      `SELECT j.*, g.name as group_name FROM job_wage_entries j LEFT JOIN employee_groups g ON j.group_id = g.id ORDER BY j.date DESC, j.id DESC LIMIT 5`
    );
    const recentExpenses = await Database.query(
      `SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5`
    );

    return {
      today,
      metrics: {
        todayInwardTons: todayInward?.total_qty || 0,
        todayInwardCost: todayInward?.total_amount || 0,
        todayOutwardUnits: todayOutward?.total_qty || 0,
        todayOutwardRevenue: todayOutward?.total_amount || 0,
        todayProductionUnits: todayJobs?.total_qty || 0,
        todayLaborWages: todayJobs?.total_wages || 0,
        todayExpenses: todayExpenses?.total || 0,
        totalReceivables: Math.round(totalReceivables * 100) / 100,
        totalPayables: Math.round(totalPayables * 100) / 100,
      },
      rawMaterialStocks,
      productStocks,
      recentInwards,
      recentOutwards,
      recentJobs,
      recentExpenses,
    };
  }
}
