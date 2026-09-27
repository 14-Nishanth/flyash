import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardCheck, Plus, X, UserPlus, Edit2, Trash2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Attendance: React.FC = () => {
  const {
    employees,
    attendance,
    saveAttendance,
    deleteAttendanceForDate,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    canDelete,
    checkDuplicate,
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    data: any;
    details?: string;
  }>({
    isOpen: false,
    data: null,
  });

  // Employee form state
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Laborer');
  const [empPhone, setEmpPhone] = useState('');
  const [empWage, setEmpWage] = useState('500');

  // Attendance status mapping for the selected date
  const [statusMap, setStatusMap] = useState<{ [empId: string]: string }>({});

  React.useEffect(() => {
    const map: { [key: string]: string } = {};
    employees.forEach((e) => {
      const match = attendance.find((a) => a.date === date && a.employee_id === e.id);
      map[e.id] = match ? match.status : 'present';
    });
    setStatusMap(map);
  }, [date, attendance, employees]);

  const openAddEmp = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpRole('Laborer');
    setEmpPhone('');
    setEmpWage('500');
    setAddEmpModal(true);
  };

  const openEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpRole(emp.role || 'Laborer');
    setEmpPhone(emp.phone || '');
    setEmpWage(String(emp.daily_wage || 0));
    setAddEmpModal(true);
  };

  const handleSaveAttendance = async () => {
    const records = employees.map((emp) => ({
      employee_id: emp.id,
      status: statusMap[emp.id] || 'present',
    }));
    await saveAttendance(date, records);
    alert('Attendance records saved successfully!');
  };

  const handleClearAttendance = async () => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can clear attendance logs.');
      return;
    }
    if (window.confirm(`Clear all attendance logs for ${date}?`)) {
      await deleteAttendanceForDate(date);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
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
        setDuplicateModal({
          isOpen: true,
          data: payload,
          details: dup.details,
        });
        return;
      }
      await addEmployee(payload);
    } else {
      await updateEmployee(editingEmp.id, payload);
    }
    setAddEmpModal(false);
  };

  const handleConfirmDuplicateEmp = async () => {
    await addEmployee(duplicateModal.data);
    setAddEmpModal(false);
    setDuplicateModal({ isOpen: false, data: null });
  };

  const handleDeleteEmp = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can remove employee profiles.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this employee?')) {
      await deleteEmployee(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workers & Daily Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Mark daily attendance registers and manage worker profiles with edit & delete controls
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
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-teal-600" /> Daily Attendance Register
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Employee Name</th>
                <th className="px-4 py-3.5">Role / Phone</th>
                <th className="px-4 py-3.5 font-mono">Daily Wage</th>
                <th className="px-4 py-3.5 text-center">Attendance Status</th>
                <th className="px-4 py-3.5 text-center">Worker Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {employees.map((emp) => {
                const currentStatus = statusMap[emp.id] || 'present';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-600 dark:text-slate-400">{emp.role || 'Laborer'}</div>
                      {emp.phone && <div className="text-[11px] font-mono text-slate-400">{emp.phone}</div>}
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
                          title="Edit worker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete ? (
                          <button
                            onClick={() => handleDeleteEmp(emp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Remove worker"
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
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {canDelete && (
            <button
              onClick={handleClearAttendance}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
            >
              Clear Day's Logs
            </button>
          )}
          <button
            onClick={handleSaveAttendance}
            className="ml-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20"
          >
            Save Attendance
          </button>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {addEmpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEmp ? 'Edit Worker Profile' : 'Add New Worker'}
              </h3>
              <button onClick={() => setAddEmpModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Employee Name *
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
                  Base Daily Wage (₹)
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
                  onClick={() => setAddEmpModal(false)}
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

      {/* Duplicate Worker Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Worker Warning"
        message="A worker with matching name or phone number already exists in your employee directory."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicateEmp}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
