import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, ArrowDown, ArrowUp, Plus, X } from 'lucide-react';

export const Materials: React.FC = () => {
  const { inwards, outwards, parties, addInward, addOutward } = useApp();

  const [inwardModalOpen, setInwardModalOpen] = useState(false);
  const [outwardModalOpen, setOutwardModalOpen] = useState(false);

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

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(inQty) || 0;
    const rate = parseFloat(inRate) || 0;
    await addInward({
      date: inDate,
      party_id: inPartyId,
      material_type: inMaterial,
      quantity_mt: qty,
      quantity_unit: inUnit,
      rate,
      amount: qty * rate,
      vehicle_no: inVehicle,
      notes: inNotes,
    });
    setInwardModalOpen(false);
    setInQty('');
    setInRate('');
  };

  const handleOutwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(outQty) || 0;
    const rate = parseFloat(outRate) || 0;
    await addOutward({
      date: outDate,
      party_id: outPartyId || undefined,
      material_type: outMaterial,
      quantity_mt: qty,
      quantity_unit: outUnit,
      rate,
      amount: qty * rate,
      vehicle_no: outVehicle,
      notes: outNotes,
    });
    setOutwardModalOpen(false);
    setOutQty('');
    setOutRate('');
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
            Record raw material inward deliveries and customer dispatches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInwardModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <ArrowDown className="w-4 h-4" /> Inward (Raw)
          </button>
          <button
            onClick={() => setOutwardModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" /> Dispatch (Outward)
          </button>
        </div>
      </div>

      {/* Raw Material Inward Register */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-500" /> Raw Material Inward Register
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
              {inwards.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-400">{item.date}</td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-900 dark:text-white">{item.party_name}</td>
                  <td className="px-4 py-3 font-sans">{item.material_type}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.quantity_mt} {item.quantity_unit}</td>
                  <td className="px-4 py-3 text-slate-400">{item.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right">₹{item.rate}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
              {inwards.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-sans">No inward raw materials recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outward Dispatches Register */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-500" /> Finished Goods Outward Dispatches
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
              {outwards.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-400">{item.date}</td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-900 dark:text-white">{item.party_name || 'Walk-in Customer'}</td>
                  <td className="px-4 py-3 font-sans">{item.material_type}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.quantity_mt} {item.quantity_unit}</td>
                  <td className="px-4 py-3 text-slate-400">{item.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right">₹{item.rate}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
              {outwards.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-sans">No outward dispatches recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Modal */}
      {inwardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Material Inward</h3>
              <button onClick={() => setInwardModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleInwardSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier</label>
                  <select value={inPartyId} onChange={(e) => setInPartyId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Material</label>
                  <input type="text" value={inMaterial} onChange={(e) => setInMaterial(e.target.value)} placeholder="e.g. Fly Ash, Cement" required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                  <select value={inUnit} onChange={(e) => setInUnit(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="Ton">Ton / MT</option>
                    <option value="Bags">Bags</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
                  <input type="number" step="any" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0.00" required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Rate / Unit (₹)</label>
                  <input type="number" step="any" value={inRate} onChange={(e) => setInRate(e.target.value)} placeholder="0.00" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle No.</label>
                <input type="text" value={inVehicle} onChange={(e) => setInVehicle(e.target.value)} placeholder="TN 01 AB 1234" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setInwardModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Save Inward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outward Modal */}
      {outwardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Dispatch (Outward)</h3>
              <button onClick={() => setOutwardModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleOutwardSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer</label>
                  <select value={outPartyId} onChange={(e) => setOutPartyId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="">Walk-in Customer</option>
                    {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Product</label>
                  <input type="text" value={outMaterial} onChange={(e) => setOutMaterial(e.target.value)} placeholder="e.g. Fly Ash Brick 9x4x3" required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                  <select value={outUnit} onChange={(e) => setOutUnit(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="Pieces">Pieces / Pcs</option>
                    <option value="Tons">Tons</option>
                    <option value="Units">Units</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
                  <input type="number" step="any" value={outQty} onChange={(e) => setOutQty(e.target.value)} placeholder="0" required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Rate / Unit (₹)</label>
                  <input type="number" step="any" value={outRate} onChange={(e) => setOutRate(e.target.value)} placeholder="0.00" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle No.</label>
                <input type="text" value={outVehicle} onChange={(e) => setOutVehicle(e.target.value)} placeholder="TN 01 AB 1234" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setOutwardModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">Save Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
