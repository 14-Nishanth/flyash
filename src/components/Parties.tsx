import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, IndianRupee, BookOpen, X, Printer } from 'lucide-react';

export const Parties: React.FC = () => {
  const { parties, inwards, outwards, payments, addParty, addPayment, calculatePartyBalance } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);

  // Add party form state
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState<'customer' | 'supplier' | 'both'>('customer');
  const [pPhone, setPPhone] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pGstin, setPGstin] = useState('');
  const [pOpening, setPOpening] = useState('0');

  // Payment form state
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payType, setPayType] = useState<'received' | 'paid'>('received');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<any>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    await addParty({
      name: pName,
      party_type: pType,
      phone: pPhone,
      address: pAddress,
      gstin: pGstin,
      opening_balance: parseFloat(pOpening) || 0,
    });
    setAddModalOpen(false);
    setPName('');
    setPPhone('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    await addPayment({
      date: payDate,
      party_id: selectedParty.id,
      payment_type: payType,
      amount: parseFloat(payAmount) || 0,
      mode: payMode,
      reference_no: payRef,
      notes: payNotes,
    });
    setPayModalOpen(false);
    setPayAmount('');
  };

  // Generate Party Ledger
  const getPartyLedger = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return [];

    const partyOutwards = outwards
      .filter((o) => o.party_id === partyId)
      .map((o) => ({
        date: o.date,
        type: 'Dispatch',
        details: `${o.material_type} (${o.quantity_mt} ${o.quantity_unit})`,
        ref: o.vehicle_no,
        debit: o.amount,
        credit: 0,
      }));

    const partyInwards = inwards
      .filter((i) => i.party_id === partyId)
      .map((i) => ({
        date: i.date,
        type: 'Material Inward',
        details: `${i.material_type} (${i.quantity_mt} ${i.quantity_unit})`,
        ref: i.vehicle_no,
        debit: 0,
        credit: i.amount,
      }));

    const partyPayments = payments
      .filter((p) => p.party_id === partyId)
      .map((p) => ({
        date: p.date,
        type: `Payment ${p.payment_type.toUpperCase()}`,
        details: `Mode: ${p.mode} ${p.notes || ''}`,
        ref: p.reference_no,
        debit: p.payment_type === 'paid' ? p.amount : 0,
        credit: p.payment_type === 'received' ? p.amount : 0,
      }));

    const all = [...partyOutwards, ...partyInwards, ...partyPayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = party.opening_balance || 0;
    return all.map((row) => {
      running += row.debit - row.credit;
      return {
        ...row,
        running_balance: running,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Parties & Ledgers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Customer and supplier accounts, running balances & statements
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Party
        </button>
      </div>

      {/* Parties Table */}
      <div className="glass-panel overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Party Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Phone / GSTIN</th>
                <th className="px-5 py-3.5 text-right">Outstanding Balance</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {parties.map((party) => {
                const bal = calculatePartyBalance(party.id);
                return (
                  <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{party.name}</div>
                      {party.address && <div className="text-slate-400 text-[11px] mt-0.5">{party.address}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider border ${
                        party.party_type === 'customer'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : party.party_type === 'supplier'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {party.party_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400">
                      <div>{party.phone || '-'}</div>
                      {party.gstin && <div className="text-[10px] text-slate-400">GST: {party.gstin}</div>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className={`font-mono text-sm font-bold ${
                        bal > 0 ? 'text-emerald-600 dark:text-emerald-400' : (bal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')
                      }`}>
                        ₹{Math.abs(bal).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bal > 0 ? '(Receivable)' : (bal < 0 ? '(Payable)' : 'Settled')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedParty(party);
                            setLedgerModalOpen(true);
                          }}
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-500 rounded-lg transition"
                          title="View Ledger Statement"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedParty(party);
                            setPayType(party.party_type === 'supplier' ? 'paid' : 'received');
                            setPayModalOpen(true);
                          }}
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-500 rounded-lg transition"
                          title="Record Payment"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {parties.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-sans">No parties added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Party Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Party</h3>
              <button onClick={() => setAddModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddParty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Party Name *</label>
                <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} required placeholder="Company or Individual Name" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Party Type</label>
                  <select value={pType} onChange={(e: any) => setPType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input type="text" value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="Mobile No." className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">GSTIN</label>
                  <input type="text" value={pGstin} onChange={(e) => setPGstin(e.target.value)} placeholder="GST Number" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Opening Balance (₹)</label>
                  <input type="number" step="any" value={pOpening} onChange={(e) => setPOpening(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <textarea rows={2} value={pAddress} onChange={(e) => setPAddress(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">Save Party</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModalOpen && selectedParty && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Payment — {selectedParty.name}</h3>
              <button onClick={() => setPayModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                  <select value={payType} onChange={(e: any) => setPayType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="received">Received (Inflow)</option>
                    <option value="paid">Paid (Outflow)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹) *</label>
                  <input type="number" step="any" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required placeholder="0.00" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
                  <select value={payMode} onChange={(e: any) => setPayMode(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank">Bank / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Reference No.</label>
                <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="UPI ID / Cheque No" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setPayModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Statement Modal */}
      {ledgerModalOpen && selectedParty && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedParty.name} — Statement</h3>
                <p className="text-xs text-slate-400">Phone: {selectedParty.phone || 'N/A'} | GST: {selectedParty.gstin || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs flex items-center gap-1">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setLedgerModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-600 dark:text-slate-300">
                <thead className="uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Details</th>
                    <th className="px-4 py-2.5">Ref</th>
                    <th className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">Debit (+)</th>
                    <th className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">Credit (-)</th>
                    <th className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="bg-slate-50 dark:bg-slate-900/40">
                    <td className="px-4 py-2 text-slate-400">Base</td>
                    <td className="px-4 py-2 font-sans font-medium">Opening Balance</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">-</td>
                    <td className="px-4 py-2 text-slate-400">-</td>
                    <td className="px-4 py-2 text-right">-</td>
                    <td className="px-4 py-2 text-right">-</td>
                    <td className="px-4 py-2 text-right font-bold">₹{selectedParty.opening_balance.toLocaleString()}</td>
                  </tr>
                  {getPartyLedger(selectedParty.id).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-2 text-slate-400">{r.date}</td>
                      <td className="px-4 py-2 font-sans font-medium text-slate-900 dark:text-white">{r.type}</td>
                      <td className="px-4 py-2 font-sans text-slate-500">{r.details}</td>
                      <td className="px-4 py-2 text-slate-400">{r.ref || '-'}</td>
                      <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400">{r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">₹{r.running_balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
