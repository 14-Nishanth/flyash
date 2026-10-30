import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Banknote, Printer, Plus, ClipboardList } from 'lucide-react';

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const money = (value: number) => '₹' + (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Wages: React.FC = () => {
  const { employees, workerGroups, jobs, addJob, checkDuplicate } = useApp();
  const [workDate, setWorkDate] = useState(today());
  const [groupId, setGroupId] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [totalSalary, setTotalSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());

  const activeGroups = workerGroups.filter((g) => (g.member_ids || []).some((id) => employees.some((e) => e.id === id && e.is_active)));
  const selectedGroup = activeGroups.find((g) => g.id === groupId);
  const members = useMemo(() => {
    if (!selectedGroup) return [];
    return (selectedGroup.member_ids || []).map((id) => employees.find((e) => e.id === id)).filter((e) => e && e.is_active);
  }, [selectedGroup, employees]);
  const amount = Math.max(0, Number(totalSalary) || 0);
  const perWorker = members.length ? amount / members.length : 0;

  const filteredJobs = jobs
    .filter((j) => j.date >= dateFrom && j.date <= dateTo)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const gangWork = filteredJobs.filter((j) => j.job_type === 'Gang Work');
  const totalPayroll = gangWork.reduce((sum, j) => sum + (Number(j.total_amount) || 0), 0);
  const allEntries = filteredJobs.filter((j) => j.job_type === 'Gang Work' || j.job_type === 'Production' || j.job_type === 'Only Production' || j.job_type === 'Only Loading' || j.job_type === 'Only Unloading' || j.job_type === 'Loading / Unloading');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) { alert('Please select a worker gang.'); return; }
    if (!workDescription.trim()) { alert('Enter the work completed today.'); return; }
    if (amount <= 0) { alert('Enter a salary amount greater than zero.'); return; }
    if (members.length === 0) { alert('This gang has no active workers. Add workers to the gang first.'); return; }
    setSaving(true);
    try {
      const gangEntry = {
        date: workDate,
        group_name: selectedGroup.name,
        job_type: 'Gang Work',
        product_name: workDescription.trim(),
        tray_count: 0,
        pieces_per_tray: 0,
        wastage_per_tray: 0,
        total_wastage: 0,
        gross_quantity: 0,
        quantity: 0,
        rate_per_unit: 0,
        gross_amount: amount,
        wastage_amount: 0,
        total_amount: amount,
        worker_count: members.length,
        wage_per_worker: Math.round((amount / members.length) * 100) / 100,
        worker_ids: members.map((m) => m!.id),
        notes: [notes.trim(), 'Workers: ' + members.map((m) => m!.name).join(', ')].filter(Boolean).join(' | '),
      };
      const duplicate = checkDuplicate('job', gangEntry);
      if (duplicate.isDuplicate && !window.confirm(`${duplicate.details}\n\nSave this gang-work entry anyway?`)) return;
      await addJob(gangEntry);
      setWorkDescription('');
      setTotalSalary('');
      setNotes('');
      alert('Gang work and equal salary split saved.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not save this gang salary entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Work Gang Salary Sheet</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Record the work completed each day and split its total salary equally among the selected gang members. No attendance tracking is used.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700">
          <Printer className="w-4 h-4" /> Print Salary Sheet
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-slate-900 dark:text-white">Add Today's Gang Work</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">Work date
            <input required type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white" />
          </label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">Worker gang
            <select required value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white">
              <option value="">Select gang</option>
              {activeGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">Total gang salary (₹)
            <input required min="0.01" step="0.01" type="number" value={totalSalary} onChange={(e) => setTotalSalary(e.target.value)} placeholder="e.g. 3000" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white" />
          </label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">Work completed
            <input required value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="e.g. Brick production, stacking" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white" />
          </label>
        </div>
        {selectedGroup && <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><div className="text-xs text-slate-500 dark:text-slate-400">Active gang members</div><div className="text-lg font-bold text-slate-900 dark:text-white">{members.length}</div></div>
            <div><div className="text-xs text-slate-500 dark:text-slate-400">Total salary</div><div className="text-lg font-bold text-slate-900 dark:text-white">{money(amount)}</div></div>
            <div><div className="text-xs text-emerald-700 dark:text-emerald-400">Salary per worker (equal)</div><div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{money(perWorker)}</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{members.map((m) => <span key={m!.id} className="rounded-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">{m!.name}: {money(perWorker)}</span>)}</div>
        </div>}
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any details about today's work..." className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white" />
        </label>
        <button type="submit" disabled={saving} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm">{saving ? 'Saving...' : 'Save Gang Salary Entry'}</button>
      </form>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Salary history</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-slate-500">From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="ml-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-900 dark:text-white" /></label>
            <label className="text-slate-500">To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="ml-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-900 dark:text-white" /></label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Gang work entries</div><div className="text-xl font-extrabold text-slate-900 dark:text-white">{gangWork.length}</div></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Gang salary total</div><div className="text-xl font-extrabold text-slate-900 dark:text-white">{money(totalPayroll)}</div></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">All work records in period</div><div className="text-xl font-extrabold text-slate-900 dark:text-white">{allEntries.length}</div></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Gang</th><th className="px-4 py-3">Work completed</th><th className="px-4 py-3 text-right">Workers</th><th className="px-4 py-3 text-right">Total salary</th><th className="px-4 py-3 text-right">Per worker</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {gangWork.map((j) => <tr key={j.id} className="text-slate-700 dark:text-slate-200"><td className="px-4 py-3 whitespace-nowrap">{j.date}</td><td className="px-4 py-3">{j.group_name || 'Gang'}</td><td className="px-4 py-3 min-w-48">{j.product_name}{j.notes && <div className="text-xs text-slate-400 mt-1">{j.notes}</div>}</td><td className="px-4 py-3 text-right">{j.worker_count || 0}</td><td className="px-4 py-3 text-right font-semibold">{money(j.total_amount || 0)}</td><td className="px-4 py-3 text-right font-bold text-emerald-600">{money(j.wage_per_worker || 0)}</td></tr>)}
              {gangWork.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500"><ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-50" />No gang salary entries in this date range.</td></tr>}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold"><tr><td colSpan={4} className="px-4 py-3 text-right">Total</td><td className="px-4 py-3 text-right">{money(totalPayroll)}</td><td /></tr></tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};
