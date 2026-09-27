import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Hammer,
  Plus,
  X,
  Calculator,
  Users,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { JobWageEntry } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Production: React.FC = () => {
  const {
    jobs,
    employees,
    workerGroups,
    productRates,
    addJob,
    updateJob,
    deleteJob,
    canDelete,
    checkDuplicate,
    calculateGroupWageDistribution,
    setActiveTab,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWageEntry | null>(null);

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
  const [jobType, setJobType] = useState('Production');
  const [productName, setProductName] = useState('Fly Ash Brick 9x4x3');
  const [ratePerUnit, setRatePerUnit] = useState('0.60');
  const [trayCount, setTrayCount] = useState('36');
  const [pcsPerTray, setPcsPerTray] = useState('105');
  const [wastePerTray, setWastePerTray] = useState('5');
  const [groupId, setGroupId] = useState(workerGroups[0]?.id || '');
  const [groupName, setGroupName] = useState(workerGroups[0]?.name || 'Production Gang 1');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(workerGroups[0]?.member_ids || []);
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

  // Compute live wage breakdown per worker according to gang rules
  const liveWageSplit = calculateGroupWageDistribution(groupId, totalLaborWage, selectedWorkers);

  // On selecting a product preset from rate master
  const handleSelectProductPreset = (name: string) => {
    setProductName(name);
    const matched = productRates.find((pr) => pr.name === name);
    if (matched) {
      if (matched.labor_rate_per_unit > 0) setRatePerUnit(String(matched.labor_rate_per_unit));
      if (matched.pieces_per_tray > 0) setPcsPerTray(String(matched.pieces_per_tray));
      if (matched.wastage_per_tray >= 0) setWastePerTray(String(matched.wastage_per_tray));
    }
  };

  // On selecting a worker gang
  const handleSelectGroup = (gId: string) => {
    setGroupId(gId);
    const matched = workerGroups.find((g) => g.id === gId);
    if (matched) {
      setGroupName(matched.name);
      setSelectedWorkers(matched.member_ids || []);
    }
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setDate(new Date().toISOString().split('T')[0]);
    setJobType('Production');
    const defaultProd = productRates[0]?.name || 'Fly Ash Brick 9x4x3';
    handleSelectProductPreset(defaultProd);
    setTrayCount('36');
    if (workerGroups[0]) {
      handleSelectGroup(workerGroups[0].id);
    } else {
      setSelectedWorkers(employees.slice(0, 2).map((e) => e.id));
    }
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (job: JobWageEntry) => {
    setEditingJob(job);
    setDate(job.date);
    setJobType(job.job_type);
    setProductName(job.product_name);
    setRatePerUnit(String(job.rate_per_unit));
    setTrayCount(String(job.tray_count));
    setPcsPerTray(String(job.pieces_per_tray));
    setWastePerTray(String(job.wastage_per_tray));
    setGroupName(job.group_name || 'Production Gang 1');
    const matchedGroup = workerGroups.find((g) => g.name === job.group_name);
    if (matchedGroup) setGroupId(matchedGroup.id);
    setSelectedWorkers(job.worker_ids || []);
    setNotes(job.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
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
    };

    if (!editingJob) {
      const dup = checkDuplicate('job', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          data: payload,
          details: dup.details,
        });
        return;
      }
      await addJob(payload);
    } else {
      await updateJob(editingJob.id, payload);
    }
    setModalOpen(false);
  };

  const handleConfirmDuplicate = async () => {
    await addJob(duplicateModal.data);
    setModalOpen(false);
    setDuplicateModal({ isOpen: false, data: null });
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete production records.');
      return;
    }
    if (window.confirm('Delete this production log entry?')) {
      await deleteJob(id);
    }
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
            Production & Gang Labor Piece-Rates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Log fly ash bricks (3x4x9), solid blocks (4", 6", 6x8", 8x8", 9x9"), and automatic gang wage distribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('employees')}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-amber-500" /> Manage Gangs & Rates
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Production Log
          </button>
        </div>
      </div>

      {/* Production Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-600" /> Daily Production & Labor Records
          </h3>
          <span className="text-xs text-slate-500 font-medium">Total: {jobs.length} logs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Product & Piece Rate</th>
                <th className="px-4 py-3.5">Gang / Laborers</th>
                <th className="px-4 py-3.5">Trays / Gross Pcs</th>
                <th className="px-4 py-3.5 text-rose-600 dark:text-rose-400">Wastage Cut</th>
                <th className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">Net Production</th>
                <th className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">Total Wage Pool</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 text-slate-500 font-mono">{job.date}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white">{job.product_name}</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                      @ ₹{job.rate_per_unit}/piece
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{job.group_name || 'Gang 1'}</div>
                    <div className="text-[11px] text-slate-500">
                      {job.worker_count} active workers (avg ₹{Math.round(job.wage_per_worker)}/ea)
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono">
                    <div>{job.tray_count} trays × {job.pieces_per_tray}</div>
                    <div className="text-[11px] text-slate-400">{job.gross_quantity} gross pcs</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-rose-600 dark:text-rose-400 font-bold">
                    -{job.total_wastage} pcs
                    <div className="text-[10px] text-rose-400 font-normal">(-₹{Math.round(job.wastage_amount)})</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {job.quantity.toLocaleString()} pcs
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{job.total_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(job)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                        title="Edit production log"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete production log"
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
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No production logs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                {editingJob ? 'Edit Production Log' : 'New Production & Labor Log'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Select Product / Block Type
                  </label>
                  <select
                    value={productName}
                    onChange={(e) => handleSelectProductPreset(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
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

              {/* Reactive Micro-Calculator */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Batch Multipliers & Wastage Deductions</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                    Live Micro-Calculator
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tray Count
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={trayCount}
                      onChange={(e) => setTrayCount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Pcs / Tray
                    </label>
                    <input
                      type="number"
                      value={pcsPerTray}
                      onChange={(e) => setPcsPerTray(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Waste / Tray
                    </label>
                    <input
                      type="number"
                      value={wastePerTray}
                      onChange={(e) => setWastePerTray(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Rate / Pc (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={ratePerUnit}
                      onChange={(e) => setRatePerUnit(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Calculation Summary Bar */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">Gross Production</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{grossQty} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-500">Breakage Wastage Cut</div>
                    <div className="text-xs font-bold text-rose-600">-{totalWastage} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600">Net Payable Pieces</div>
                    <div className="text-xs font-bold text-emerald-600">{netQty} pcs</div>
                  </div>
                </div>
              </div>

              {/* Gang & Workers Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> Assign Worker Gang / Team
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => handleSelectGroup(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {workerGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {employees.map((emp) => (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => toggleWorker(emp.id)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition ${
                        selectedWorkers.includes(emp.id)
                          ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{emp.name}</span>
                      {selectedWorkers.includes(emp.id) && (
                        <span className="text-amber-600 text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Worker Wage Breakdown Display */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Wage Distribution Breakdown ({selectedWorkers.length} workers)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Total: ₹{totalLaborWage.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-xs">
                  {liveWageSplit.map((split) => {
                    const emp = employees.find((e) => e.id === split.workerId);
                    return (
                      <div
                        key={split.workerId}
                        className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-sans font-medium text-[11px] truncate">
                          {emp?.name || 'Worker'}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Math.round(split.wage)}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  {editingJob ? 'Update Production Log' : 'Save Production Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Production Warning"
        message="A production log with matching batch and product details already exists on this date."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
