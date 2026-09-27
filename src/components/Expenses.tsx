import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, Plus, X, Edit2, Trash2, Lock, Fuel, Zap, Wrench, ShieldAlert } from 'lucide-react';
import { Expense } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, canDelete, checkDuplicate } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    data: any;
    details?: string;
  }>({
    isOpen: false,
    data: null,
  });

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Diesel / Fuel');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<any>('cash');
  const [paidTo, setPaidTo] = useState('');
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingExpense(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Diesel / Fuel');
    setTitle('');
    setAmount('');
    setMode('cash');
    setPaidTo('');
    setRef('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setMode(exp.payment_mode);
    setPaidTo(exp.paid_to || '');
    setRef(exp.reference_no || '');
    setNotes(exp.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date,
      category,
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      payment_mode: mode,
      paid_to: paidTo.trim(),
      reference_no: ref.trim(),
      notes: notes.trim(),
    };

    if (!editingExpense) {
      const dup = checkDuplicate('expense', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          data: payload,
          details: dup.details,
        });
        return;
      }
      await addExpense(payload);
    } else {
      await updateExpense(editingExpense.id, payload);
    }
    setModalOpen(false);
  };

  const handleConfirmDuplicate = async () => {
    await addExpense(duplicateModal.data);
    setModalOpen(false);
    setDuplicateModal({ isOpen: false, data: null });
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete expenses.');
      return;
    }
    if (window.confirm('Delete this expense entry?')) {
      await deleteExpense(id);
    }
  };

  // Group by category
  const categories = ['Diesel / Fuel', 'Electricity / Power', 'Machine Repair & Spares', 'Plant Maintenance', 'General'];
  const categoryTotals: { [cat: string]: number } = {};
  categories.forEach((cat) => (categoryTotals[cat] = 0));
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plant Operational Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Log fuel (diesel), machine spares, plant repairs, and electricity costs with edit & delete controls
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-rose-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.keys(categoryTotals).slice(0, 4).map((cat) => (
          <div key={cat} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cat}</div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ₹{categoryTotals[cat].toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" /> Expense Ledger
          </h3>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            Total Spend: ₹{totalExpense.toLocaleString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Paid To</th>
                <th className="px-4 py-3.5">Mode</th>
                <th className="px-4 py-3.5 text-right">Amount (₹)</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 text-slate-500 font-mono">{exp.date}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-[11px] font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {exp.title}
                    {exp.notes && <div className="text-[11px] text-slate-400 font-normal">{exp.notes}</div>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{exp.paid_to || '-'}</td>
                  <td className="px-4 py-3.5 uppercase font-mono text-[11px] text-slate-500">{exp.payment_mode}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Edit expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="Admin access required to delete">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No expenses logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Expense Entry' : 'Record Plant Expense'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Diesel / Fuel">Diesel / Fuel</option>
                    <option value="Electricity / Power">Electricity / Power</option>
                    <option value="Machine Repair & Spares">Machine Repair & Spares</option>
                    <option value="Plant Maintenance">Plant Maintenance</option>
                    <option value="Transport / Freight">Transport / Freight</option>
                    <option value="General">General / Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. 50L Diesel for Generator"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e: any) => setMode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Paid To</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Vendor / Person Name"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Reference / Bill No.
                  </label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="Bill / Transaction ID"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional remarks..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Expense Warning"
        message="An expense with matching category, amount, and date already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
