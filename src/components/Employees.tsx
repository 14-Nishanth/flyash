import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserPlus,
  Layers,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Calculator,
  CheckCircle,
  X,
  Boxes,
  ClipboardCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Employee, WorkerGroup, ProductRateMaster } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Employees: React.FC = () => {
  const {
    employees,
    workerGroups,
    productRates,
    attendance,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addGroup,
    updateGroup,
    deleteGroup,
    addProductRate,
    updateProductRate,
    deleteProductRate,
    saveAttendance,
    deleteAttendanceForDate,
    canDelete,
    checkDuplicate,
    calculateGroupWageDistribution,
  } = useApp();

  const [subTab, setSubTab] = useState<'groups' | 'workers' | 'rates'>('groups');

  // Attendance Date
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusMap, setStatusMap] = useState<{ [empId: string]: string }>({});

  // Modals state
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkerGroup | null>(null);

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ProductRateMaster | null>(null);

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    type: 'employee' | 'group' | 'product_rate';
    data: any;
    details?: string;
  }>({
    isOpen: false,
    type: 'employee',
    data: null,
  });

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Machine Operator');
  const [empPhone, setEmpPhone] = useState('');
  const [empWage, setEmpWage] = useState('600');

  // Group Form State
  const [grpName, setGrpName] = useState('');
  const [grpDesc, setGrpDesc] = useState('');
  const [grpMembers, setGrpMembers] = useState<string[]>([]);
  const [grpSplitType, setGrpSplitType] = useState<'equal' | 'percentage' | 'shares'>('equal');
  const [grpShares, setGrpShares] = useState<{ [id: string]: number }>({});

  // Product Rate Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<any>('Solid Block');
  const [prodSize, setProdSize] = useState('6 inch');
  const [prodUnit, setProdUnit] = useState('Pieces');
  const [prodLaborRate, setProdLaborRate] = useState('1.50');
  const [prodSellingRate, setProdSellingRate] = useState('36.00');
  const [prodPcsTray, setProdPcsTray] = useState('36');
  const [prodWasteTray, setProdWasteTray] = useState('2');
  const [prodOpeningStock, setProdOpeningStock] = useState('1000');
  const [prodNotes, setProdNotes] = useState('');

  // Live Wage Simulator for Groups
  const [simTotalWage, setSimTotalWage] = useState('3600');

  // Sync attendance status on date change
  React.useEffect(() => {
    const map: { [key: string]: string } = {};
    employees.forEach((e) => {
      const match = attendance.find((a) => a.date === attDate && a.employee_id === e.id);
      map[e.id] = match ? match.status : 'present';
    });
    setStatusMap(map);
  }, [attDate, attendance, employees]);

  // --- WORKER HANDLERS ---
  const openAddEmp = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpRole('Machine Operator');
    setEmpPhone('');
    setEmpWage('600');
    setEmpModalOpen(true);
  };

  const openEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpRole(emp.role || 'Laborer');
    setEmpPhone(emp.phone || '');
    setEmpWage(String(emp.daily_wage || 0));
    setEmpModalOpen(true);
  };

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: empName.trim(),
      role: empRole.trim(),
      phone: empPhone.trim(),
      daily_wage: parseFloat(empWage) || 0,
      joining_date: editingEmp ? editingEmp.joining_date : new Date().toISOString().split('T')[0],
      is_active: true,
    };

    if (!editingEmp) {
      const dup = checkDuplicate('employee', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({ isOpen: true, type: 'employee', data: payload, details: dup.details });
        return;
      }
      await addEmployee(payload);
    } else {
      await updateEmployee(editingEmp.id, payload);
    }
    setEmpModalOpen(false);
  };

  const handleDeleteEmp = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove employee profiles.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this employee profile?')) {
      await deleteEmployee(id);
    }
  };

  // --- GROUP HANDLERS ---
  const openAddGroup = () => {
    setEditingGroup(null);
    setGrpName('');
    setGrpDesc('');
    setGrpMembers(employees.slice(0, 2).map((e) => e.id));
    setGrpSplitType('equal');
    const initShares: { [id: string]: number } = {};
    employees.forEach((e) => (initShares[e.id] = 1.0));
    setGrpShares(initShares);
    setGroupModalOpen(true);
  };

  const openEditGroup = (group: WorkerGroup) => {
    setEditingGroup(group);
    setGrpName(group.name);
    setGrpDesc(group.description || '');
    setGrpMembers(group.member_ids || []);
    setGrpSplitType(group.split_type || 'equal');
    setGrpShares(group.member_shares || {});
    setGroupModalOpen(true);
  };

  const toggleGroupMember = (empId: string) => {
    setGrpMembers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: grpName.trim(),
      description: grpDesc.trim(),
      member_ids: grpMembers,
      split_type: grpSplitType,
      member_shares: grpShares,
    };

    if (!editingGroup) {
      const dup = checkDuplicate('group', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({ isOpen: true, type: 'group', data: payload, details: dup.details });
        return;
      }
      await addGroup(payload);
    } else {
      await updateGroup(editingGroup.id, payload);
    }
    setGroupModalOpen(false);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete worker gangs.');
      return;
    }
    if (window.confirm('Delete this worker gang/group?')) {
      await deleteGroup(id);
    }
  };

  // --- PRODUCT RATE HANDLERS ---
  const openAddRate = () => {
    setEditingRate(null);
    setProdName('');
    setProdCategory('Solid Block');
    setProdSize('6 inch');
    setProdUnit('Pieces');
    setProdLaborRate('1.50');
    setProdSellingRate('36.00');
    setProdPcsTray('36');
    setProdWasteTray('2');
    setProdOpeningStock('1000');
    setProdNotes('');
    setRateModalOpen(true);
  };

  const openEditRate = (pr: ProductRateMaster) => {
    setEditingRate(pr);
    setProdName(pr.name);
    setProdCategory(pr.category);
    setProdSize(pr.size || '');
    setProdUnit(pr.unit);
    setProdLaborRate(String(pr.labor_rate_per_unit));
    setProdSellingRate(String(pr.selling_rate_per_unit));
    setProdPcsTray(String(pr.pieces_per_tray));
    setProdWasteTray(String(pr.wastage_per_tray));
    setProdOpeningStock(String(pr.opening_stock || 0));
    setProdNotes(pr.notes || '');
    setRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName.trim(),
      category: prodCategory,
      size: prodSize.trim(),
      unit: prodUnit,
      labor_rate_per_unit: parseFloat(prodLaborRate) || 0,
      selling_rate_per_unit: parseFloat(prodSellingRate) || 0,
      pieces_per_tray: parseFloat(prodPcsTray) || 0,
      wastage_per_tray: parseFloat(prodWasteTray) || 0,
      opening_stock: parseFloat(prodOpeningStock) || 0,
      notes: prodNotes.trim(),
    };

    if (!editingRate) {
      const dup = checkDuplicate('product_rate', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({ isOpen: true, type: 'product_rate', data: payload, details: dup.details });
        return;
      }
      await addProductRate(payload);
    } else {
      await updateProductRate(editingRate.id, payload);
    }
    setRateModalOpen(false);
  };

  const handleDeleteRate = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove product rates.');
      return;
    }
    if (window.confirm('Delete this product rate configuration?')) {
      await deleteProductRate(id);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (duplicateModal.type === 'employee') await addEmployee(duplicateModal.data);
    else if (duplicateModal.type === 'group') await addGroup(duplicateModal.data);
    else if (duplicateModal.type === 'product_rate') await addProductRate(duplicateModal.data);

    setEmpModalOpen(false);
    setGroupModalOpen(false);
    setRateModalOpen(false);
    setDuplicateModal({ isOpen: false, type: 'employee', data: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workers, Gangs & Product Rates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure worker groups, automatic production wage division, and master building material rates
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setSubTab('groups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'groups'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Gangs & Wage Split ({workerGroups.length})
          </button>
          <button
            onClick={() => setSubTab('workers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'workers'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Workers ({employees.length})
          </button>
          <button
            onClick={() => setSubTab('rates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'rates'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Products & Rates ({productRates.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: WORKER GANGS & DYNAMIC WAGE DIVISION RULES */}
      {/* ========================================================================= */}
      {subTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" /> Worker Gangs & Wage Division Rules
              </h2>
              <p className="text-xs text-slate-500">
                When a production batch is logged for a gang, the piece-rate wage pool is divided among its members based on configured work ratios
              </p>
            </div>
            <button
              onClick={openAddGroup}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Worker Gang
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workerGroups.map((group) => {
              const assignedEmps = employees.filter((e) => group.member_ids?.includes(e.id));
              const simSplit = calculateGroupWageDistribution(group.id, parseFloat(simTotalWage) || 0);

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-400 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{group.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{group.description || 'Production labor team'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-[10px] font-bold uppercase border border-amber-200 dark:border-amber-800/40">
                        {group.split_type === 'shares' ? 'Custom Share Ratio' : 'Equal Split'}
                      </span>
                      <button
                        onClick={() => openEditGroup(group)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                        title="Edit Gang"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete Gang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Workers List */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Assigned Members ({assignedEmps.length})</span>
                      <span>Wage Split Rule</span>
                    </div>
                    <div className="space-y-1.5">
                      {assignedEmps.map((emp) => {
                        const share = group.member_shares?.[emp.id] || 1.0;
                        return (
                          <div
                            key={emp.id}
                            className="flex items-center justify-between text-xs py-1 px-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{emp.name}</span>
                              <span className="text-[10px] text-slate-400">({emp.role || 'Laborer'})</span>
                            </div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {group.split_type === 'shares' ? `${share}x Share` : 'Equal (1/N)'}
                            </span>
                          </div>
                        );
                      })}
                      {assignedEmps.length === 0 && (
                        <div className="text-xs text-slate-400 italic py-2 text-center">
                          No workers assigned to this gang yet. Click Edit to add workers.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Simulation Preview */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-amber-600" /> Live Production Wage Division
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">Pool: ₹{simTotalWage}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      {simSplit.map((s) => {
                        const emp = employees.find((e) => e.id === s.workerId);
                        return (
                          <div
                            key={s.workerId}
                            className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800/40 flex items-center justify-between"
                          >
                            <span className="text-slate-700 dark:text-slate-300 font-sans font-medium text-[11px] truncate">
                              {emp?.name || 'Worker'}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{Math.round(s.wage)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: WORKER DIRECTORY & ATTENDANCE */}
      {/* ========================================================================= */}
      {subTab === 'workers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" /> Worker Profiles & Daily Attendance
              </h2>
              <p className="text-xs text-slate-500">
                Manage worker database, base daily wages, and mark daily shift registers
              </p>
            </div>
            <button
              onClick={openAddEmp}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-teal-600/20 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Worker
            </button>
          </div>

          {/* Daily Attendance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-teal-600" /> Daily Attendance Register
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date:</span>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Employee Name</th>
                    <th className="px-4 py-3.5">Designation / Phone</th>
                    <th className="px-4 py-3.5">Assigned Gang</th>
                    <th className="px-4 py-3.5 font-mono">Daily Wage</th>
                    <th className="px-4 py-3.5 text-center">Attendance Status</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {employees.map((emp) => {
                    const currentStatus = statusMap[emp.id] || 'present';
                    const empGroups = workerGroups.filter((g) => g.member_ids?.includes(emp.id));

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                        <td className="px-4 py-3.5">
                          <div>{emp.role || 'Laborer'}</div>
                          {emp.phone && <div className="text-[11px] font-mono text-slate-400">{emp.phone}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          {empGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {empGroups.map((g) => (
                                <span
                                  key={g.id}
                                  className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          ₹{emp.daily_wage}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'present' }))}
                              className={`px-3 py-1 rounded-lg font-semibold transition ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'half-day' }))}
                              className={`px-3 py-1 rounded-lg font-semibold transition ${
                                currentStatus === 'half-day'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                              }`}
                            >
                              Half-Day
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'absent' }))}
                              className={`px-3 py-1 rounded-lg font-semibold transition ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditEmp(emp)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition"
                              title="Edit Worker"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete ? (
                              <button
                                onClick={() => handleDeleteEmp(emp.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                                title="Remove Worker"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {canDelete && (
                <button
                  onClick={() => deleteAttendanceForDate(attDate)}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                >
                  Clear Day's Register
                </button>
              )}
              <button
                onClick={async () => {
                  const records = employees.map((emp) => ({
                    employee_id: emp.id,
                    status: statusMap[emp.id] || 'present',
                  }));
                  await saveAttendance(attDate, records);
                  alert('Attendance registered successfully!');
                }}
                className="ml-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MASTER PRODUCT & MATERIAL RATES */}
      {/* ========================================================================= */}
      {subTab === 'rates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" /> Master Building Material & Product Rates
              </h2>
              <p className="text-xs text-slate-500">
                Fly ash bricks (3x4x9), solid blocks (4", 6", 6x8", 8x8", 9x9"), M-Sand, P-Sand, aggregates & piece-rate labor costs
              </p>
            </div>
            <button
              onClick={openAddRate}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Product / Material
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Product / Material</th>
                    <th className="px-4 py-3.5">Category & Dimensions</th>
                    <th className="px-4 py-3.5">Unit</th>
                    <th className="px-4 py-3.5 font-mono text-amber-600 dark:text-amber-400">Labor Rate / Unit</th>
                    <th className="px-4 py-3.5 font-mono text-emerald-600 dark:text-emerald-400">Selling Price</th>
                    <th className="px-4 py-3.5 font-mono">Tray Multiplier / Wastage</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {productRates.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{pr.name}</div>
                        {pr.notes && <div className="text-[11px] text-slate-400">{pr.notes}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded text-[11px] font-semibold">
                          {pr.category}
                        </span>
                        {pr.size && <div className="text-[11px] text-slate-500 mt-0.5">{pr.size}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-sans text-slate-600 dark:text-slate-400">{pr.unit}</td>
                      <td className="px-4 py-3.5 font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {pr.labor_rate_per_unit > 0 ? `₹${pr.labor_rate_per_unit.toFixed(2)}` : 'N/A (Material)'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{pr.selling_rate_per_unit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        {pr.pieces_per_tray > 0 ? (
                          <div>
                            {pr.pieces_per_tray} pcs/tray <span className="text-rose-500 font-semibold">(-{pr.wastage_per_tray} cut)</span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => openEditRate(pr)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                            title="Edit Rate"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteRate(pr.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT WORKER GANG */}
      {/* ========================================================================= */}
      {groupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                {editingGroup ? 'Edit Worker Gang' : 'Create New Worker Gang'}
              </h3>
              <button onClick={() => setGroupModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Gang / Team Name *
                </label>
                <input
                  type="text"
                  value={grpName}
                  onChange={(e) => setGrpName(e.target.value)}
                  required
                  placeholder="e.g. Production Gang 1 (Press Team)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description / Operations Scope
                </label>
                <input
                  type="text"
                  value={grpDesc}
                  onChange={(e) => setGrpDesc(e.target.value)}
                  placeholder="e.g. Brick press machine feeding, moulding and pallet stacking"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Wage Division Rule
                </label>
                <select
                  value={grpSplitType}
                  onChange={(e: any) => setGrpSplitType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="equal">Equal Split (Total piece rate divided equally among active members)</option>
                  <option value="shares">Custom Weighted Shares (Master Operator gets higher weight/multiplier)</option>
                </select>
              </div>

              {/* Assign Workers Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Select Gang Members ({grpMembers.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {employees.map((emp) => {
                    const isSelected = grpMembers.includes(emp.id);
                    const share = grpShares[emp.id] || 1.0;

                    return (
                      <div
                        key={emp.id}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleGroupMember(emp.id)}
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{emp.name}</span>
                          <span className="text-amber-600 text-xs">{isSelected ? '✓' : '+'}</span>
                        </div>

                        {isSelected && grpSplitType === 'shares' && (
                          <div className="mt-2 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">Weight:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={share}
                              onChange={(e) =>
                                setGrpShares((prev) => ({
                                  ...prev,
                                  [emp.id]: parseFloat(e.target.value) || 1.0,
                                }))
                              }
                              className="w-16 bg-white dark:bg-slate-900 border border-amber-300 rounded px-1.5 py-0.5 text-xs font-mono text-center font-bold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  {editingGroup ? 'Update Gang' : 'Save Gang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT WORKER */}
      {/* ========================================================================= */}
      {empModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEmp ? 'Edit Worker Profile' : 'Add New Worker'}
              </h3>
              <button onClick={() => setEmpModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveEmp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Worker Name *
                </label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  placeholder="Full Name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    placeholder="e.g. Machine Operator"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="Mobile No"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Base Daily Attendance Wage (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={empWage}
                  onChange={(e) => setEmpWage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20"
                >
                  {editingEmp ? 'Update Worker' : 'Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PRODUCT RATE MASTER */}
      {/* ========================================================================= */}
      {rateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                {editingRate ? 'Edit Product & Rate' : 'Add New Building Material / Product'}
              </h3>
              <button onClick={() => setRateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Product / Material Name *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="e.g. Fly Ash Brick 9x4x3, Solid Block 6x8, M-Sand"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e: any) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Brick">Brick (Fly Ash / Clay)</option>
                    <option value="Solid Block">Solid Concrete Block</option>
                    <option value="Hollow Block">Hollow Block</option>
                    <option value="Paver">Paver Block</option>
                    <option value="Sand & Aggregate">Sand & Aggregates (M-Sand/P-Sand)</option>
                    <option value="Raw Material">Raw Material (Cement/Fly Ash)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Size / Spec</label>
                  <input
                    type="text"
                    value={prodSize}
                    onChange={(e) => setProdSize(e.target.value)}
                    placeholder="e.g. 9x4x3, 4 inch, 6 inch, 6x8, 8x8, 9x9"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pieces">Pieces / Pcs</option>
                    <option value="Tons">Tons / MT</option>
                    <option value="Bags">Bags</option>
                    <option value="CFT">CFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Labor Rate / Pc (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={prodLaborRate}
                    onChange={(e) => setProdLaborRate(e.target.value)}
                    placeholder="0.60"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={prodSellingRate}
                    onChange={(e) => setProdSellingRate(e.target.value)}
                    placeholder="32.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Pieces / Tray
                  </label>
                  <input
                    type="number"
                    value={prodPcsTray}
                    onChange={(e) => setProdPcsTray(e.target.value)}
                    placeholder="105"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Wastage Cut / Tray
                  </label>
                  <input
                    type="number"
                    value={prodWasteTray}
                    onChange={(e) => setProdWasteTray(e.target.value)}
                    placeholder="5"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    value={prodOpeningStock}
                    onChange={(e) => setProdOpeningStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  placeholder="e.g. Standard mix ratio 1:3:6"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  {editingRate ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Entry Warning"
        message="A record with matching specifications already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => setDuplicateModal({ isOpen: false, type: 'employee', data: null })}
      />
    </div>
  );
};
