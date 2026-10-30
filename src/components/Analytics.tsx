import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, MaterialInward, ManufacturingRecipe, RecipeMaterial, DEFAULT_MANUFACTURING_RECIPE } from '../types';
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

export const Analytics: React.FC<{ focusProfitMargin?: boolean }> = ({ focusProfitMargin = false }) => {
  const {
    inwards,
    outwards,
    jobs,
    expenses,
    parties,
    productRates,
    calculatePartyBalance,
    settings,
    setActiveTab,
    canEdit,
    lastSyncedTime,
    updateManufacturingRecipe,
  } = useApp();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'month' | 'week' | 'custom'>('week');
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // 1, 2, 3, 4, 5
  const [customFrom, setCustomFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [customTo, setCustomTo] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);

  useEffect(() => {
    if (focusProfitMargin) {
      document.getElementById('unit-profit-margin-estimator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusProfitMargin]);

  // Format local calendar dates without UTC conversion (toISOString can shift dates in India).
  const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Compute Monday-Sunday weeks, clipped to the selected month so adjacent months are never counted twice.
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);
    const firstWeekStart = new Date(firstOfMonth);
    firstWeekStart.setDate(firstWeekStart.getDate() - ((firstWeekStart.getDay() + 6) % 7));
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(weekStart.getDate() + (selectedWeek - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const clippedStart = weekStart < firstOfMonth ? firstOfMonth : weekStart;
    const clippedEnd = weekEnd > lastOfMonth ? lastOfMonth : weekEnd;

    if (selectedPeriodType === 'month') {
      return { startDate: toDateKey(firstOfMonth), endDate: toDateKey(lastOfMonth), periodLabel: firstOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }
    if (selectedPeriodType === 'week') {
      return { startDate: toDateKey(clippedStart), endDate: toDateKey(clippedEnd), periodLabel: `Week ${selectedWeek} (${toDateKey(clippedStart)} to ${toDateKey(clippedEnd)})` };
    }
    return { startDate: customFrom, endDate: customTo, periodLabel: `${customFrom} to ${customTo}` };
  }, [selectedMonth, selectedPeriodType, selectedWeek, customFrom, customTo]);

  const getOperationalExpenseTotal = (expenseRows: Expense[], inwardRows: MaterialInward[]) => {
    const matchedInwardIds = new Set<string>();
    return expenseRows.reduce((sum, expense) => {
      if (expense.expense_type === 'supplier_payment' ||
          expense.category === 'Supplier Due Payment' ||
          expense.category.includes('Supplier Due Payment') ||
          expense.category.includes('Outstanding Settlement')) return sum;
      if (expense.expense_type === 'material_purchase') {
        const mirror = inwardRows.find((inward) =>
          !matchedInwardIds.has(inward.id) &&
          inward.party_id === expense.party_id &&
          inward.date === expense.date &&
          String(inward.material_type || '').trim().toLowerCase() === String(expense.material_type || '').trim().toLowerCase() &&
          Math.abs((Number(inward.amount) || 0) - (Number(expense.amount) || 0)) < 0.01
        );
        if (mirror) {
          matchedInwardIds.add(mirror.id);
          return sum;
        }
      }
      return sum + (Number(expense.amount) || 0);
    }, 0);
  };

  // Filter Data within Range
  const filteredOutwards = outwards.filter((o) => o.date >= startDate && o.date <= endDate);
  const filteredInwards = inwards.filter((i) => i.date >= startDate && i.date <= endDate);
  const filteredJobs = jobs.filter((j) => j.date >= startDate && j.date <= endDate);
  const filteredExpenses = expenses.filter((e) => e.date >= startDate && e.date <= endDate);

  // Financial Metrics
  const grossTurnover = filteredOutwards.reduce((sum, o) => sum + o.amount, 0);
  const rawMaterialPurchases = filteredInwards.reduce((sum, i) => sum + i.amount, 0);
  const totalLaborWages = filteredJobs.reduce((sum, j) => sum + j.total_amount, 0);
  const operationalExpenses = getOperationalExpenseTotal(filteredExpenses, filteredInwards);

  const totalCOGSAndOps = rawMaterialPurchases + totalLaborWages + operationalExpenses;
  const netProfit = grossTurnover - totalCOGSAndOps;
  const profitMarginPercent = grossTurnover > 0 ? (netProfit / grossTurnover) * 100 : 0;

  // Physical Production & Dispatch Metrics
  const totalPiecesProduced = filteredJobs.filter((j) => j.job_type === 'Only Production' || j.job_type === 'Production').reduce((sum, j) => sum + (Number(j.quantity) || 0), 0);
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

  // Week-by-week totals are clipped to the selected month and use the same expense rules as the headline totals.
  const weekBreakdown = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstWeekStart = new Date(firstOfMonth);
    firstWeekStart.setDate(firstWeekStart.getDate() - ((firstWeekStart.getDay() + 6) % 7));
    const weeks = [];
    let weekNum = 1;
    for (let start = new Date(firstWeekStart); start <= lastOfMonth; start.setDate(start.getDate() + 7)) {
      const weekStart = new Date(start);
      const weekEnd = new Date(start);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const clippedStart = weekStart < firstOfMonth ? firstOfMonth : weekStart;
      const clippedEnd = weekEnd > lastOfMonth ? lastOfMonth : weekEnd;
      const startD = toDateKey(clippedStart);
      const endD = toDateKey(clippedEnd);

      const wOutwards = outwards.filter((o) => o.date >= startD && o.date <= endD);
      const wInwards = inwards.filter((i) => i.date >= startD && i.date <= endD);
      const wJobs = jobs.filter((j) => j.date >= startD && j.date <= endD);
      const wExpenses = expenses.filter((e) => e.date >= startD && e.date <= endD);
      const wTurnover = wOutwards.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const wMatCost = wInwards.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const wLabor = wJobs.reduce((sum, j) => sum + (Number(j.total_amount) || 0), 0);
      const wOps = getOperationalExpenseTotal(wExpenses, wInwards);
      const wProduced = wJobs.filter((j) => j.job_type === 'Only Production' || j.job_type === 'Production').reduce((sum, j) => sum + (Number(j.quantity) || 0), 0);
      const wDispatched = wOutwards.reduce((sum, o) => sum + (Number(o.quantity_mt) || 0), 0);
      const wNetSurplus = wTurnover - (wMatCost + wLabor + wOps);
      weeks.push({ weekNumber: weekNum, startDate: startD, endDate: endD, turnover: wTurnover, materialCost: wMatCost, laborCost: wLabor, expenses: wOps, produced: wProduced, dispatched: wDispatched, netSurplus: wNetSurplus });
      weekNum++;
    }
    return weeks;
  }, [selectedMonth, outwards, inwards, jobs, expenses]);

  // Editable batch recipe and purchase-unit costs. Saved in this browser between visits.
  const defaultRecipe: ManufacturingRecipe = DEFAULT_MANUFACTURING_RECIPE;
  const [recipe, setRecipe] = useState<ManufacturingRecipe>(() => {
    if (settings.manufacturing_recipe) return settings.manufacturing_recipe;
    try {
      const saved = localStorage.getItem('flyash-profit-margin-recipe-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.materials) && parsed.materials.length) return { ...defaultRecipe, ...parsed };
      }
    } catch { /* use the shared default if browser storage is unavailable */ }
    return defaultRecipe;
  });

  // Cloud settings are authoritative after the initial shared-data sync.
  useEffect(() => {
    if (settings.manufacturing_recipe) setRecipe(settings.manufacturing_recipe);
  }, [settings.manufacturing_recipe]);

  useEffect(() => {
    try { localStorage.setItem('flyash-profit-margin-recipe-v1', JSON.stringify(recipe)); } catch { /* browser storage may be unavailable */ }
  }, [recipe]);

  // Debounced cloud persistence avoids writing on every keystroke while keeping the
  // same manufacturing recipe available to all authenticated devices.
  useEffect(() => {
    if (!canEdit || !lastSyncedTime) return;
    if (JSON.stringify(settings.manufacturing_recipe || null) === JSON.stringify(recipe)) return;
    const timer = window.setTimeout(() => {
      updateManufacturingRecipe(recipe).catch((error) => console.error('Could not sync manufacturing recipe:', error));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [recipe, settings.manufacturing_recipe, lastSyncedTime, canEdit]);

  const updateRecipe = (patch: Partial<ManufacturingRecipe>) => {
    if (!canEdit) return;
    setRecipe((current) => ({ ...current, ...patch }));
  };
  const updateMaterial = (id: string, patch: Partial<RecipeMaterial>) => {
    if (!canEdit) return;
    setRecipe((current) => ({
      ...current,
      materials: current.materials.map((material) => material.id === id ? { ...material, ...patch } : material),
    }));
  };
  const materialCosts = recipe.materials.map((material) => {
    const purchasedKg = Math.max(0, material.purchaseQuantity * material.purchaseUnitKg);
    const costPerKg = purchasedKg > 0 ? material.purchasePrice / purchasedKg : 0;
    return { ...material, costPerKg, batchCost: costPerKg * Math.max(0, material.kgPerBatch) };
  });
  const rawMatBatchCost = materialCosts.reduce((sum, material) => sum + material.batchCost, 0);
  const rawMatEst = recipe.bricksPerBatch > 0 ? rawMatBatchCost / recipe.bricksPerBatch : 0;
  const laborRate = recipe.bricksPerBatch > 0 ? recipe.laborPerBatch / recipe.bricksPerBatch : 0;
  const powerAndFuelEst = recipe.bricksPerBatch > 0 ? recipe.powerFuelPerBatch / recipe.bricksPerBatch : 0;
  const totalUnitCost = rawMatEst + laborRate + powerAndFuelEst;
  const sellingPrice = recipe.sellingPricePerBrick;
  const netProfitPerUnit = sellingPrice - totalUnitCost;
  const marginPct = sellingPrice > 0 ? (netProfitPerUnit / sellingPrice) * 100 : 0;
  const unitCostData = { sellingPrice, rawMatEst, laborRate, powerAndFuelEst, totalUnitCost, netProfitPerUnit, marginPct };

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
          <button
            type="button"
            onClick={() => setActiveTab('profit-margin')}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          >
            <Calculator className="h-4 w-4" />
            Open Profit Margin Calculator
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
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
              {weekBreakdown.map((week) => (
                <option key={week.weekNumber} value={week.weekNumber}>
                  Week {week.weekNumber} ({week.startDate} to {week.endDate})
                </option>
              ))}
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
            <div id="unit-profit-margin-estimator" className="scroll-mt-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" /> Unit Manufacturing Cost & Profit Margin Estimator
              </h3>
              <p className="text-xs text-slate-500">
                Live breakdown of Raw Materials + Labor Piece-Rate + Power/Diesel overhead per brick or block
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Manufacturing Recipe & Material Purchase Costs</h4>
              <p className="text-xs text-slate-500 mt-1">Enter purchase price and pack size. Cost per kg is calculated automatically, then multiplied by kg used for one batch.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Bricks produced per batch
                <input type="number" min="1" value={recipe.bricksPerBatch} onChange={(e) => updateRecipe({ bricksPerBatch: Math.max(1, Number(e.target.value) || 1) })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Selling price per brick (₹)
                <input type="number" min="0" step="0.01" value={recipe.sellingPricePerBrick} onChange={(e) => updateRecipe({ sellingPricePerBrick: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Labour cost per batch (₹)
                <input type="number" min="0" step="0.01" value={recipe.laborPerBatch} onChange={(e) => updateRecipe({ laborPerBatch: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Power/diesel cost per batch (₹)
                <input type="number" min="0" step="0.01" value={recipe.powerFuelPerBatch} onChange={(e) => updateRecipe({ powerFuelPerBatch: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="space-y-3">
              {recipe.materials.map((material) => {
                const calculated = materialCosts.find((item) => item.id === material.id)!;
                return (
                  <div key={material.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <input aria-label="Material name" value={material.name} onChange={(e) => updateMaterial(material.id, { name: e.target.value })} className="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm font-bold" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">₹{calculated.costPerKg.toFixed(4)} / kg</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="text-xs text-slate-600 dark:text-slate-300">Purchase price (₹)
                        <input type="number" min="0" step="0.01" value={material.purchasePrice} onChange={(e) => updateMaterial(material.id, { purchasePrice: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-slate-600 dark:text-slate-300">Purchase quantity
                        <input type="number" min="0.001" step="any" value={material.purchaseQuantity} onChange={(e) => updateMaterial(material.id, { purchaseQuantity: Math.max(0.001, Number(e.target.value) || 0.001) })} className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-slate-600 dark:text-slate-300">Kg per purchase unit
                        <input type="number" min="0.001" step="any" value={material.purchaseUnitKg} onChange={(e) => updateMaterial(material.id, { purchaseUnitKg: Math.max(0.001, Number(e.target.value) || 0.001) })} className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-slate-600 dark:text-slate-300">Kg used per batch
                        <input type="number" min="0" step="any" value={material.kgPerBatch} onChange={(e) => updateMaterial(material.id, { kgPerBatch: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-sm" />
                      </label>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Batch material cost: ₹{calculated.batchCost.toFixed(2)} · Total purchase weight: {(material.purchaseQuantity * material.purchaseUnitKg).toLocaleString()} kg</div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200">
              Formula: purchase price ÷ (purchase quantity × kg per unit) = price/kg; price/kg × kg used per batch = material batch cost; total batch cost ÷ bricks per batch = material cost per brick.
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
