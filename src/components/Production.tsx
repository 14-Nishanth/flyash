import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hammer, Plus, X, Calculator, Users } from 'lucide-react';

export const Production: React.FC = () => {
  const { jobs, employees, addJob } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobType, setJobType] = useState('Production');
  const [productName, setProductName] = useState('Fly Ash Brick 9x4x3');
  const [ratePerUnit, setRatePerUnit] = useState('0.60');
  const [trayCount, setTrayCount] = useState('36');
  const [pcsPerTray, setPcsPerTray] = useState('105');
  const [wastePerTray, setWastePerTray] = useState('5');
  const [groupName, setGroupName] = useState('Production Gang 1');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Live Reactive Calculations
  const trays = parseFloat(trayCount) || 0;
  const pcsTray = parseFloat(pcsPerTray) || 105;
  const wasteTray = parseFloat(wastePerTray) || 5;
  const rate = parseFloat(ratePerUnit) || 0;

  const grossQty = trays > 0 ? trays * pcsTray : 0;
  const totalWastage = trays > 0 ? trays * wasteTray : 0;
  const netQty = grossQty - totalWastage;
  const grossAmount = grossQty * rate;
  const wastageAmount = totalWastage * rate;
  const totalLaborWage = netQty * rate;
  const workerCount = selectedWorkers.length > 0 ? selectedWorkers.length : 1;
  const wagePerWorker = totalLaborWage / workerCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addJob({
      date,
      group_name: groupName,
      job_type: jobType,
      product_name: productName,
      tray_count: trays,
      pieces_per_tray: pcsTray,
      wastage_per_tray: wasteTray,
      total_wastage: totalWastage,
      gross_quantity: grossQty,
      quantity: netQty,
      rate_per_unit: rate,
      gross_amount: grossAmount,
      wastage_amount: wastageAmount,
      total_amount: totalLaborWage,
      worker_count: workerCount,
      wage_per_worker: wagePerWorker,
      worker_ids: selectedWorkers,
      notes,
    });
    setModalOpen(false);
  };

  const toggleWorker = (id: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Production & Piece-Rate Labor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tray multiplier, breakage deduction, and gang wage distribution
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Production Log
        </button>
      </div>

      {/* Production Logs Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-500" /> Daily Production & Labor Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product & Rate</th>
                <th className="px-4 py-3">Labor Gang / Workers</th>
                <th className="px-4 py-3">Trays / Gross</th>
                <th className="px-4 py-3">Breakage Cut</th>
                <th className="px-4 py-3 text-right">Net Payable Pcs</th>
                <th className="px-4 py-3 text-right">Total Labor Wage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-400 font-mono">{job.date}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{job.product_name}</div>
                    <div className="text-[11px] text-slate-400">{job.job_type} @ ₹{job.rate_per_unit}/pc</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-amber-600 dark:text-amber-400">{job.group_name || 'Gang'} ({job.worker_count} workers)</div>
                    <div className="text-[11px] text-slate-400 font-mono">₹{job.wage_per_worker.toFixed(2)}/worker</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {job.tray_count > 0 ? `${job.tray_count} trays (${job.gross_quantity} pcs)` : `${job.quantity} pcs`}
                  </td>
                  <td className="px-4 py-3 font-mono text-rose-500">
                    {job.total_wastage > 0 ? `-${job.total_wastage} pcs (₹${job.wastage_amount.toFixed(2)})` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {job.quantity.toLocaleString()} pcs
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                    ₹{job.total_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No production logs recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Modal with Real-time Reactive Micro-Calculator */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" /> Record Daily Production & Wages
              </h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Production Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Operation</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="Production">Production</option>
                    <option value="Loading Only">Loading Only</option>
                    <option value="Unloading Only">Unloading Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Product</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Piece Rate (₹/pc)</label>
                  <input type="number" step="any" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                </div>
              </div>

              {/* Reactive Micro-Calculator Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tray / Track Count</label>
                  <input type="number" step="any" value={trayCount} onChange={(e) => setTrayCount(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Pcs / Tray</label>
                  <input type="number" step="any" value={pcsPerTray} onChange={(e) => setPcsPerTray(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Breakage Cut</label>
                  <input type="number" step="any" value={wastePerTray} onChange={(e) => setWastePerTray(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-rose-500" />
                </div>
              </div>

              {/* Dynamic Live Reactive Output Display */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Gross Production:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{grossQty.toLocaleString()} pcs</span>
                </div>
                <div className="flex items-center justify-between text-rose-500">
                  <span>Breakage Cut ({wasteTray} pcs/tray):</span>
                  <span className="font-mono font-bold">-{totalWastage.toLocaleString()} pcs (-₹{wastageAmount.toFixed(2)})</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                  <span className="font-semibold">Payable Net Bricks:</span>
                  <span className="font-mono font-bold">{netQty.toLocaleString()} pcs</span>
                </div>
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-sm font-bold">
                  <span>Total Labor Wage Pool:</span>
                  <span className="font-mono text-base">₹{totalLaborWage.toFixed(2)}</span>
                </div>
              </div>

              {/* Labor Gang / Worker Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Gang Name</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs mb-2" />

                <div className="text-[11px] text-slate-400 mb-1">Select Gang Workers ({selectedWorkers.length} selected):</div>
                <div className="max-h-28 overflow-y-auto bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(emp.id)}
                        onChange={() => toggleWorker(emp.id)}
                        className="rounded border-slate-400 text-amber-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold">Save Production Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
