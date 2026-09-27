import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Truck,
  Package,
  Wallet,
  Scale,
  Warehouse,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Share2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Calculator,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const {
    inwards,
    outwards,
    jobs,
    expenses,
    parties,
    productRates,
    calculatePartyBalance,
    settings,
  } = useApp();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'month' | 'week' | 'custom'>('week');
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // 1, 2, 3, 4, 5
  const [customFrom, setCustomFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [customTo, setCustomTo] = useState(now.toISOString().split('T')[0]);

  // Selected Unit Cost Product
  const [selectedCalcProduct, setSelectedCalcProduct] = useState(productRates[0]?.name || 'Fly Ash Brick 9x4x3');

  // Compute date boundaries based on view type
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    if (selectedPeriodType === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
        periodLabel: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    }

    if (selectedPeriodType === 'week') {
      // Divide month into 7-day chunks (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end)
      const startDay = (selectedWeek - 1) * 7 + 1;
      const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
      const endDay = Math.min(selectedWeek * 7, lastDateOfMonth);

      const firstDate = new Date(year, month, startDay);
      const lastDate = new Date(year, month, endDay);

      return {
        startDate: firstDate.toISOString().split('T')[0],
        endDate: lastDate.toISOString().split('T')[0],
        periodLabel: `Week ${selectedWeek} (${firstDate.getDate()} - ${lastDate.getDate()} ${firstDate.toLocaleString('default', { month: 'short', year: 'numeric' })})`,
      };
    }

    // Custom
    return {
      startDate: customFrom,
      endDate: customTo,
      periodLabel: `${customFrom} to ${customTo}`,
    };
  }, [selectedMonth, selectedPeriodType, selectedWeek, customFrom, customTo]);

  // Filter Data within Range
  const filteredOutwards = outwards.filter((o) => o.date >= startDate && o.date <= endDate);
  const filteredInwards = inwards.filter((i) => i.date >= startDate && i.date <= endDate);
  const filteredJobs = jobs.filter((j) => j.date >= startDate && j.date <= endDate);
  const filteredExpenses = expenses.filter((e) => e.date >= startDate && e.date <= endDate);

  // Financial Metrics
  const grossTurnover = filteredOutwards.reduce((sum, o) => sum + o.amount, 0);
  const rawMaterialPurchases = filteredInwards.reduce((sum, i) => sum + i.amount, 0);
  const totalLaborWages = filteredJobs.reduce((sum, j) => sum + j.total_amount, 0);
  const operationalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalCOGSAndOps = rawMaterialPurchases + totalLaborWages + operationalExpenses;
  const netProfit = grossTurnover - totalCOGSAndOps;
  const profitMarginPercent = grossTurnover > 0 ? (netProfit / grossTurnover) * 100 : 0;

  // Physical Production & Dispatch Metrics
  const totalPiecesProduced = filteredJobs.reduce((sum, j) => sum + j.quantity, 0);
  const totalDispatchesCount = filteredOutwards.reduce((sum, o) => sum + o.quantity_mt, 0);

  // Overall Outstanding Receivables & Payables
  let totalReceivables = 0;
  let totalPayables = 0;
  const partyLedgers: { party: any; balance: number }[] = [];

  parties.forEach((p) => {
    const bal = calculatePartyBalance(p.id);
    if (bal > 0) totalReceivables += bal;
    else if (bal < 0) totalPayables += Math.abs(bal);
    partyLedgers.push({ party: p, balance: bal });
  });

  // Week-by-Week Table Generator for the selected month
  const weekBreakdown = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const lastDate = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let weekNum = 1;
    for (let day = 1; day <= lastDate; day += 7) {
      const startD = new Date(year, month, day).toISOString().split('T')[0];
      const endDayNum = Math.min(day + 6, lastDate);
      const endD = new Date(year, month, endDayNum).toISOString().split('T')[0];

      const wOutwards = outwards.filter((o) => o.date >= startD && o.date <= endD);
      const wInwards = inwards.filter((i) => i.date >= startD && i.date <= endD);
      const wJobs = jobs.filter((j) => j.date >= startD && j.date <= endD);
      const wExpenses = expenses.filter((e) => e.date >= startD && e.date <= endD);

      const wTurnover = wOutwards.reduce((sum, o) => sum + o.amount, 0);
      const wMatCost = wInwards.reduce((sum, i) => sum + i.amount, 0);
      const wLabor = wJobs.reduce((sum, j) => sum + j.total_amount, 0);
      const wOps = wExpenses.reduce((sum, e) => sum + e.amount, 0);
      const wProduced = wJobs.reduce((sum, j) => sum + j.quantity, 0);
      const wDispatched = wOutwards.reduce((sum, o) => sum + o.quantity_mt, 0);
      const wNetSurplus = wTurnover - (wMatCost + wLabor + wOps);

      weeks.push({
        weekNumber: weekNum,
        startDate: startD,
        endDate: endD,
        turnover: wTurnover,
        materialCost: wMatCost,
        laborCost: wLabor,
        expenses: wOps,
        produced: wProduced,
        dispatched: wDispatched,
        netSurplus: wNetSurplus,
      });
      weekNum++;
    }
    return weeks;
  }, [selectedMonth, outwards, inwards, jobs, expenses]);

  // Per-Piece Unit Profit Margin Estimator
  const unitCostData = useMemo(() => {
    const prod = productRates.find((p) => p.name === selectedCalcProduct) || productRates[0];
    if (!prod) return null;

    const sellingPrice = prod.selling_rate_per_unit || 5.50;
    const laborRate = prod.labor_rate_per_unit || 0.60;

    // Standard fly ash brick / concrete block batch estimates
    const rawMatEst = prod.category === 'Brick' ? 2.10 : prod.name.includes('9x9') ? 32.0 : prod.name.includes('8x8') ? 28.0 : prod.name.includes('6x8') ? 22.0 : prod.name.includes('6') ? 19.5 : 14.0;
    const powerAndFuelEst = prod.category === 'Brick' ? 0.35 : 1.80;
    const totalUnitCost = rawMatEst + laborRate + powerAndFuelEst;
    const netProfitPerUnit = sellingPrice - totalUnitCost;
    const marginPct = (netProfitPerUnit / sellingPrice) * 100;

    return {
      product: prod,
      sellingPrice,
      rawMatEst,
      laborRate,
      powerAndFuelEst,
      totalUnitCost,
      netProfitPerUnit,
      marginPct,
    };
  }, [selectedCalcProduct, productRates]);

  const sendWhatsAppReminder = (party: any, balance: number) => {
    const text = `*PAYMENT REMINDER — SRI BALAMURUGAN FLY ASH BRICKS*\n----------------------------------------\nDear ${party.name},\nThis is a friendly reminder that your outstanding account balance is *₹${balance.toLocaleString()}*.\n\nKindly arrange for the settlement at your earliest convenience.\n\n*Payment Modes:* Cash / UPI / Bank Transfer / Cheque\nFor any billing clarification, please contact plant accounts.\n----------------------------------------\nThank you for your business!`;
    const cleanPhone = party.phone ? party.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header with Month / Week Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 text-xs font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Executive Financial Telemetry
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">{periodLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Turnover & Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track weekly & monthly revenue turnover, net gross margins, outstanding aging, and unit profit estimates
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Mode Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriodType('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriodType === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week-Wise
            </button>
            <button
              onClick={() => setSelectedPeriodType('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriodType === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Full
            </button>
            <button
              onClick={() => setSelectedPeriodType('custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedPeriodType === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Dates
            </button>
          </div>

          {/* Month Selector */}
          {selectedPeriodType !== 'custom' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Week Selector */}
          {selectedPeriodType === 'week' && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Week 1 (Days 1 - 7)</option>
              <option value={2}>Week 2 (Days 8 - 14)</option>
              <option value={3}>Week 3 (Days 15 - 21)</option>
              <option value={4}>Week 4 (Days 22 - 28)</option>
              <option value={5}>Week 5 (Days 29 - End)</option>
            </select>
          )}

          {/* Custom Date Pickers */}
          {selectedPeriodType === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
              />
            </div>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Print Financial Statement"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales Turnover */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Sales Turnover
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{grossTurnover.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Dispatches:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{totalDispatchesCount.toLocaleString()} units</span>
            </div>
          </div>
        </div>

        {/* Total Cost (COGS + Labor + Ops) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Production Outflow
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ₹{totalCOGSAndOps.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Materials + Labor + Fuel:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                ₹{rawMaterialPurchases.toLocaleString()} + ₹{totalLaborWages.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Net Operational Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Operating Surplus
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              netProfit >= 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' : 'bg-rose-50 text-rose-600'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold font-mono ${
              netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              ₹{netProfit.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Operating Margin:</span>
              <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profitMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Production Output */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Plant Production
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalPiecesProduced.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Labor Payout:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{totalLaborWages.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: WEEK-BY-WEEK BREAKDOWN TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Week-Wise Comparative Financial Breakdown ({selectedMonth})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Auto-aggregated from daily logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Week Period</th>
                <th className="px-4 py-3.5 font-mono text-right">Production (Pcs)</th>
                <th className="px-4 py-3.5 font-mono text-right text-emerald-600 dark:text-emerald-400">Turnover (₹)</th>
                <th className="px-4 py-3.5 font-mono text-right text-indigo-600 dark:text-indigo-400">Raw Materials (₹)</th>
                <th className="px-4 py-3.5 font-mono text-right text-amber-600 dark:text-amber-400">Labor Wages (₹)</th>
                <th className="px-4 py-3.5 font-mono text-right text-rose-600 dark:text-rose-400">Expenses (₹)</th>
                <th className="px-4 py-3.5 font-mono text-right font-bold text-slate-900 dark:text-white">Net Surplus (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {weekBreakdown.map((w) => (
                <tr key={w.weekNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 font-sans">
                    <div className="font-bold text-slate-900 dark:text-white">Week {w.weekNumber}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{w.startDate} to {w.endDate}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                    {w.produced.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{w.turnover.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-indigo-600 dark:text-indigo-400">
                    ₹{w.materialCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400">
                    ₹{w.laborCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-400">
                    ₹{w.expenses.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-sm">
                    <span className={w.netSurplus >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>
                      ₹{w.netSurplus.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Monthly Totals Row */}
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="px-4 py-4 font-sans uppercase text-xs tracking-wider text-slate-800 dark:text-slate-200">
                  Month Total ({selectedMonth})
                </td>
                <td className="px-4 py-4 text-right">{weekBreakdown.reduce((s, w) => s + w.produced, 0).toLocaleString()}</td>
                <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{weekBreakdown.reduce((s, w) => s + w.turnover, 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right text-indigo-600">
                  ₹{weekBreakdown.reduce((s, w) => s + w.materialCost, 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right text-amber-600">
                  ₹{weekBreakdown.reduce((s, w) => s + w.laborCost, 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right text-rose-600">
                  ₹{weekBreakdown.reduce((s, w) => s + w.expenses, 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right text-blue-600 dark:text-blue-400 text-base">
                  ₹{weekBreakdown.reduce((s, w) => s + w.netSurplus, 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: OUTSTANDING AMOUNTS & 1-CLICK WHATSAPP REMINDERS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outstanding Receivables Summary Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Outstanding Balances
            </h3>
            <span className="text-xs text-slate-500 font-medium">Live Ledger</span>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Total Customer Receivables</div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              ₹{totalReceivables.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Amount due from customers for delivered products</p>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl">
            <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold">Total Supplier Payables</div>
            <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 font-mono mt-1">
              ₹{totalPayables.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-700/80 mt-1">Amount payable to raw material vendors & sand quarries</p>
          </div>
        </div>

        {/* Customer Outstanding Aging Table with WhatsApp Reminder Action */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" /> Customer Overdue Accounts & 1-Click WhatsApp Reminders
              </h3>
              <p className="text-xs text-slate-500">Send instant payment reminder messages to customers with outstanding balances</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Party Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5 text-right">Balance Due</th>
                  <th className="px-4 py-2.5 text-center">1-Click WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {partyLedgers
                  .filter((p) => p.balance !== 0)
                  .sort((a, b) => b.balance - a.balance)
                  .map(({ party, balance }) => (
                    <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{party.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {party.party_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{party.phone || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          ₹{Math.abs(balance).toLocaleString()} {balance > 0 ? '(Due)' : '(Advance)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {balance > 0 ? (
                          <button
                            onClick={() => sendWhatsAppReminder(party, balance)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 mx-auto"
                          >
                            <Share2 className="w-3 h-3" /> Send Reminder
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {partyLedgers.filter((p) => p.balance !== 0).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      All customer and supplier balances are currently settled!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: PER-PIECE PRODUCTION COST & PROFIT ESTIMATOR */}
      {/* ========================================================================= */}
      {unitCostData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" /> Unit Manufacturing Cost & Profit Margin Estimator
              </h3>
              <p className="text-xs text-slate-500">
                Live breakdown of Raw Materials + Labor Piece-Rate + Power/Diesel overhead per brick or block
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Product:</span>
              <select
                value={selectedCalcProduct}
                onChange={(e) => setSelectedCalcProduct(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {productRates
                  .filter((p) => p.category !== 'Raw Material' && p.category !== 'Sand & Aggregate')
                  .map((pr) => (
                    <option key={pr.id} value={pr.name}>
                      {pr.name} ({pr.size || pr.category})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-sans">Raw Materials Cost</div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{unitCostData.rawMatEst.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">Cement + Ash + Dust</div>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <div className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-sans font-bold">Labor Piece Rate</div>
              <div className="text-base font-bold text-amber-700 dark:text-amber-300 mt-1">
                ₹{unitCostData.laborRate.toFixed(2)}
              </div>
              <div className="text-[10px] text-amber-600 font-sans mt-0.5">Paid to Gang</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-sans">Power & Diesel</div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{unitCostData.powerAndFuelEst.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">Plant Overheads</div>
            </div>

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/40">
              <div className="text-[10px] text-blue-800 dark:text-blue-300 uppercase font-sans font-bold">Total Unit Cost</div>
              <div className="text-base font-bold text-blue-700 dark:text-blue-300 mt-1">
                ₹{unitCostData.totalUnitCost.toFixed(2)}
              </div>
              <div className="text-[10px] text-blue-600 font-sans mt-0.5">Per Piece Total</div>
            </div>

            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800">
              <div className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-sans font-bold">Net Profit / Margin</div>
              <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                +₹{unitCostData.netProfitPerUnit.toFixed(2)} ({unitCostData.marginPct.toFixed(0)}%)
              </div>
              <div className="text-[10px] text-emerald-600 font-sans mt-0.5">Selling @ ₹{unitCostData.sellingPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
