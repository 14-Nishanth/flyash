import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, ArrowDown, ArrowUp, Plus, X, Edit2, Trash2, Share2, Lock, AlertTriangle } from 'lucide-react';
import { MaterialInward, MaterialOutward } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Materials: React.FC = () => {
  const {
    inwards,
    outwards,
    parties,
    addInward,
    updateInward,
    deleteInward,
    addOutward,
    updateOutward,
    deleteOutward,
    canDelete,
    checkDuplicate,
  } = useApp();

  const [inwardModalOpen, setInwardModalOpen] = useState(false);
  const [outwardModalOpen, setOutwardModalOpen] = useState(false);
  const [editingInward, setEditingInward] = useState<MaterialInward | null>(null);
  const [editingOutward, setEditingOutward] = useState<MaterialOutward | null>(null);

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    type: 'inward' | 'outward';
    data: any;
    details?: string;
    isEdit?: boolean;
    editId?: string;
  }>({
    isOpen: false,
    type: 'inward',
    data: null,
  });

  // Inward Form State
  const [inDate, setInDate] = useState(new Date().toISOString().split('T')[0]);
  const [inPartyId, setInPartyId] = useState(parties[0]?.id || '');
  const [inMaterial, setInMaterial] = useState('Fly Ash');
  const [inQty, setInQty] = useState('');
  const [inUnit, setInUnit] = useState('Ton');
  const [inRate, setInRate] = useState('');
  const [inVehicle, setInVehicle] = useState('');
  const [inNotes, setInNotes] = useState('');

  // Outward Form State
  const [outDate, setOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [outPartyId, setOutPartyId] = useState('');
  const [outMaterial, setOutMaterial] = useState('Fly Ash Bricks 9x4x3');
  const [outQty, setOutQty] = useState('');
  const [outUnit, setOutUnit] = useState('Pieces');
  const [outRate, setOutRate] = useState('');
  const [outVehicle, setOutVehicle] = useState('');
  const [outNotes, setOutNotes] = useState('');

  const openInwardCreate = () => {
    setEditingInward(null);
    setInDate(new Date().toISOString().split('T')[0]);
    setInPartyId(parties[0]?.id || '');
    setInMaterial('Fly Ash');
    setInQty('');
    setInUnit('Ton');
    setInRate('');
    setInVehicle('');
    setInNotes('');
    setInwardModalOpen(true);
  };

  const openInwardEdit = (item: MaterialInward) => {
    setEditingInward(item);
    setInDate(item.date);
    setInPartyId(item.party_id || '');
    setInMaterial(item.material_type);
    setInQty(String(item.quantity_mt));
    setInUnit(item.quantity_unit || 'Ton');
    setInRate(String(item.rate));
    setInVehicle(item.vehicle_no || '');
    setInNotes(item.notes || '');
    setInwardModalOpen(true);
  };

  const openOutwardCreate = () => {
    setEditingOutward(null);
    setOutDate(new Date().toISOString().split('T')[0]);
    setOutPartyId('');
    setOutMaterial('Fly Ash Bricks 9x4x3');
    setOutQty('');
    setOutUnit('Pieces');
    setOutRate('');
    setOutVehicle('');
    setOutNotes('');
    setOutwardModalOpen(true);
  };

  const openOutwardEdit = (item: MaterialOutward) => {
    setEditingOutward(item);
    setOutDate(item.date);
    setOutPartyId(item.party_id || '');
    setOutMaterial(item.material_type);
    setOutQty(String(item.quantity_mt));
    setOutUnit(item.quantity_unit || 'Pieces');
    setOutRate(String(item.rate));
    setOutVehicle(item.vehicle_no || '');
    setOutNotes(item.notes || '');
    setOutwardModalOpen(true);
  };

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(inQty) || 0;
    const rate = parseFloat(inRate) || 0;
    const payload = {
      date: inDate,
      party_id: inPartyId,
      material_type: inMaterial,
      quantity_mt: qty,
      quantity_unit: inUnit,
      rate,
      amount: qty * rate,
      vehicle_no: inVehicle.trim().toUpperCase(),
      notes: inNotes,
    };

    // Check duplicate if creating new
    if (!editingInward) {
      const dup = checkDuplicate('inward', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          type: 'inward',
          data: payload,
          details: dup.details,
          isEdit: false,
        });
        return;
      }
    }

    if (editingInward) {
      await updateInward(editingInward.id, payload);
    } else {
      await addInward(payload);
    }
    setInwardModalOpen(false);
  };

  const handleOutwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(outQty) || 0;
    const rate = parseFloat(outRate) || 0;
    const payload = {
      date: outDate,
      party_id: outPartyId || undefined,
      material_type: outMaterial,
      quantity_mt: qty,
      quantity_unit: outUnit,
      rate,
      amount: qty * rate,
      vehicle_no: outVehicle.trim().toUpperCase(),
      notes: outNotes,
    };

    // Check duplicate if creating new
    if (!editingOutward) {
      const dup = checkDuplicate('outward', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          type: 'outward',
          data: payload,
          details: dup.details,
          isEdit: false,
        });
        return;
      }
    }

    if (editingOutward) {
      await updateOutward(editingOutward.id, payload);
    } else {
      await addOutward(payload);
    }
    setOutwardModalOpen(false);
  };

  const handleConfirmDuplicate = async () => {
    if (duplicateModal.type === 'inward') {
      await addInward(duplicateModal.data);
      setInwardModalOpen(false);
    } else if (duplicateModal.type === 'outward') {
      await addOutward(duplicateModal.data);
      setOutwardModalOpen(false);
    }
    setDuplicateModal({ isOpen: false, type: 'inward', data: null });
  };

  const handleDeleteInward = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this inward raw material entry?')) {
      await deleteInward(id);
    }
  };

  const handleDeleteOutward = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this outward dispatch entry?')) {
      await deleteOutward(id);
    }
  };

  const shareWhatsAppSlip = (item: MaterialOutward) => {
    const text = `*FLY ASH BRICK & BLOCK PLANT - DISPATCH SLIP*\n----------------------------------------\n*Date:* ${item.date}\n*Customer:* ${item.party_name || 'Walk-in Customer'}\n*Product:* ${item.material_type}\n*Quantity:* ${item.quantity_mt} ${item.quantity_unit}\n*Rate:* ₹${item.rate}/${item.quantity_unit}\n*Total Amount:* ₹${item.amount.toLocaleString()}\n*Vehicle No:* ${item.vehicle_no || 'Direct Dispatch'}\n----------------------------------------\nThank you for your business!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Materials & Dispatches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Record raw material inward deliveries and customer dispatches with full edit & delete controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openInwardCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <ArrowDown className="w-4 h-4" /> Inward (Raw)
          </button>
          <button
            onClick={openOutwardCreate}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20 flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" /> Dispatch (Outward)
          </button>
        </div>
      </div>

      {/* Raw Material Inward Register */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" /> Raw Material Inward Register
          </h3>
          <span className="text-xs text-slate-500 font-medium">Total: {inwards.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Material</th>
                <th className="px-4 py-3.5">Quantity</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5 text-right">Rate</th>
                <th className="px-4 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {inwards.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-slate-500 font-mono">{item.date}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.party_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg text-[11px] font-semibold">
                      {item.material_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-mono">
                    {item.quantity_mt} {item.quantity_unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{item.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">₹{item.rate}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{item.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openInwardEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => handleDeleteInward(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete entry"
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
              {inwards.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No inward raw materials recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outward Dispatches Register */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" /> Finished Goods Outward Dispatches
          </h3>
          <span className="text-xs text-slate-500 font-medium">Total: {outwards.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Quantity</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5 text-right">Rate</th>
                <th className="px-4 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {outwards.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-slate-500 font-mono">{item.date}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {item.party_name || 'Walk-in Customer'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-[11px] font-semibold">
                      {item.material_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-mono">
                    {item.quantity_mt} {item.quantity_unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{item.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">₹{item.rate}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{item.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => shareWhatsAppSlip(item)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                        title="Send WhatsApp Delivery Slip"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openOutwardEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => handleDeleteOutward(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete entry"
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
              {outwards.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No outward dispatches recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Create / Edit Modal */}
      {inwardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingInward ? 'Edit Material Inward' : 'Record Material Inward'}
              </h3>
              <button onClick={() => setInwardModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleInwardSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={inDate}
                    onChange={(e) => setInDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Supplier</label>
                  <select
                    value={inPartyId}
                    onChange={(e) => setInPartyId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Supplier</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Material</label>
                  <input
                    type="text"
                    value={inMaterial}
                    onChange={(e) => setInMaterial(e.target.value)}
                    placeholder="e.g. Fly Ash, Cement"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={inUnit}
                    onChange={(e) => setInUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Ton">Ton / MT</option>
                    <option value="Bags">Bags</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={inQty}
                    onChange={(e) => setInQty(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={inRate}
                    onChange={(e) => setInRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={inVehicle}
                  onChange={(e) => setInVehicle(e.target.value)}
                  placeholder="TN 01 AB 1234"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInwardModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  {editingInward ? 'Update Inward' : 'Save Inward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outward Create / Edit Modal */}
      {outwardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingOutward ? 'Edit Outward Dispatch' : 'Record Dispatch (Outward)'}
              </h3>
              <button onClick={() => setOutwardModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleOutwardSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={outDate}
                    onChange={(e) => setOutDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Customer</label>
                  <select
                    value={outPartyId}
                    onChange={(e) => setOutPartyId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Walk-in Customer</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Product</label>
                  <input
                    type="text"
                    value={outMaterial}
                    onChange={(e) => setOutMaterial(e.target.value)}
                    placeholder="e.g. Fly Ash Brick 9x4x3"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={outUnit}
                    onChange={(e) => setOutUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Pieces">Pieces / Pcs</option>
                    <option value="Tons">Tons</option>
                    <option value="Units">Units</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={outQty}
                    onChange={(e) => setOutQty(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={outRate}
                    onChange={(e) => setOutRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={outVehicle}
                  onChange={(e) => setOutVehicle(e.target.value)}
                  placeholder="TN 01 AB 1234"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOutwardModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  {editingOutward ? 'Update Dispatch' : 'Save Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Alert Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Entry Detected"
        message="A record with matching vehicle or material specifications already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => setDuplicateModal({ isOpen: false, type: 'inward', data: null })}
      />
    </div>
  );
};
