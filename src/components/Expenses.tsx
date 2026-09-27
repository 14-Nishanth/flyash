import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, Plus, X } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { expenses, addExpense } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Diesel / Fuel');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<any>('cash');
  const [paidTo, setPaidTo] = useState('');
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense({
      date,
      category,
      title,
      amount: parseFloat(amount) || 0,
      payment_mode: mode,
      paid_to: paidTo,
      reference_no: ref,
      notes,
    });
    setModalOpen(false);
    setTitle('');
    setAmount('');
  };

  // Group by category
  const categories = ['Diesel / Fuel', 'Electricity / Power', 'Machine Repair & Spares', 'Plant Maintenance', 'General'];
  const categoryTotals: { [cat: string]: number } = {};
  categories.forEach((cat) => (categoryTotals[cat] = 0));
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plant Operational Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Log fuel (diesel), machine spares, maintenance, and power costs
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-rose-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.keys(categoryTotals).slice(0, 4).map((cat) => (
          <div key={cat} className="glass-panel p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cat}</div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ₹{categoryTotals[cat].toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500" /> Expense Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Paid To</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-400 font-mono">{exp.date}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{exp.title}</td>
                  <td className="px-4 py-3 text-slate-400">{exp.paid_to || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 uppercase font-mono">{exp.payment_mode}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    ₹{exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No expenses recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Plant Expense</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="Diesel / Fuel">Diesel / Fuel</option>
                    <option value="Electricity / Power">Electricity / Power</option>
                    <option value="Machine Repair & Spares">Machine Repair & Spares</option>
                    <option value="Plant Maintenance">Plant Maintenance</option>
                    <option value="Tea & Refreshments">Tea & Refreshments</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expense Title / Item *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. 50L Diesel for JCB" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹) *</label>
                  <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
                  <select value={mode} onChange={(e: any) => setMode(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank">Bank / NEFT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Paid To / Vendor</label>
                <input type="text" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Vendor name" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
