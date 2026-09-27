import { Database } from '../database/db';
import { Party, PartyAdjustment, PartyProductRate, Payment } from '../types';

export class PartyService {
  public static async getAllParties(): Promise<any[]> {
    const parties = await Database.query<Party>('SELECT * FROM parties ORDER BY name ASC');
    const enriched = await Promise.all(
      parties.map(async (party) => {
        const outstanding = await this.calculateOutstanding(party.id);
        return {
          ...party,
          outstanding,
        };
      })
    );
    return enriched;
  }

  public static async getPartyById(id: number): Promise<Party | undefined> {
    return await Database.get<Party>('SELECT * FROM parties WHERE id = ?', [id]);
  }

  public static async createParty(data: Partial<Party>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO parties (name, party_type, phone, address, gstin, opening_balance, default_selling_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.party_type || 'customer',
        data.phone || null,
        data.address || null,
        data.gstin || null,
        data.opening_balance || 0,
        data.default_selling_rate || 0,
      ]
    );
    return res.lastID;
  }

  public static async updateParty(id: number, data: Partial<Party>): Promise<void> {
    await Database.run(
      `UPDATE parties
       SET name = ?, party_type = ?, phone = ?, address = ?, gstin = ?, opening_balance = ?, default_selling_rate = ?
       WHERE id = ?`,
      [
        data.name,
        data.party_type,
        data.phone,
        data.address,
        data.gstin,
        data.opening_balance,
        data.default_selling_rate,
        id,
      ]
    );
  }

  public static async deleteParty(id: number): Promise<void> {
    await Database.run('DELETE FROM parties WHERE id = ?', [id]);
  }

  public static async calculateOutstanding(partyId: number): Promise<number> {
    const party = await this.getPartyById(partyId);
    if (!party) return 0;

    const totalOutward = (await Database.get<{ sum: number }>(
      'SELECT SUM(amount) as sum FROM material_outward WHERE party_id = ?',
      [partyId]
    ))?.sum || 0;

    const totalInward = (await Database.get<{ sum: number }>(
      'SELECT SUM(amount) as sum FROM material_inward WHERE party_id = ?',
      [partyId]
    ))?.sum || 0;

    const paymentsReceived = (await Database.get<{ sum: number }>(
      "SELECT SUM(amount) as sum FROM payments WHERE party_id = ? AND payment_type = 'received'",
      [partyId]
    ))?.sum || 0;

    const paymentsPaid = (await Database.get<{ sum: number }>(
      "SELECT SUM(amount) as sum FROM payments WHERE party_id = ? AND payment_type = 'paid'",
      [partyId]
    ))?.sum || 0;

    const debitAdjs = (await Database.get<{ sum: number }>(
      "SELECT SUM(amount) as sum FROM party_adjustments WHERE party_id = ? AND adjustment_type IN ('past_unpaid_due', 'debit')",
      [partyId]
    ))?.sum || 0;

    const creditAdjs = (await Database.get<{ sum: number }>(
      "SELECT SUM(amount) as sum FROM party_adjustments WHERE party_id = ? AND adjustment_type IN ('past_advance', 'discount_waiver', 'credit')",
      [partyId]
    ))?.sum || 0;

    const jobCharges = (await Database.get<{ sum: number }>(
      'SELECT SUM(CASE WHEN gross_amount > 0 THEN gross_amount ELSE total_amount END) as sum FROM job_wage_entries WHERE party_id = ?',
      [partyId]
    ))?.sum || 0;

    const balance =
      party.opening_balance +
      totalOutward -
      totalInward -
      paymentsReceived +
      paymentsPaid +
      debitAdjs -
      creditAdjs +
      jobCharges;

    return Math.round(balance * 100) / 100;
  }

  public static async getPartyLedger(partyId: number): Promise<any> {
    const party = await this.getPartyById(partyId);
    if (!party) throw new Error('Party not found');

    const outwards = await Database.query(
      "SELECT id, date, 'Material Dispatch' as entry_type, (material_type || ' (' || quantity_mt || ' ' || quantity_unit || ')') as details, amount as debit, 0 as credit, vehicle_no as ref FROM material_outward WHERE party_id = ? ORDER BY date ASC",
      [partyId]
    );

    const inwards = await Database.query(
      "SELECT id, date, 'Material Receipt' as entry_type, (material_type || ' (' || quantity_mt || ' ' || quantity_unit || ')') as details, 0 as debit, amount as credit, vehicle_no as ref FROM material_inward WHERE party_id = ? ORDER BY date ASC",
      [partyId]
    );

    const payments = await Database.query(
      "SELECT id, date, ('Payment ' || UPPER(payment_type)) as entry_type, ('Mode: ' || mode || ' ' || COALESCE(notes, '')) as details, (CASE WHEN payment_type='paid' THEN amount ELSE 0 END) as debit, (CASE WHEN payment_type='received' THEN amount ELSE 0 END) as credit, reference_no as ref FROM payments WHERE party_id = ? ORDER BY date ASC",
      [partyId]
    );

    const adjustments = await Database.query(
      "SELECT id, date, ('Adjustment: ' || adjustment_type) as entry_type, reason as details, (CASE WHEN adjustment_type IN ('past_unpaid_due', 'debit') THEN amount ELSE 0 END) as debit, (CASE WHEN adjustment_type IN ('past_advance', 'discount_waiver', 'credit') THEN amount ELSE 0 END) as credit, reference_no as ref FROM party_adjustments WHERE party_id = ? ORDER BY date ASC",
      [partyId]
    );

    const jobEntries = await Database.query(
      "SELECT id, date, ('Labor Job: ' || job_type) as entry_type, (product_name || ' (' || quantity || ' ' || unit || ')') as details, (CASE WHEN gross_amount > 0 THEN gross_amount ELSE total_amount END) as debit, 0 as credit, vehicle_no as ref FROM job_wage_entries WHERE party_id = ? ORDER BY date ASC",
      [partyId]
    );

    const allEntries = [...outwards, ...inwards, ...payments, ...adjustments, ...jobEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = party.opening_balance;
    const ledger = allEntries.map((entry) => {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        running_balance: Math.round(runningBalance * 100) / 100,
      };
    });

    return {
      party,
      opening_balance: party.opening_balance,
      final_balance: Math.round(runningBalance * 100) / 100,
      ledger,
    };
  }

  public static async recordPayment(payment: Partial<Payment>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO payments (date, party_id, payment_type, amount, mode, reference_no, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.date,
        payment.party_id,
        payment.payment_type,
        payment.amount,
        payment.mode || 'cash',
        payment.reference_no || null,
        payment.notes || null,
      ]
    );
    return res.lastID;
  }

  public static async addAdjustment(adj: Partial<PartyAdjustment>): Promise<number> {
    const res = await Database.run(
      `INSERT INTO party_adjustments (party_id, date, adjustment_type, amount, reason, reference_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adj.party_id,
        adj.date,
        adj.adjustment_type,
        adj.amount,
        adj.reason,
        adj.reference_no || null,
      ]
    );
    return res.lastID;
  }
}
