import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  IndianRupee,
  BookOpen,
  X,
  Printer,
  Edit2,
  Trash2,
  Share2,
  Lock,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Check,
  Building2,
  Phone
} from 'lucide-react';
import { Party, Payment, PartyAdjustment, VoucherType, PaymentMode } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Parties: React.FC = () => {
  const {
    parties,
    inwards,
    outwards,
    payments,
    partyAdjustments,
    expenses,
    addParty,
    updateParty,
    deleteParty,
    addPartyAdjustment,
    updatePartyAdjustment,
    deletePartyAdjustment,
    addPayment,
    deletePayment,
    calculatePartyBalance,
    canDelete,
    checkDuplicate,
  } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit' | 'customer' | 'supplier'>('all');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'credit' | 'debit' | 'payment'>('all');

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    data: any;
    details?: string;
  }>({
    isOpen: false,
    data: null,
  });

  // Party Form State
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState<'customer' | 'supplier' | 'both' | 'transporter'>('customer');
  const [pPhone, setPPhone] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pGstin, setPGstin] = useState('');
  const [pOpening, setPOpening] = useState('');
  const [pOpeningType, setPOpeningType] = useState<'credit' | 'debit'>('credit');
  const [pCreditLimit, setPCreditLimit] = useState('');
  const [pCreditDays, setPCreditDays] = useState('');

  // Voucher Form State
  const [vType, setVType] = useState<VoucherType>('credit');
  const [vCategory, setVCategory] = useState('Goods Sold on Credit');
  const [vAmount, setVAmount] = useState('');
  const [vMode, setVMode] = useState<any>('journal');
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [vRef, setVRef] = useState('');
  const [vNotes, setVNotes] = useState('');

  // Quick Pay Modal State
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Voucher Preset Categories
  const creditCategories = [
    'Goods Sold on Credit',
    'Old Outstanding Due',
    'Transport / Freight Charged',
    'Interest / Penalty Fee',
    'Manual Credit Adjustment',
  ];

  const debitCategories = [
    'Raw Material Purchase (Inward)',
    'Payment Received / Cleared',
    'Discount / Rebate Allowed',
    'Sales Return / Defect Deduction',
    'Manual Debit Adjustment',
  ];

  const openAddParty = () => {
    setEditingParty(null);
    setPName('');
    setPType('customer');
    setPPhone('');
    setPAddress('');
    setPGstin('');
    setPOpening('');
    setPOpeningType('credit');
    setPCreditLimit('');
    setPCreditDays('');
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
    setPOpeningType(party.opening_balance_type || 'credit');
    setPCreditLimit(party.credit_limit ? String(party.credit_limit) : '');
    setPCreditDays(party.credit_period_days ? String(party.credit_period_days) : '');
    setAddModalOpen(true);
  };

  const openRecordVoucher = (party: Party, defaultType: VoucherType = 'credit') => {
    setSelectedParty(party);
    setVType(defaultType);
    setVCategory(defaultType === 'credit' ? creditCategories[0] : debitCategories[0]);
    setVAmount('');
    setVMode(defaultType === 'credit' ? 'journal' : 'cash');
    setVDate(new Date().toISOString().split('T')[0]);
    setVRef('');
    setVNotes('');
    setVoucherModalOpen(true);
  };

  const openQuickPay = (party: Party) => {
    setSelectedParty(party);
    const bal = calculatePartyBalance(party.id);
    // If debit (I need to pay), preset with due amount; otherwise empty
    setPayAmount(bal < 0 ? String(Math.abs(bal)) : '');
    setPayMode('upi');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayNotes(`Payment towards outstanding balance to ${party.name}`);
    setPayModalOpen(true);
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
      opening_balance_type: pOpeningType,
      credit_limit: parseFloat(pCreditLimit) || undefined,
      credit_period_days: parseInt(pCreditDays) || undefined,
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

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    const amt = parseFloat(vAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    await addPartyAdjustment({
      date: vDate,
      party_id: selectedParty.id,
      voucher_type: vType,
      category: vCategory,
      amount: amt,
      payment_mode: vMode,
      reference_no: vRef.trim(),
      notes: vNotes.trim(),
    });

    setVoucherModalOpen(false);
    setVAmount('');
    setVRef('');
    setVNotes('');
  };

  const handleSaveQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    await addPayment({
      date: payDate,
      party_id: selectedParty.id,
      party_name: selectedParty.name,
      payment_type: 'paid',
      amount: amt,
      mode: payMode,
      reference_no: payRef.trim(),
      notes: payNotes.trim(),
    });

    setPayModalOpen(false);
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
  };

  const handleDeleteAdjustment = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete vouchers.');
      return;
    }
    if (window.confirm('Delete this voucher entry?')) {
      await deletePartyAdjustment(id);
    }
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
  // Credit = Party needs to pay to me (+ Credit)
  // Debit = Who I need to pay (- Debit / Payments received)
  const getPartyLedger = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return [];

    const partyOutwards = outwards
      .filter((o) => o.party_id === partyId)
      .map((o) => ({
        id: o.id,
        rawType: 'outward',
        date: o.date,
        type: 'Sales Dispatch (Credit)',
        category: 'Goods Dispatched',
        details: `${o.material_type} (${o.quantity_mt} ${o.quantity_unit})`,
        ref: o.vehicle_no,
        credit: o.amount,
        debit: 0,
        mode: '-',
      }));

    const partyInwards = inwards
      .filter((i) => i.party_id === partyId)
      .map((i) => ({
        id: i.id,
        rawType: 'inward',
        date: i.date,
        type: 'Material Inward (Debit)',
        category: 'Purchase from Supplier',
        details: `${i.material_type} (${i.quantity_mt} ${i.quantity_unit})`,
        ref: i.vehicle_no,
        credit: 0,
        debit: i.amount,
        mode: '-',
      }));

    const partyPaymentsList = payments
      .filter((p) => p.party_id === partyId)
      .map((p) => ({
        id: p.id,
        rawType: 'payment',
        date: p.date,
        type: p.payment_type === 'received' ? 'Payment Received (Debit - Cleared)' : 'Payment Paid to Supplier (Credit - Cleared)',
        category: `Payment ${p.payment_type.toUpperCase()}`,
        details: `${p.notes ? p.notes : 'Payment Settlement'}`,
        ref: p.reference_no,
        credit: p.payment_type === 'paid' ? p.amount : 0,
        debit: p.payment_type === 'received' ? p.amount : 0,
        mode: p.mode.toUpperCase(),
      }));

    const partyAdjList = partyAdjustments
      .filter((a) => a.party_id === partyId)
      .map((a) => ({
        id: a.id,
        rawType: 'adjustment',
        date: a.date,
        type: a.voucher_type === 'credit' ? `Credit Note (+ Party Owes Me)` : `Debit Note (+ I Owe / Paid)`,
        category: a.category,
        details: `${a.category}${a.notes ? ' — ' + a.notes : ''}`,
        ref: a.reference_no,
        credit: a.voucher_type === 'credit' ? a.amount : 0,
        debit: a.voucher_type === 'debit' ? a.amount : 0,
        mode: a.payment_mode ? a.payment_mode.toUpperCase() : 'JOURNAL',
      }));

    const partyUnpaidExpenses = expenses
      .filter(
        (e) =>
          e.party_id === partyId &&
          e.expense_type !== 'supplier_payment' &&
          !e.category.includes('Supplier Due Payment') &&
          !e.category.includes('Outstanding Settlement') &&
          (e.payment_status === 'unpaid' || e.payment_status === 'partial' || e.is_paid === false || e.payment_mode === 'credit')
      )
      .map((e) => {
        const amt = e.payment_status === 'partial' && e.due_amount !== undefined ? e.due_amount : e.amount;
        return {
          id: e.id,
          rawType: 'expense',
          date: e.date,
          type: 'Material / Expense Due (Debit — I Need to Pay)',
          category: e.category,
          details: `${e.title}${e.material_type ? ` [${e.material_type}]` : ''}${e.payment_status === 'partial' ? ` (Partial: Due ₹${amt})` : ''}`,
          ref: e.reference_no,
          credit: 0,
          debit: amt,
          mode: 'NOT PAID (DUE)',
        };
      });

    const partySupplierPayments = expenses
      .filter(
        (e) =>
          e.party_id === partyId &&
          (e.expense_type === 'supplier_payment' ||
            e.category === 'Supplier Due Payment' ||
            e.category.includes('Supplier Due Payment') ||
            e.category.includes('Outstanding Settlement'))
      )
      .map((e) => ({
        id: e.id,
        rawType: 'supplier_payment',
        date: e.date,
        type: 'Paid to Supplier (Credit — Reduces What I Need to Pay)',
        category: 'Supplier Due Payment',
        details: `${e.title}${e.notes ? ' — ' + e.notes : ''}`,
        ref: e.reference_no,
        credit: e.amount,
        debit: 0,
        mode: e.payment_mode ? e.payment_mode.toUpperCase() : 'PAID',
      }));

    const all = [...partyOutwards, ...partyInwards, ...partyPaymentsList, ...partyAdjList, ...partyUnpaidExpenses, ...partySupplierPayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = party.opening_balance_type === 'debit' ? -(party.opening_balance || 0) : (party.opening_balance || 0);

    return all.map((row) => {
      running += row.credit - row.debit;
      return {
        ...row,
        running_balance: running,
      };
    });
  };

  const shareWhatsAppStatement = (party: Party) => {
    const bal = calculatePartyBalance(party.id);
    const balText =
      bal > 0
        ? `₹${bal.toLocaleString()} (Credit — Remaining Amount You Need to Pay to Us)`
        : bal < 0
        ? `₹${Math.abs(bal).toLocaleString()} (Debit — Remaining Amount We Need to Pay to You)`
        : `₹0.00 (Fully Settled — No Remaining Balance)`;
    const text = `*ACCOUNT STATEMENT — ${party.name.toUpperCase()}*\n----------------------------------------\n*Party Type:* ${party.party_type.toUpperCase()}\n*Outstanding Status:* ${balText}\n*Phone:* ${party.phone || 'N/A'}\n*GSTIN:* ${party.gstin || 'N/A'}${party.credit_limit ? '\n*Credit Limit:* ₹' + party.credit_limit.toLocaleString() : ''}\n----------------------------------------\nFor detailed billing breakdown, please contact plant accounts office.`;
    window.open(
      `https://wa.me/${party.phone ? party.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  // Top Summary Metrics
  const totalCreditToReceive = parties.reduce((sum, p) => {
    const bal = calculatePartyBalance(p.id);
    return bal > 0 ? sum + bal : sum;
  }, 0);

  const totalDebitToPay = parties.reduce((sum, p) => {
    const bal = calculatePartyBalance(p.id);
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);

  const filteredParties = parties.filter((p) => {
    const bal = calculatePartyBalance(p.id);
    if (filterType === 'credit') return bal > 0;
    if (filterType === 'debit') return bal < 0;
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
            Parties & Credit / Debit Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <strong>Credit:</strong> Parties who need to pay to me &nbsp;|&nbsp; <strong>Debit:</strong> Who I need to pay (Supplier Dues)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (parties.length > 0) openRecordVoucher(parties[0], 'credit');
              else openAddParty();
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <IndianRupee className="w-4 h-4" /> Record Credit / Debit Voucher
          </button>
          <button
            onClick={openAddParty}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Party
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Total Credit (Remaining to Receive)
            </span>
            <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalCreditToReceive.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Parties who need to pay to me</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Total Debit (Remaining Amount to Pay)
            </span>
            <div className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ₹{totalDebitToPay.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Who I need to pay (Supplier Dues)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Registered Accounts
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {parties.length} Accounts
            </div>
            <span className="text-[11px] text-slate-400">
              {parties.filter((p) => p.party_type === 'customer').length} Buyers, {parties.filter((p) => p.party_type === 'supplier').length} Suppliers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: `All Accounts (${parties.length})` },
            { id: 'debit', label: '🔴 Debit (Remaining Amount to Pay)' },
            { id: 'credit', label: '🟢 Credit (Remaining to Receive)' },
            { id: 'customer', label: 'Customers' },
            { id: 'supplier', label: 'Suppliers' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Party Name</th>
                <th className="px-5 py-3.5">Party Type</th>
                <th className="px-5 py-3.5">Phone / GSTIN</th>
                <th className="px-5 py-3.5">Opening Setup</th>
                <th className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">Outstanding Status</th>
                <th className="px-5 py-3.5 text-center">Actions & Settlements</th>
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
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider border ${
                            party.party_type === 'customer'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                              : party.party_type === 'supplier'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40'
                              : party.party_type === 'transporter'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                          }`}
                        >
                          {party.party_type}
                        </span>
                        {party.credit_limit && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Limit: ₹{party.credit_limit.toLocaleString()} {party.credit_period_days ? `(${party.credit_period_days}d)` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-400">
                      <div>{party.phone || '-'}</div>
                      {party.gstin && <div className="text-[10px] text-slate-400 font-sans">GST: {party.gstin}</div>}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-400">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{party.opening_balance?.toLocaleString() || 0}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${party.opening_balance_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {party.opening_balance_type === 'debit' ? 'Debit (I Need to Pay)' : 'Credit (Needs to Pay Me)'}
                      </span>
                    </td>

                    {/* Outstanding Status Column */}
                    <td className="px-5 py-4 text-right">
                      <div
                        className={`font-mono text-sm font-extrabold ${
                          bal > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : bal < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        ₹{Math.abs(bal).toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold mt-0.5">
                        {bal > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            🟢 Remaining to Receive
                          </span>
                        ) : bal < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                            🔴 Remaining Amount to Pay
                          </span>
                        ) : (
                          <span className="text-slate-400">⚪ Settled (₹0.00 Remaining)</span>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedParty(party);
                            setLedgerModalOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          title="View Ledger Statement"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Ledger
                        </button>

                        {/* Pay Due Button (Featured if there is an amount to pay) */}
                        {bal < 0 ? (
                          <button
                            onClick={() => openQuickPay(party)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-bold text-xs flex items-center gap-1 shadow-sm shadow-rose-600/20"
                            title="Pay this supplier & reduce remaining amount to pay"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Pay Due
                          </button>
                        ) : (
                          <button
                            onClick={() => openQuickPay(party)}
                            className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition font-semibold text-xs flex items-center gap-1"
                            title="Record Payment"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}

                        <button
                          onClick={() => openRecordVoucher(party, 'credit')}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition font-bold text-xs"
                          title="Record Credit: Party needs to pay to me"
                        >
                          +Credit
                        </button>
                        <button
                          onClick={() => openRecordVoucher(party, 'debit')}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg transition font-bold text-xs"
                          title="Record Debit: Who I need to pay"
                        >
                          +Debit
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
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No parties found matching this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Pay Party Modal */}
      {payModalOpen && selectedParty && (() => {
        const currentBal = calculatePartyBalance(selectedParty.id);
        const amtPaying = parseFloat(payAmount) || 0;
        // Current balance: if negative (e.g. -60000), paying 30000 -> -60000 + 30000 = -30000
        const newBal = currentBal + amtPaying;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600" /> Pay Supplier / Clear Outstanding
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Party: {selectedParty.name}</p>
                </div>
                <button onClick={() => setPayModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {/* Outstanding Balance Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Current Outstanding:</span>
                  <span className={`font-mono font-extrabold text-sm ${currentBal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                    ₹{Math.abs(currentBal).toLocaleString('en-IN')}{' '}
                    <span className="text-[11px]">{currentBal < 0 ? 'Dr (I Need to Pay)' : 'Cr (Receivable)'}</span>
                  </span>
                </div>

                {amtPaying > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-400">Remaining Amount to Pay:</span>
                    <span className="font-mono font-extrabold text-base">
                      {newBal < 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">₹{Math.abs(newBal).toLocaleString('en-IN')} Dr (I Need to Pay)</span>
                      ) : newBal === 0 ? (
                        <span className="text-emerald-600">₹0.00 Fully Settled!</span>
                      ) : (
                        <span className="text-emerald-600">₹{newBal.toLocaleString('en-IN')} Cr (Advance/Receivable)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveQuickPay} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount to Pay (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      placeholder="e.g. 30000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode *</label>
                    <select
                      value={payMode}
                      onChange={(e: any) => setPayMode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="upi">📱 UPI / GPay / PhonePe</option>
                      <option value="bank">🏦 Bank Transfer (NEFT/IMPS)</option>
                      <option value="cash">💵 Cash</option>
                      <option value="cheque">📝 Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ref / Bill No.</label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="UPI Ref / Cheque No"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Notes</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Part payment for Fly Ash load"
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Payment & Update Balance
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Party Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingParty ? 'Edit Party Profile' : 'Add New Party Profile'}
              </h3>
              <button onClick={() => setAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveParty} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Party / Company Name *
                </label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                  placeholder="e.g. Sri Murugan Enterprises"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Party Type
                  </label>
                  <select
                    value={pType}
                    onChange={(e: any) => setPType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="customer">Customer (Buyer)</option>
                    <option value="supplier">Supplier (Vendor / Raw Material)</option>
                    <option value="transporter">Transporter / Contractor</option>
                    <option value="both">Both (Customer & Supplier)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Opening Balance Configuration */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Opening Balance Setup</span>
                  <span className="text-[10px] text-slate-400 font-normal">Starting Balance</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Opening Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={pOpening}
                      onChange={(e) => setPOpening(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Balance Type
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPOpeningType('credit')}
                        className={`py-1 rounded text-[11px] font-bold transition ${
                          pOpeningType === 'credit'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Credit (Pay Me)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPOpeningType('debit')}
                        className={`py-1 rounded text-[11px] font-bold transition ${
                          pOpeningType === 'debit'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Debit (I Pay)
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  * {pOpeningType === 'credit' ? 'Credit: Party needs to pay to me (Receivable from Party)' : 'Debit: I need to pay to party (Payable to Supplier/Vendor)'}
                </div>
              </div>

              {/* Credit Limit & Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Credit Limit (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={pCreditLimit}
                    onChange={(e) => setPCreditLimit(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Credit Terms (Days) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={pCreditDays}
                    onChange={(e) => setPCreditDays(e.target.value)}
                    placeholder="e.g. 15 / 30 days"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={pAddress}
                    onChange={(e) => setPAddress(e.target.value)}
                    placeholder="City, Site Location"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

      {/* Record Credit / Debit Voucher Modal */}
      {voucherModalOpen && selectedParty && (() => {
        const curBal = calculatePartyBalance(selectedParty.id);
        const enteredAmt = parseFloat(vAmount) || 0;
        const projected = vType === 'credit' ? curBal + enteredAmt : curBal - enteredAmt;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600" /> Record Credit / Debit Entry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Party: {selectedParty.name}</p>
                </div>
                <button onClick={() => setVoucherModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {/* Live Remaining Balance Calculation Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className={`font-mono font-bold ${curBal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{Math.abs(curBal).toLocaleString('en-IN')} {curBal < 0 ? 'Dr (I Need to Pay)' : 'Cr (Needs to Pay Me)'}
                  </span>
                </div>

                {enteredAmt > 0 && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Remaining Balance After Entry:</span>
                    <span className="font-mono text-sm">
                      {projected < 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">₹{Math.abs(projected).toLocaleString('en-IN')} Dr (Remaining to Pay)</span>
                      ) : projected > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">₹{projected.toLocaleString('en-IN')} Cr (Remaining to Receive)</span>
                      ) : (
                        <span className="text-emerald-600">₹0.00 Fully Settled</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveVoucher} className="space-y-4">
                {/* Voucher Type Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVType('credit');
                        setVCategory(creditCategories[0]);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        vType === 'credit'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 ring-2 ring-emerald-500/50'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>🟢 CREDIT (+ Party Needs to Pay Me)</span>
                      <span className="text-[10px] font-normal opacity-80">Increases amount party owes me</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVType('debit');
                        setVCategory(debitCategories[0]);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        vType === 'debit'
                          ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 ring-2 ring-rose-500/50'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>🔴 DEBIT (+ Who I Need to Pay / Paid)</span>
                      <span className="text-[10px] font-normal opacity-80">Increases amount I owe or payment cleared</span>
                    </button>
                  </div>
                </div>

                {/* Quick Preset Chips for Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Reason / Category Preset
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(vType === 'credit' ? creditCategories : debitCategories).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          vCategory === cat
                            ? vType === 'credit'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-rose-600 text-white border-rose-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    required
                    placeholder="Or enter custom description"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={vDate}
                      onChange={(e) => setVDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={vAmount}
                      onChange={(e) => setVAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Settlement Mode
                    </label>
                    <select
                      value={vMode}
                      onChange={(e: any) => setVMode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / GPay / PhonePe</option>
                      <option value="bank">Bank Transfer / NEFT</option>
                      <option value="cheque">Cheque</option>
                      <option value="journal">Book Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Reference / Bill No.
                    </label>
                    <input
                      type="text"
                      value={vRef}
                      onChange={(e) => setVRef(e.target.value)}
                      placeholder="e.g. Bill #104 / UPI Ref"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={vNotes}
                    onChange={(e) => setVNotes(e.target.value)}
                    placeholder="Optional details"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setVoucherModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-md ${
                      vType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    }`}
                  >
                    Save {vType === 'credit' ? 'Credit Entry (+ Party Owes Me)' : 'Debit Entry (+ Who I Need to Pay)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Ledger Statement Modal */}
      {ledgerModalOpen && selectedParty && (() => {
        const finalBal = calculatePartyBalance(selectedParty.id);
        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    {selectedParty.name} — Running Ledger Statement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phone: {selectedParty.phone || 'N/A'} | GST: {selectedParty.gstin || 'N/A'} | Type: {selectedParty.party_type.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => openQuickPay(selectedParty)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Pay Due
                  </button>
                  <button
                    onClick={() => openRecordVoucher(selectedParty, 'credit')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                  >
                    + Record Credit
                  </button>
                  <button onClick={() => setLedgerModalOpen(false)}>
                    <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Outstanding Status Banner in Statement */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Outstanding Summary:
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-extrabold">
                    {finalBal < 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        🔴 Remaining Amount to Pay: ₹{Math.abs(finalBal).toLocaleString('en-IN')} Dr
                      </span>
                    ) : finalBal > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        🟢 Remaining Amount to Receive: ₹{finalBal.toLocaleString('en-IN')} Cr
                      </span>
                    ) : (
                      <span className="text-slate-400">⚪ ₹0.00 (Fully Settled — No Balance)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ledger Filter Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex gap-1.5">
                  {[
                    { id: 'all', label: 'All Entries' },
                    { id: 'credit', label: 'Credit (Need to pay me)' },
                    { id: 'debit', label: 'Debit (Who I need to pay)' },
                    { id: 'payment', label: 'Payments' },
                  ].map((lf) => (
                    <button
                      key={lf.id}
                      onClick={() => setLedgerFilter(lf.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        ledgerFilter === lf.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {lf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Details</th>
                      <th className="px-4 py-2.5">Ref / Mode</th>
                      <th className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">Credit (+ Party Owes Me)</th>
                      <th className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">Debit (+ I Owe / Paid)</th>
                      <th className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">Running Balance</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                      <td className="px-4 py-2 text-slate-400">Opening</td>
                      <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                        Opening Balance ({selectedParty.opening_balance_type === 'debit' ? 'Debit - I Need to Pay' : 'Credit - Party Needs to Pay Me'})
                      </td>
                      <td className="px-4 py-2 text-slate-400 font-sans">Initial starting balance</td>
                      <td className="px-4 py-2 text-slate-400">-</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-600">
                        {selectedParty.opening_balance_type !== 'debit' && selectedParty.opening_balance > 0 ? `₹${selectedParty.opening_balance.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-rose-600">
                        {selectedParty.opening_balance_type === 'debit' && selectedParty.opening_balance > 0 ? `₹${selectedParty.opening_balance.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                        ₹{selectedParty.opening_balance?.toLocaleString() || 0} {selectedParty.opening_balance_type === 'debit' ? '(Debit)' : '(Credit)'}
                      </td>
                      <td></td>
                    </tr>

                    {/* Transaction Rows */}
                    {getPartyLedger(selectedParty.id)
                      .filter((r) => {
                        if (ledgerFilter === 'credit') return r.credit > 0;
                        if (ledgerFilter === 'debit') return r.debit > 0;
                        if (ledgerFilter === 'payment') return r.rawType === 'payment' || r.rawType === 'supplier_payment';
                        return true;
                      })
                      .map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-2 text-slate-500">{r.date}</td>
                          <td className="px-4 py-2 font-sans font-semibold text-slate-900 dark:text-white">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mr-1.5 ${
                                r.credit > 0
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                              }`}
                            >
                              {r.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-sans text-slate-600 dark:text-slate-400">{r.details}</td>
                          <td className="px-4 py-2 text-slate-500">
                            {r.ref && <span className="mr-1">{r.ref}</span>}
                            <span className="text-[10px] uppercase font-bold text-slate-400">({r.mode})</span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-rose-600 dark:text-rose-400">
                            {r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                            ₹{Math.abs(r.running_balance).toLocaleString()}{' '}
                            <span className="text-[10px] font-semibold">
                              {r.running_balance < 0 ? '(Dr - I Pay)' : r.running_balance > 0 ? '(Cr - Pay Me)' : '(Settled)'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {r.rawType === 'adjustment' && canDelete && (
                              <button
                                onClick={() => handleDeleteAdjustment(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {r.rawType === 'payment' && canDelete && (
                              <button
                                onClick={() => handleDeletePayment(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
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
        );
      })()}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Party Warning"
        message="A party profile with a matching name or phone number already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicateParty}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
