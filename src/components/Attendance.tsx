import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardCheck, Plus, X, UserPlus } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { employees, attendance, saveAttendance, addEmployee } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [addEmpModal, setAddEmpModal] = useState(false);

  // New employee state
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Laborer');
  const [empPhone, setEmpPhone] = useState('');
  const [empWage, setEmpWage] = useState('500');

  // Attendance local form state for date
  const [statusMap, setStatusMap] = useState<{ [empId: string]: string }>(() => {
    const map: { [key: string]: string } = {};
    employees.forEach((e) => {
      const match = attendance.find((a) => a.date === date && a.employee_id === e.id);
      map[e.id] = match ? match.status : 'present';
    });
    return map;
  });

  const handleSaveAttendance = async () => {
    const records = employees.map((emp) => ({
      employee_id: emp.id,
      status: statusMap[emp.id] || 'present',
    }));
    await saveAttendance(date, records);
    alert('Attendance saved successfully!');
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEmployee({
      name: empName,
      role: empRole,
      phone: empPhone,
      daily_wage: parseFloat(empWage) || 0,
      joining_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    setAddEmpModal(false);
    setEmpName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Employees & Daily Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Mark daily attendance registers and manage worker profiles
          </p>
        </div>
        <button
          onClick={() => setAddEmpModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Daily Attendance Card */}
      <div className="glass-panel p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-teal-500" /> Daily Attendance Register
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 font-mono">Daily Wage</th>
                <th className="px-4 py-3 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {employees.map((emp) => {
                const currentStatus = statusMap[emp.id] || 'present';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-400">{emp.role || 'Laborer'}</td>
                    <td className="px-4 py-3 font-mono font-bold">₹{emp.daily_wage}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'present' }))}
                          className={`px-3 py-1 rounded-md font-semibold transition ${
                            currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'half-day' }))}
                          className={`px-3 py-1 rounded-md font-semibold transition ${
                            currentStatus === 'half-day' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Half-Day
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusMap((prev) => ({ ...prev, [emp.id]: 'absent' }))}
                          className={`px-3 py-1 rounded-md font-semibold transition ${
                            currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleSaveAttendance}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20"
          >
            Save Attendance
          </button>
        </div>
      </div>

      {/* Add Employee Modal */}
      {addEmpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Employee</h3>
              <button onClick={() => setAddEmpModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee Name *</label>
                <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} required placeholder="Full Name" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
                  <input type="text" value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input type="text" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="Mobile No" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Base Daily Wage (₹)</label>
                <input type="number" step="any" value={empWage} onChange={(e) => setEmpWage(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setAddEmpModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
