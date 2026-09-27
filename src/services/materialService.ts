import { Database } from '../database/db';
import { MaterialInward, MaterialOutward, StockAdjustment } from '../types';

export class MaterialService {
  // Inwards (Raw Materials)
  public static async getInwards(): Promise<MaterialInward[]> {
    return await Database.query<MaterialInward>(`
      SELECT m.*, p.name as party_name 
      FROM material_inward m
      LEFT JOIN parties p ON m.party_id = p.id
      ORDER BY m.date DESC, m.id DESC
    `);
  }

  public static async createInward(data: Partial<MaterialInward>): Promise<number> {
    const amount = (data.quantity_mt || 0) * (data.rate || 0);
    const res = await Database.run(
      `INSERT INTO material_inward (date, party_id, material_type, quantity_mt, quantity_unit, vehicle_no, rate, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.party_id,
        data.material_type || 'Fly Ash',
        data.quantity_mt,
        data.quantity_unit || 'Ton',
        data.vehicle_no || null,
        data.rate || 0,
        amount,
        data.notes || null,
      ]
    );
    return res.lastID;
  }

  public static async deleteInward(id: number): Promise<void> {
    await Database.run('DELETE FROM material_inward WHERE id = ?', [id]);
  }

  // Outwards (Finished Goods / Dispatches)
  public static async getOutwards(): Promise<MaterialOutward[]> {
    return await Database.query<MaterialOutward>(`
      SELECT m.*, p.name as party_name 
      FROM material_outward m
      LEFT JOIN parties p ON m.party_id = p.id
      ORDER BY m.date DESC, m.id DESC
    `);
  }

  public static async createOutward(data: Partial<MaterialOutward>): Promise<number> {
    const amount = (data.quantity_mt || 0) * (data.rate || 0);
    const res = await Database.run(
      `INSERT INTO material_outward (date, party_id, material_type, quantity_mt, quantity_unit, vehicle_no, rate, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.party_id || null,
        data.material_type || 'Fly Ash Bricks',
        data.quantity_mt,
        data.quantity_unit || 'Pieces',
        data.vehicle_no || null,
        data.rate || 0,
        amount,
        data.notes || null,
      ]
    );
    return res.lastID;
  }

  public static async deleteOutward(id: number): Promise<void> {
    await Database.run('DELETE FROM material_outward WHERE id = ?', [id]);
  }

  // Live Inventory Stock Calculation - Only show materials actually mentioned / recorded
  public static async getRawMaterialStockSummary(): Promise<{ [material: string]: { quantity: number; unit: string } }> {
    const inwardSums = await Database.query<{ material_type: string; quantity_unit: string; total_qty: number }>(`
      SELECT material_type, quantity_unit, SUM(quantity_mt) as total_qty
      FROM material_inward
      GROUP BY material_type, quantity_unit
    `);

    const adjustments = await Database.query<{ item_name: string; unit: string; total_qty: number }>(`
      SELECT item_name, unit, SUM(quantity) as total_qty
      FROM stock_adjustments
      WHERE item_type = 'raw_material'
      GROUP BY item_name, unit
    `);

    const summary: { [key: string]: { quantity: number; unit: string } } = {};

    inwardSums.forEach((row) => {
      const mat = row.material_type;
      if (!summary[mat]) {
        summary[mat] = { quantity: 0, unit: row.quantity_unit || 'Ton' };
      }
      summary[mat].quantity += row.total_qty || 0;
    });

    adjustments.forEach((row) => {
      const mat = row.item_name;
      if (!summary[mat]) {
        summary[mat] = { quantity: 0, unit: row.unit || 'Ton' };
      }
      summary[mat].quantity += row.total_qty || 0;
    });

    return summary;
  }

  public static async getProductStockSummary(): Promise<{ [product: string]: { produced: number; dispatched: number; stock: number } }> {
    const production = await Database.query<{ product_name: string; total_qty: number }>(`
      SELECT product_name, SUM(CASE WHEN gross_quantity > 0 THEN gross_quantity ELSE quantity END) as total_qty
      FROM job_wage_entries
      WHERE LOWER(job_type) LIKE '%production%' OR tray_count > 0
      GROUP BY product_name
    `);

    const dispatches = await Database.query<{ material_type: string; total_qty: number }>(`
      SELECT material_type, SUM(quantity_mt) as total_qty
      FROM material_outward
      GROUP BY material_type
    `);

    const rateSettings = await Database.query<{ product_name: string; opening_stock: number }>(`
      SELECT product_name, opening_stock
      FROM job_rate_settings
      WHERE LOWER(job_type) LIKE '%production%'
    `);

    const adjustments = await Database.query<{ item_name: string; total_qty: number }>(`
      SELECT item_name, SUM(quantity) as total_qty
      FROM stock_adjustments
      WHERE item_type = 'product'
      GROUP BY item_name
    `);

    const summary: { [product: string]: { produced: number; dispatched: number; stock: number } } = {};

    rateSettings.forEach((r) => {
      summary[r.product_name] = {
        produced: r.opening_stock || 0,
        dispatched: 0,
        stock: r.opening_stock || 0,
      };
    });

    production.forEach((p) => {
      if (!summary[p.product_name]) {
        summary[p.product_name] = { produced: 0, dispatched: 0, stock: 0 };
      }
      summary[p.product_name].produced += p.total_qty || 0;
      summary[p.product_name].stock += p.total_qty || 0;
    });

    dispatches.forEach((d) => {
      if (!summary[d.material_type]) {
        summary[d.material_type] = { produced: 0, dispatched: 0, stock: 0 };
      }
      summary[d.material_type].dispatched += d.total_qty || 0;
      summary[d.material_type].stock -= d.total_qty || 0;
    });

    adjustments.forEach((a) => {
      if (!summary[a.item_name]) {
        summary[a.item_name] = { produced: 0, dispatched: 0, stock: 0 };
      }
      summary[a.item_name].stock += a.total_qty || 0;
    });

    return summary;
  }
}
