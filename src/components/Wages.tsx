import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Banknote, Printer } from 'lucide-react';

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
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
        >
          <Printer className="w-4 h-4" /> Print Sheet
        </button>
      </div>

      {/* Date Filter & Statement Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-green-500" /> Wage Statement
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Attendance</th>
                <th className="px-5 py-3.5 text-right font-mono">Daily Wage</th>
                <th className="px-5 py-3.5 text-right font-mono">Piece-Rate Share</th>
                <th className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">Total Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
              {wageRows.map((r) => (
                <tr key={r.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-3.5 font-sans font-semibold text-slate-900 dark:text-white text-sm">
                    {r.employee.name}
                    <div className="text-[11px] text-slate-400 font-sans">{r.employee.role || 'Laborer'}</div>
                  </td>
                  <td className="px-5 py-3.5 font-sans">{r.presentDays} days</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-600 dark:text-slate-300">₹{r.dailyWageEarned.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">₹{r.pieceRateEarned.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{r.totalGrossEarned.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
