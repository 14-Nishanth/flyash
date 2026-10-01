import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Banknote, Printer, Download } from 'lucide-react';

export const Wages: React.FC = () => {
  const { employees, attendance, jobs } = useApp();

  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const wageRows = employees.map((emp) => {
    // Attendance present days
    const empAtt = attendance.filter(
      (a) => a.employee_id === emp.id && a.date >= dateFrom && a.date <= dateTo
    );
    let presentDays = 0;
    empAtt.forEach((a) => {
      if (a.status === 'present') presentDays += 1;
      else if (a.status === 'half-day') presentDays += 0.5;
    });

    const dailyWageEarned = presentDays * (emp.daily_wage || 0);

    // Piece-rate share from jobs
    let pieceRateEarned = 0;
    jobs.forEach((j) => {
      if (j.date >= dateFrom && j.date <= dateTo) {
        if (j.worker_ids && j.worker_ids.includes(emp.id)) {
          pieceRateEarned += j.wage_per_worker;
        } else if (!j.worker_ids || j.worker_ids.length === 0) {
          // Fallback share
          pieceRateEarned += j.total_amount / (employees.length || 1);
        }
      }
    });

    const totalGrossEarned = dailyWageEarned + pieceRateEarned;

    return {
      employee: emp,
      presentDays,
      dailyWageEarned,
      pieceRateEarned,
      totalGrossEarned,
    };
  });

  const grandTotal = wageRows.reduce((sum, r) => sum + r.totalGrossEarned, 0);

  // Operation wage breakdown
  const filteredJobs = jobs.filter((j) => j.date >= dateFrom && j.date <= dateTo);
  const productionWages = filteredJobs
    .filter((j) => j.job_type === 'Only Production' || !j.job_type || j.job_type === 'Production')
    .reduce((sum, j) => sum + (j.total_amount || 0), 0);
  const loadingWages = filteredJobs
    .filter((j) => j.job_type === 'Only Loading')
    .reduce((sum, j) => sum + (j.total_amount || 0), 0);
  const unloadingWages = filteredJobs
    .filter((j) => j.job_type === 'Only Unloading')
    .reduce((sum, j) => sum + (j.total_amount || 0), 0);
  const loadUnloadWages = filteredJobs
    .filter((j) => j.job_type === 'Loading / Unloading')
    .reduce((sum, j) => sum + (j.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Labor Wages & Salary Sheet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Consolidated piece-rate earnings and daily attendance wage statement
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Wage Sheet
        </button>
      </div>

      {/* Operation Type Wage Breakdown Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Only Production
          </span>
          <div className="mt-1 text-lg font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{productionWages.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Batch block pressing</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-sm">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
            Only Loading
          </span>
          <div className="mt-1 text-lg font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{loadingWages.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Lorry loading operations</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-sm">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
            Only Unloading
          </span>
          <div className="mt-1 text-lg font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{unloadingWages.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Yard unloading & stacking</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            Loading / Unloading
          </span>
          <div className="mt-1 text-lg font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{loadUnloadWages.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Combined dispatch handling</span>
        </div>
      </div>

      {/* Date Filter & Statement Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" /> Wage Statement Breakdown
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Attendance</th>
                <th className="px-5 py-3.5 text-right font-mono">Daily Wage (₹)</th>
                <th className="px-5 py-3.5 text-right font-mono">Piece-Rate Share (₹)</th>
                <th className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                  Total Net Payable
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {wageRows.map((r) => (
                <tr key={r.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-sans font-bold text-slate-900 dark:text-white text-sm">
                    {r.employee.name}
                    <div className="text-[11px] text-slate-400 font-sans font-normal">{r.employee.role || 'Laborer'}</div>
                  </td>
                  <td className="px-5 py-3.5 font-sans text-slate-600 dark:text-slate-300 font-medium">
                    {r.presentDays} days
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                    ₹{r.dailyWageEarned.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                    ₹{r.pieceRateEarned.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{r.totalGrossEarned.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td colSpan={4} className="px-5 py-4 font-sans text-right uppercase text-xs tracking-wider text-slate-700 dark:text-slate-300">
                  Total Payroll Outflow
                </td>
                <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  ₹{grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
