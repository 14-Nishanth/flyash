import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, IndianRupee, BookOpen, X, Printer, Edit2, Trash2, Share2, Lock, Filter } from 'lucide-react';
import { Party, Payment } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Parties: React.FC = () => {
  const {
    parties,
    inwards,
    outwards,
    payments,
    addParty,
    updateParty,
    deleteParty,
    addPayment,
    updatePayment,
    deletePayment,
    calculatePartyBalance,
    canDelete,
    checkDuplicate,
  } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    data: any;
    details?: string;
  }>({
    isOpen: false,
    data: null,
  });

  // Party Form state
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

  const openAddParty = () => {
    setEditingParty(null);
    setPName('');
    setPType('customer');
    setPPhone('');
    setPAddress('');
    setPGstin('');
    setPOpening('0');
    setAddModalOpen(true);
  };

  const openEditParty = (party: Party) => {
    setEditingParty(party);
    setPName(party.name);
    setPType(party.party_type);
    setPPhone(party.phone || '');
    setPAddress(party.address || '');
    setPGstin(party.gstin || '');
    setPOpening(String(party.opening_balance || 0));
    setAddModalOpen(true);
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: pName.trim(),
      party_type: pType,
      phone: pPhone.trim(),
      address: pAddress.trim(),
      gstin: pGstin.trim().toUpperCase(),
      opening_balance: parseFloat(pOpening) || 0,
    };

    if (!editingParty) {
      const dup = checkDuplicate('party', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          data: payload,
          details: dup.details,
        });
        return;
      }
      await addParty(payload);
    } else {
      await updateParty(editingParty.id, payload);
    }
    setAddModalOpen(false);
  };

  const handleConfirmDuplicateParty = async () => {
    await addParty(duplicateModal.data);
    setAddModalOpen(false);
    setDuplicateModal({ isOpen: false, data: null });
  };

  const handleDeleteParty = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete parties.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this party? All related statements will remain intact.')) {
      await deleteParty(id);
    }
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
    setPayRef('');
    setPayNotes('');
  };

  const handleDeletePayment = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete payments.');
      return;
    }
    if (window.confirm('Delete this payment transaction?')) {
      await deletePayment(id);
    }
  };

  // Generate Party Ledger
  const getPartyLedger = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return [];

    const partyOutwards = outwards
      .filter((o) => o.party_id === partyId)
      .map((o) => ({
        id: o.id,
        rawType: 'outward',
        date: o.date,
        type: 'Dispatch (Outward)',
        details: `${o.material_type} (${o.quantity_mt} ${o.quantity_unit})`,
        ref: o.vehicle_no,
        debit: o.amount,
        credit: 0,
      }));

    const partyInwards = inwards
      .filter((i) => i.party_id === partyId)
      .map((i) => ({
        id: i.id,
        rawType: 'inward',
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
        id: p.id,
        rawType: 'payment',
        date: p.date,
        type: `Payment ${p.payment_type.toUpperCase()}`,
        details: `Mode: ${p.mode.toUpperCase()}${p.notes ? ' — ' + p.notes : ''}`,
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

  const shareWhatsAppStatement = (party: Party) => {
    const bal = calculatePartyBalance(party.id);
    const balText = bal > 0 ? `₹${bal.toLocaleString()} (Receivable)` : bal < 0 ? `₹${Math.abs(bal).toLocaleString()} (Payable)` : `₹0 (Settled)`;
    const text = `*ACCOUNT STATEMENT — ${party.name.toUpperCase()}*\n----------------------------------------\n*Party Type:* ${party.party_type.toUpperCase()}\n*Current Balance:* ${balText}\n*Phone:* ${party.phone || 'N/A'}\n*GSTIN:* ${party.gstin || 'N/A'}\n----------------------------------------\nFor detailed billing breakdown, please contact plant office.`;
    window.open(`https://wa.me/${party.phone ? party.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredParties = parties.filter((p) => {
    if (filterType === 'customer') return p.party_type === 'customer' || p.party_type === 'both';
    if (filterType === 'supplier') return p.party_type === 'supplier' || p.party_type === 'both';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Parties & Ledgers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Customer and supplier accounts, running balances, payment vouchers & statements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All ({parties.length})
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'customer' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Customers
            </button>
            <button
              onClick={() => setFilterType('supplier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === 'supplier' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Suppliers
            </button>
          </div>
          <button
            onClick={openAddParty}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Party
          </button>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Party Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Phone / GSTIN</th>
                <th className="px-5 py-3.5 text-right">Outstanding Balance</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredParties.map((party) => {
                const bal = calculatePartyBalance(party.id);
                return (
                  <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{party.name}</div>
                      {party.address && <div className="text-slate-400 text-[11px] mt-0.5">{party.address}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider border ${
                          party.party_type === 'customer'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : party.party_type === 'supplier'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        {party.party_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-400">
                      <div>{party.phone || '-'}</div>
                      {party.gstin && <div className="text-[10px] text-slate-400 font-sans">GST: {party.gstin}</div>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div
                        className={`font-mono text-sm font-bold ${
                          bal > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : bal < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        ₹{Math.abs(bal).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bal > 0 ? '(Receivable)' : bal < 0 ? '(Payable)' : 'Settled'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedParty(party);
                            setLedgerModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="View Ledger Statement"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedParty(party);
                            setPayType(party.party_type === 'supplier' ? 'paid' : 'received');
                            setPayModalOpen(true);
                          }}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                          title="Record Payment"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => shareWhatsAppStatement(party)}
                          className="p-1.5 bg-green-50 dark:bg-green-950/50 hover:bg-green-100 text-green-600 rounded-lg transition"
                          title="Share WhatsApp Summary"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditParty(party)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                          title="Edit Party Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete ? (
                          <button
                            onClick={() => handleDeleteParty(party.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Delete Party"
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
              {filteredParties.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No parties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Party Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingParty ? 'Edit Party Profile' : 'Add New Party'}
              </h3>
              <button onClick={() => setAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveParty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Party Name *
                </label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                  placeholder="Company or Customer Name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Party Type</label>
                  <select
                    value={pType}
                    onChange={(e: any) => setPType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="Mobile No."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={pGstin}
                    onChange={(e) => setPGstin(e.target.value)}
                    placeholder="GST Number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={pOpening}
                    onChange={(e) => setPOpening(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  {editingParty ? 'Update Party' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModalOpen && selectedParty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Payment — {selectedParty.name}
              </h3>
              <button onClick={() => setPayModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={payType}
                    onChange={(e: any) => setPayType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="received">Received (Inflow)</option>
                    <option value="paid">Paid (Outflow)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mode</label>
                  <select
                    value={payMode}
                    onChange={(e: any) => setPayMode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank">Bank / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Reference No.
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="UPI Ref ID / Cheque No"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Statement Modal */}
      {ledgerModalOpen && selectedParty && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedParty.name} — Statement</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phone: {selectedParty.phone || 'N/A'} | GST: {selectedParty.gstin || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setLedgerModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Details</th>
                    <th className="px-4 py-2.5">Ref</th>
                    <th className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">Debit (+)</th>
                    <th className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">Credit (-)</th>
                    <th className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">Balance</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <td className="px-4 py-2 text-slate-400">Base</td>
                    <td className="px-4 py-2 font-sans font-medium">Opening Balance</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">-</td>
                    <td className="px-4 py-2 text-slate-400">-</td>
                    <td className="px-4 py-2 text-right">-</td>
                    <td className="px-4 py-2 text-right">-</td>
                    <td className="px-4 py-2 text-right font-bold">
                      ₹{selectedParty.opening_balance?.toLocaleString() || 0}
                    </td>
                    <td></td>
                  </tr>
                  {getPartyLedger(selectedParty.id).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-2 text-slate-500">{r.date}</td>
                      <td className="px-4 py-2 font-sans font-semibold text-slate-900 dark:text-white">{r.type}</td>
                      <td className="px-4 py-2 font-sans text-slate-600 dark:text-slate-400">{r.details}</td>
                      <td className="px-4 py-2 text-slate-500">{r.ref || '-'}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-rose-600 dark:text-rose-400">
                        {r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                        ₹{r.running_balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {r.rawType === 'payment' && canDelete && (
                          <button
                            onClick={() => handleDeletePayment(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Party Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Party Warning"
        message="A party with matching name or phone number already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicateParty}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
