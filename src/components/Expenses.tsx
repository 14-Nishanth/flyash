import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Lock, 
  Fuel, 
  Zap, 
  Wrench, 
  Package, 
  Truck, 
  Building2, 
  Search, 
  Filter, 
  Phone, 
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Check,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Sparkles
} from 'lucide-react';
import { Expense, PaymentMode, PaymentStatus, ExpenseType } from '../types';
import { DuplicateWarningModal } from './DuplicateWarningModal';

export const Expenses: React.FC = () => {
  const { 
    expenses, 
    parties, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    addInward,
    canDelete, 
    checkDuplicate, 
    calculatePartyBalance 
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlingExpense, setSettlingExpense] = useState<Expense | null>(null);
  const [settleMode, setSettleMode] = useState<PaymentMode>('cash');
  const [settleRef, setSettleRef] = useState('');

  // Duplicate warning modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    data: any;
    details?: string;
  }>({
    isOpen: false,
    data: null,
  });

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryMode, setEntryMode] = useState<'material' | 'supplier_payment' | 'general'>('material');
  const [category, setCategory] = useState('Raw Material / Material Purchase');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [paidTo, setPaidTo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [materialType, setMaterialType] = useState('Fly Ash (Mettur)');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Ton');
  const [rate, setRate] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [addToStock, setAddToStock] = useState(true);
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  // Standard Material Options
  const standardMaterials = [
    'Fly Ash (Mettur)',
    'Fly Ash (Tuticorin)',
    'Fly Ash (Thermal Power)',
    'Cement - OPC 53 (Bags)',
    'Cement - PPC (Bags)',
    'Cement (Bulk MT)',
    'Quarry Dust / Stone Dust',
    'Cool Dust / Pond Ash',
    'Lime / Quicklime',
    'Gypsum',
    'Chemical Admixture / Hardener',
    'Custom / Other Material',
  ];

  // Standard Units
  const units = ['Ton', 'MT', 'Bags', 'Kg', 'Brass', 'Loads', 'Units'];

  // Auto-calculate amount when quantity and rate change
  const handleQtyChange = (newQty: string) => {
    setQuantity(newQty);
    const q = parseFloat(newQty);
    const r = parseFloat(rate);
    if (!isNaN(q) && !isNaN(r) && q > 0 && r > 0) {
      const tot = (q * r).toFixed(2);
      setAmount(tot);
      if (paymentStatus === 'paid') {
        setPaidAmount(tot);
      }
    }
  };

  const handleRateChange = (newRate: string) => {
    setRate(newRate);
    const q = parseFloat(quantity);
    const r = parseFloat(newRate);
    if (!isNaN(q) && !isNaN(r) && q > 0 && r > 0) {
      const tot = (q * r).toFixed(2);
      setAmount(tot);
      if (paymentStatus === 'paid') {
        setPaidAmount(tot);
      }
    }
  };

  const handleMaterialChange = (selectedMat: string) => {
    if (selectedMat === 'Custom / Other Material') {
      setIsCustomMaterial(true);
      setMaterialType(customMaterialName || 'Custom Material');
    } else {
      setIsCustomMaterial(false);
      setMaterialType(selectedMat);
      if (selectedMat.includes('Bags')) {
        setUnit('Bags');
      } else if (selectedMat.includes('MT') || selectedMat.includes('Ton')) {
        setUnit('Ton');
      }
    }
  };

  // Open Create Modal
  const openCreateModal = (defaultMode: 'material' | 'supplier_payment' | 'general' = 'material', defaultPartyId: string = '') => {
    setEditingExpense(null);
    setDate(new Date().toISOString().split('T')[0]);
    setEntryMode(defaultMode);
    
    if (defaultMode === 'supplier_payment') {
      setCategory('Supplier Due Payment');
      setPaymentStatus('paid');
      setMode('upi');
    } else if (defaultMode === 'material') {
      setCategory('Raw Material / Material Purchase');
      setPaymentStatus('unpaid');
      setMode('cash');
    } else {
      setCategory('Diesel / Fuel');
      setPaymentStatus('paid');
      setMode('cash');
    }

    setTitle('');
    setAmount('');
    setPaidAmount('');
    setPaidTo('');
    setPartyId(defaultPartyId || '');
    setMaterialType('Fly Ash (Mettur)');
    setIsCustomMaterial(false);
    setCustomMaterialName('');
    setQuantity('');
    setUnit('Ton');
    setRate('');
    setVehicleNo('');
    setAddToStock(true);
    setRef('');
    setNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setPaidAmount(exp.paid_amount !== undefined ? String(exp.paid_amount) : '');
    
    if (exp.expense_type === 'supplier_payment' || exp.category.includes('Supplier Due Payment')) {
      setEntryMode('supplier_payment');
    } else if (exp.category.includes('Material') || exp.material_type) {
      setEntryMode('material');
    } else {
      setEntryMode('general');
    }

    const isUnpaid = exp.payment_status === 'unpaid' || exp.is_paid === false || exp.payment_mode === 'credit';
    const isPartial = exp.payment_status === 'partial';
    setPaymentStatus(isPartial ? 'partial' : isUnpaid ? 'unpaid' : 'paid');
    setMode(exp.payment_mode === 'credit' ? 'cash' : exp.payment_mode);
    
    setPaidTo(exp.paid_to || '');
    setPartyId(exp.party_id || '');
    
    if (exp.material_type) {
      if (standardMaterials.includes(exp.material_type)) {
        setMaterialType(exp.material_type);
        setIsCustomMaterial(false);
      } else {
        setIsCustomMaterial(true);
        setCustomMaterialName(exp.material_type);
        setMaterialType(exp.material_type);
      }
    } else {
      setMaterialType('Fly Ash (Mettur)');
      setIsCustomMaterial(false);
    }
    
    setQuantity(exp.quantity ? String(exp.quantity) : '');
    setUnit(exp.unit || 'Ton');
    setRate(exp.rate ? String(exp.rate) : '');
    setRef(exp.reference_no || '');
    setNotes(exp.notes || '');
    setAddToStock(false);
    setModalOpen(true);
  };

  // Open Settle Modal
  const openSettleModal = (exp: Expense) => {
    setSettlingExpense(exp);
    setSettleMode('cash');
    setSettleRef('');
    setSettleModalOpen(true);
  };

  // Handle Settle Confirm
  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingExpense) return;

    await updateExpense(settlingExpense.id, {
      payment_status: 'paid',
      is_paid: true,
      paid_amount: settlingExpense.amount,
      due_amount: 0,
      payment_mode: settleMode,
      reference_no: settleRef.trim() || settlingExpense.reference_no,
      notes: settlingExpense.notes 
        ? `${settlingExpense.notes} [Settled via ${settleMode.toUpperCase()} on ${new Date().toISOString().split('T')[0]}]`
        : `Settled via ${settleMode.toUpperCase()} on ${new Date().toISOString().split('T')[0]}`,
    });

    setSettleModalOpen(false);
    setSettlingExpense(null);
  };

  // Selected party in modal for live outstanding calculation
  const activeParty = useMemo(() => {
    return parties.find((p) => p.id === partyId);
  }, [parties, partyId]);

  const activePartyBalance = useMemo(() => {
    if (!activeParty) return 0;
    return calculatePartyBalance(activeParty.id);
  }, [activeParty, calculatePartyBalance]);

  // Projected party balance after this transaction
  const projectedBalance = useMemo(() => {
    if (!activeParty) return 0;
    const currentBal = activePartyBalance;
    const totalAmt = parseFloat(amount) || 0;
    const pAmt = parseFloat(paidAmount) || 0;

    if (entryMode === 'supplier_payment') {
      // Paying off outstanding debt reduces the negative debit balance (+totalAmt)
      return currentBal + totalAmt;
    }

    if (entryMode === 'material') {
      if (paymentStatus === 'unpaid') {
        // Full debt added (-totalAmt)
        return currentBal - totalAmt;
      } else if (paymentStatus === 'partial') {
        // Partial debt added: remaining due = totalAmt - pAmt
        const remainingDue = Math.max(0, totalAmt - pAmt);
        return currentBal - remainingDue;
      }
      // Paid in full on the spot: no change to existing debt
      return currentBal;
    }

    if (paymentStatus === 'unpaid') {
      return currentBal - totalAmt;
    }

    return currentBal;
  }, [activeParty, activePartyBalance, amount, paidAmount, paymentStatus, entryMode]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeMaterial = isCustomMaterial ? customMaterialName.trim() : materialType;
    const totalAmt = parseFloat(amount) || 0;
    const pAmt = parseFloat(paidAmount) || 0;
    const selectedParty = parties.find((p) => p.id === partyId);

    let expType: ExpenseType = 'general_expense';
    let computedCategory = category;
    let computedTitle = title.trim();
    let calculatedDue = 0;
    let actualPaid = 0;

    if (entryMode === 'supplier_payment') {
      expType = 'supplier_payment';
      computedCategory = 'Supplier Due Payment';
      if (!computedTitle) {
        computedTitle = `Payment towards Outstanding to ${selectedParty?.name || paidTo || 'Supplier'}`;
      }
      actualPaid = totalAmt;
    } else if (entryMode === 'material') {
      expType = 'material_purchase';
      computedCategory = 'Raw Material / Material Purchase';
      if (!computedTitle) {
        computedTitle = `${activeMaterial || 'Raw Material'} Purchase ${quantity ? `(${quantity} ${unit})` : ''}`.trim();
      }
      if (paymentStatus === 'unpaid') {
        calculatedDue = totalAmt;
        actualPaid = 0;
      } else if (paymentStatus === 'partial') {
        actualPaid = pAmt;
        calculatedDue = Math.max(0, totalAmt - pAmt);
      } else {
        actualPaid = totalAmt;
        calculatedDue = 0;
      }
    } else {
      expType = 'general_expense';
      if (!computedTitle) {
        computedTitle = `${category} Expense`;
      }
      actualPaid = paymentStatus === 'paid' ? totalAmt : 0;
      calculatedDue = paymentStatus === 'unpaid' ? totalAmt : 0;
    }

    const payload: Omit<Expense, 'id' | 'created_at'> = {
      date,
      category: computedCategory,
      expense_type: expType,
      title: computedTitle,
      amount: totalAmt,
      paid_amount: actualPaid,
      due_amount: calculatedDue,
      payment_status: paymentStatus,
      is_paid: paymentStatus === 'paid' || entryMode === 'supplier_payment',
      payment_mode: (paymentStatus === 'unpaid' && entryMode !== 'supplier_payment') ? 'credit' : mode,
      paid_to: selectedParty?.name || paidTo.trim(),
      party_id: partyId || undefined,
      party_name: selectedParty?.name || undefined,
      material_type: entryMode === 'material' ? activeMaterial : undefined,
      quantity: (entryMode === 'material' && quantity) ? parseFloat(quantity) : undefined,
      unit: (entryMode === 'material' && quantity) ? unit : undefined,
      rate: (entryMode === 'material' && rate) ? parseFloat(rate) : undefined,
      reference_no: ref.trim(),
      notes: notes.trim(),
    };

    if (!editingExpense) {
      const dup = checkDuplicate('expense', payload);
      if (dup.isDuplicate) {
        setDuplicateModal({
          isOpen: true,
          data: payload,
          details: dup.details,
        });
        return;
      }
      await addExpense(payload);

      // Optionally record in material inward stock
      if (entryMode === 'material' && addToStock && partyId && quantity && parseFloat(quantity) > 0) {
        await addInward({
          date,
          party_id: partyId,
          party_name: selectedParty?.name,
          material_type: activeMaterial,
          quantity_mt: parseFloat(quantity),
          quantity_unit: unit,
          rate: parseFloat(rate) || (totalAmt / parseFloat(quantity)),
          amount: totalAmt,
          vehicle_no: vehicleNo.trim() || undefined,
          notes: `Logged via Material Expense [${computedTitle}]`,
        });
      }
    } else {
      await updateExpense(editingExpense.id, payload);
    }
    setModalOpen(false);
  };

  const handleConfirmDuplicate = async () => {
    await addExpense(duplicateModal.data);
    setModalOpen(false);
    setDuplicateModal({ isOpen: false, data: null });
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Access Denied: Only Administrator or Owner can delete expenses.');
      return;
    }
    if (window.confirm('Delete this expense entry?')) {
      await deleteExpense(id);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const isUnpaid = exp.payment_status === 'unpaid' || exp.is_paid === false || exp.payment_mode === 'credit';
      const isSupplierPayment = exp.expense_type === 'supplier_payment' || exp.category.includes('Supplier Due Payment');
      
      // Filter options
      if (selectedFilter === 'unpaid') {
        if (!isUnpaid && exp.payment_status !== 'partial') return false;
      } else if (selectedFilter === 'paid') {
        if (isUnpaid) return false;
      } else if (selectedFilter === 'supplier_payment') {
        if (!isSupplierPayment) return false;
      } else if (selectedFilter === 'raw_material') {
        if (!exp.category.toLowerCase().includes('material') && !exp.material_type) return false;
      } else if (selectedFilter === 'diesel') {
        if (!exp.category.toLowerCase().includes('diesel') && !exp.category.toLowerCase().includes('fuel')) return false;
      } else if (selectedFilter === 'power') {
        if (!exp.category.toLowerCase().includes('power') && !exp.category.toLowerCase().includes('electricity')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(term);
        const matchesPaidTo = exp.paid_to?.toLowerCase().includes(term);
        const matchesParty = exp.party_name?.toLowerCase().includes(term);
        const matchesCat = exp.category?.toLowerCase().includes(term);
        const matchesMat = exp.material_type?.toLowerCase().includes(term);
        const matchesRef = exp.reference_no?.toLowerCase().includes(term);
        return matchesTitle || matchesPaidTo || matchesParty || matchesCat || matchesMat || matchesRef;
      }

      return true;
    });
  }, [expenses, selectedFilter, searchTerm]);

  // Calculations for KPI Cards
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalUnpaidExpenses = expenses
    .filter((e) => (e.payment_status === 'unpaid' || e.payment_status === 'partial' || e.is_paid === false || e.payment_mode === 'credit') && e.expense_type !== 'supplier_payment')
    .reduce((sum, e) => sum + (e.due_amount !== undefined ? e.due_amount : e.amount), 0);

  const totalSupplierPaid = expenses
    .filter((e) => e.expense_type === 'supplier_payment' || e.category.includes('Supplier Due Payment'))
    .reduce((sum, e) => sum + e.amount, 0);

  const rawMaterialTotal = expenses
    .filter((e) => e.category.toLowerCase().includes('material') || e.material_type)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-8 h-8 text-rose-600" /> Plant Operational & Material Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log raw material purchases, pay supplier outstanding dues, and view real-time party balances
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => openCreateModal('supplier_payment')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" /> Pay Supplier Due
          </button>
          <button
            onClick={() => openCreateModal('material')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20 flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" /> Buy Raw Material
          </button>
          <button
            onClick={() => openCreateModal('general')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-rose-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Other Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Total Logged</span>
            <Receipt className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{expenses.length} entries recorded</div>
        </div>

        {/* Total Not Paid (Due / Outstanding) */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-bold">
            <span>🔴 Not Paid (Dues)</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5">
            ₹{totalUnpaidExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5 font-medium">
            Who I Need to Pay (Debit)
          </div>
        </div>

        {/* Total Supplier Dues Paid */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <span>🟢 Supplier Dues Paid</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            ₹{totalSupplierPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-medium">
            Cleared from Outstanding
          </div>
        </div>

        {/* Raw Materials */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <span>Raw Materials</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">
            ₹{rawMaterialTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ash, Cement, Dust</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedFilter === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({expenses.length})
          </button>
          
          <button
            onClick={() => setSelectedFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedFilter === 'unpaid'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-600" /> 🔴 Not Paid / Due
          </button>

          <button
            onClick={() => setSelectedFilter('supplier_payment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedFilter === 'supplier_payment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" /> 💸 Supplier Due Payments
          </button>

          <button
            onClick={() => setSelectedFilter('raw_material')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedFilter === 'raw_material'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Raw Materials
          </button>

          <button
            onClick={() => setSelectedFilter('diesel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedFilter === 'diesel'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" /> Diesel
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search material, supplier, bill..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" /> Expense Ledger & Supplier Purchases
          </h3>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            Showing {filteredExpenses.length} of {expenses.length} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Type / Category</th>
                <th className="px-4 py-3.5">Description & Material</th>
                <th className="px-4 py-3.5">Supplier / Party</th>
                <th className="px-4 py-3.5">Party Outstanding</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5 text-right">Amount (₹)</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredExpenses.map((exp) => {
                const linkedParty = exp.party_id ? parties.find((p) => p.id === exp.party_id) : null;
                const balance = linkedParty ? calculatePartyBalance(linkedParty.id) : null;
                const isUnpaid = exp.payment_status === 'unpaid' || exp.is_paid === false || exp.payment_mode === 'credit';
                const isPartial = exp.payment_status === 'partial';
                const isSupplierPayment = exp.expense_type === 'supplier_payment' || exp.category.includes('Supplier Due Payment');

                return (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 text-slate-500 font-mono whitespace-nowrap">{exp.date}</td>
                    
                    {/* Category / Type */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isSupplierPayment ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                          <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Supplier Due Paid
                        </span>
                      ) : exp.category.toLowerCase().includes('material') || exp.material_type ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                          <Package className="w-3.5 h-3.5 text-amber-600" /> Raw Material
                        </span>
                      ) : exp.category.toLowerCase().includes('diesel') || exp.category.toLowerCase().includes('fuel') ? (
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                          <Fuel className="w-3.5 h-3.5 text-orange-600" /> Fuel
                        </span>
                      ) : exp.category.toLowerCase().includes('power') || exp.category.toLowerCase().includes('electricity') ? (
                        <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/40 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                          <Zap className="w-3.5 h-3.5 text-yellow-600" /> Power
                        </span>
                      ) : exp.category.toLowerCase().includes('repair') || exp.category.toLowerCase().includes('spares') ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" /> Spares
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold w-max">
                          {exp.category}
                        </span>
                      )}
                    </td>

                    {/* Description & Material details */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {exp.title}
                      </div>
                      {exp.material_type && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
                            📦 {exp.material_type}
                          </span>
                          {exp.quantity ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                              {exp.quantity} {exp.unit || 'Ton'} {exp.rate ? `@ ₹${exp.rate}/${exp.unit || 'Ton'}` : ''}
                            </span>
                          ) : null}
                        </div>
                      )}
                      {exp.notes && <div className="text-[11px] text-slate-400 font-normal mt-0.5">{exp.notes}</div>}
                    </td>

                    {/* Supplier / Party */}
                    <td className="px-4 py-3.5">
                      {linkedParty ? (
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" /> {linkedParty.name}
                          </span>
                          {linkedParty.phone && (
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" /> {linkedParty.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">{exp.paid_to || '-'}</span>
                      )}
                    </td>

                    {/* Party Live Outstanding Balance */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {balance !== null ? (
                        balance < 0 ? (
                          <div className="inline-flex flex-col">
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-mono font-bold text-[11px]">
                              ₹{Math.abs(balance).toLocaleString('en-IN')} Dr
                            </span>
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                              (I need to pay)
                            </span>
                          </div>
                        ) : balance > 0 ? (
                          <div className="inline-flex flex-col">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-mono font-bold text-[11px]">
                              ₹{balance.toLocaleString('en-IN')} Cr
                            </span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              (Party owes me)
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono text-[11px]">
                            ₹0.00 Settled
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Payment Status (Paid vs Not Paid / Due vs Partial) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isSupplierPayment ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-semibold text-[10px] flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID ({exp.payment_mode?.toUpperCase()})
                        </span>
                      ) : isPartial ? (
                        <div className="inline-flex flex-col">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[10px]">
                            PARTIAL (Paid ₹{exp.paid_amount || 0}, Due ₹{exp.due_amount || 0})
                          </span>
                        </div>
                      ) : isUnpaid ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-600" /> NOT PAID (DUE)
                          </span>
                          <button
                            onClick={() => openSettleModal(exp)}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-semibold transition flex items-center gap-0.5"
                            title="Mark this expense as paid"
                          >
                            <Check className="w-2.5 h-2.5" /> Settle
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-semibold text-[10px] flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID ({exp.payment_mode?.toUpperCase()})
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Edit expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete ? (
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Delete expense"
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
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p>No expense records found matching your filters.</p>
                      <button
                        onClick={() => openCreateModal('material')}
                        className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        + Record a new material purchase or supplier payment
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  {editingExpense 
                    ? 'Edit Expense Entry' 
                    : entryMode === 'supplier_payment'
                    ? 'Pay Supplier Outstanding Due'
                    : entryMode === 'material'
                    ? 'Material Inward Purchase & Supplier Linking'
                    : 'Record Plant Expense'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {entryMode === 'supplier_payment' 
                    ? 'Pay amount from outstanding balance (e.g. Due ₹60k, Pay ₹30k -> Remaining ₹30k)'
                    : 'Log material purchase and choose whether it is paid, due, or partially paid'}
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setEntryMode('material');
                  setCategory('Raw Material / Material Purchase');
                  setPaymentStatus('unpaid');
                }}
                className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  entryMode === 'material'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600" /> Material Purchase
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode('supplier_payment');
                  setCategory('Supplier Due Payment');
                  setPaymentStatus('paid');
                }}
                className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  entryMode === 'supplier_payment'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Pay Due Amount
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode('general');
                  setCategory('Diesel / Fuel');
                  setPaymentStatus('paid');
                }}
                className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  entryMode === 'general'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Fuel className="w-3.5 h-3.5 text-orange-600" /> Other Expense
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Date & Category (if general) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  {entryMode === 'general' ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-semibold"
                    >
                      <option value="Diesel / Fuel">⛽ Diesel / Fuel</option>
                      <option value="Electricity / Power">⚡ Electricity / Power</option>
                      <option value="Machine Repair & Spares">🔧 Machine Repair & Spares</option>
                      <option value="Plant Maintenance">🏗️ Plant Maintenance</option>
                      <option value="Transport / Freight">🚚 Transport / Freight</option>
                      <option value="General">📋 General / Miscellaneous</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={entryMode === 'supplier_payment' ? '💸 Supplier Due Payment' : '🧱 Raw Material Purchase'}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* SUPPLIER / PARTY SELECTION & LIVE OUTSTANDING CARD */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Select Supplier / Party *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Live balance connection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <select
                      value={partyId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setPartyId(pid);
                        const p = parties.find((item) => item.id === pid);
                        if (p) setPaidTo(p.name);
                      }}
                      required={entryMode === 'supplier_payment'}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-medium"
                    >
                      <option value="">-- Select Supplier / Party --</option>
                      <optgroup label="Suppliers & Transporters">
                        {parties
                          .filter((p) => p.party_type === 'supplier' || p.party_type === 'both' || p.party_type === 'transporter')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.party_type.toUpperCase()})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Customers & Other Parties">
                        {parties
                          .filter((p) => p.party_type === 'customer')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Customer)
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={paidTo}
                      onChange={(e) => setPaidTo(e.target.value)}
                      placeholder="Or enter custom Vendor name"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* LIVE OUTSTANDING & IMPACT CARD */}
                {activeParty && (
                  <div className="mt-2 p-3 rounded-xl border transition bg-white dark:bg-slate-900/90 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>{activeParty.name}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {activeParty.party_type}
                        </span>
                      </div>
                      {activeParty.phone && (
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {activeParty.phone}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                          Current Outstanding Balance
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {activePartyBalance < 0
                            ? '🔴 Debit: Money you need to pay to this supplier'
                            : activePartyBalance > 0
                            ? '🟢 Credit: Money this party needs to pay you'
                            : '⚪ Settled: No pending dues'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-base font-extrabold font-mono ${
                            activePartyBalance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : activePartyBalance > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          ₹{Math.abs(activePartyBalance).toLocaleString('en-IN')}{' '}
                          <span className="text-xs">{activePartyBalance < 0 ? 'Dr (I Need to Pay)' : activePartyBalance > 0 ? 'Cr (Receivable)' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Projected Balance impact */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                        entryMode === 'supplier_payment' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300'
                      }`}>
                        <span className="font-semibold flex items-center gap-1">
                          {entryMode === 'supplier_payment' ? (
                            <>💸 Paying ₹{parseFloat(amount).toLocaleString('en-IN')} towards due:</>
                          ) : paymentStatus === 'unpaid' ? (
                            <>➕ Adding ₹{parseFloat(amount).toLocaleString('en-IN')} to supplier due:</>
                          ) : paymentStatus === 'partial' ? (
                            <>🟡 Partial payment (Paid ₹{parseFloat(paidAmount) || 0}, Due ₹{Math.max(0, (parseFloat(amount)||0) - (parseFloat(paidAmount)||0))}):</>
                          ) : (
                            <>✅ Paid in full on the spot:</>
                          )}
                        </span>
                        <span className="font-mono font-extrabold text-sm">
                          {projectedBalance < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">Remaining to Pay: ₹{Math.abs(projectedBalance).toLocaleString('en-IN')} Dr</span>
                          ) : projectedBalance > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Party Owes: ₹{projectedBalance.toLocaleString('en-IN')} Cr</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">₹0.00 Fully Settled!</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MATERIAL DETAILS SECTION (When in Material Purchase Mode) */}
              {entryMode === 'material' && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                      <Package className="w-4 h-4 text-amber-600" /> Material Inward Specifications
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Auto-computes bill amount
                    </span>
                  </div>

                  {/* Material Type Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Select Material *
                      </label>
                      <select
                        value={isCustomMaterial ? 'Custom / Other Material' : materialType}
                        onChange={(e) => handleMaterialChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        {standardMaterials.map((mat) => (
                          <option key={mat} value={mat}>
                            {mat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isCustomMaterial ? (
                      <div>
                        <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                          Custom Material Name *
                        </label>
                        <input
                          type="text"
                          value={customMaterialName}
                          onChange={(e) => {
                            setCustomMaterialName(e.target.value);
                            setMaterialType(e.target.value);
                          }}
                          placeholder="e.g. Red Soil, Hardener 50L"
                          required
                          className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                          Measuring Unit
                        </label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        >
                          {units.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Rate */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Quantity ({unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={quantity}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Rate / {unit} (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={rate}
                        onChange={(e) => handleRateChange(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Vehicle No & Stock Inward Sync */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Vehicle No. (Optional)
                      </label>
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        placeholder="e.g. TN-30-AB-1234"
                        className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-6">
                      <input
                        type="checkbox"
                        id="addToStockCheck"
                        checked={addToStock}
                        onChange={(e) => setAddToStock(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <label htmlFor="addToStockCheck" className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                        Sync to Raw Material Stock
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT STATUS & AMOUNT (Mode Dependent) */}
              {entryMode === 'supplier_payment' ? (
                /* PAY SUPPLIER DUE SECTION */
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                      <Wallet className="w-4 h-4 text-emerald-600" /> Payment towards Outstanding
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Reduces what you need to pay
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                        Amount Paid (₹) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="e.g. 30000"
                        className="w-full bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                        Payment Mode *
                      </label>
                      <select
                        value={mode}
                        onChange={(e: any) => setMode(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="upi">📱 UPI / GPay / PhonePe</option>
                        <option value="bank">🏦 Bank Transfer (NEFT/IMPS)</option>
                        <option value="cash">💵 Cash</option>
                        <option value="cheque">📝 Cheque</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* MATERIAL / OTHER EXPENSE PAYMENT OPTIONS */
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Payment Status & Terms *
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('unpaid')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentStatus === 'unpaid'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      🔴 Not Paid (Full Due)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('partial');
                        if (!paidAmount && amount) {
                          setPaidAmount(String(parseFloat(amount) / 2));
                        }
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentStatus === 'partial'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      🟡 Partial Payment
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('paid');
                        setPaidAmount(amount);
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      🟢 Paid in Full
                    </button>
                  </div>

                  {/* Total Bill Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Total Bill Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500 text-sm"
                      />
                    </div>

                    {paymentStatus === 'partial' ? (
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Amount Paid Now (₹) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="e.g. 30000"
                          required
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    ) : paymentStatus === 'paid' ? (
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Paid Mode *
                        </label>
                        <select
                          value={mode}
                          onChange={(e: any) => setMode(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                        >
                          <option value="cash">💵 Cash</option>
                          <option value="upi">📱 UPI / GPay</option>
                          <option value="bank">🏦 Bank Transfer</option>
                          <option value="cheque">📝 Cheque</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center text-rose-600 dark:text-rose-400 text-[11px] font-medium pt-4">
                        ⚠️ Full ₹{parseFloat(amount) || 0} will be added to the party's outstanding amount you need to pay.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title / Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    entryMode === 'supplier_payment'
                      ? 'e.g. Part payment towards Fly Ash bill via GPay'
                      : entryMode === 'material'
                      ? 'e.g. 50 MT Fly Ash Mettur Delivery'
                      : 'e.g. 50L Diesel for Generator'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Reference Bill No & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill / Voucher / Ref No.
                  </label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="e.g. INV-2026-89 or UPI-9843"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Remarks..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
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
                  className={`px-5 py-2 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 ${
                    entryMode === 'supplier_payment'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : entryMode === 'material'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  {editingExpense ? 'Update Entry' : entryMode === 'supplier_payment' ? 'Save & Reduce Party Due' : 'Save Expense Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle / Mark as Paid Modal */}
      {settleModalOpen && settlingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settle & Mark as Paid
              </h3>
              <button onClick={() => setSettleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="text-slate-500 font-medium">Expense: <span className="text-slate-900 dark:text-white font-bold">{settlingExpense.title}</span></div>
              <div className="text-slate-500 font-medium">Supplier / Paid To: <span className="text-slate-900 dark:text-white font-bold">{settlingExpense.party_name || settlingExpense.paid_to || 'N/A'}</span></div>
              <div className="text-slate-500 font-medium">Amount: <span className="text-rose-600 dark:text-rose-400 font-mono font-extrabold text-sm">₹{settlingExpense.amount.toLocaleString('en-IN')}</span></div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={settleMode}
                  onChange={(e: any) => setSettleMode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / GPay / PhonePe</option>
                  <option value="bank">🏦 Bank Transfer</option>
                  <option value="cheque">📝 Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. UPI Ref / Cheque No"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModal.isOpen}
        title="Duplicate Expense Warning"
        message="An expense with matching category, amount, and date already exists."
        existingDetails={duplicateModal.details}
        onConfirm={handleConfirmDuplicate}
        onCancel={() => setDuplicateModal({ isOpen: false, data: null })}
      />
    </div>
  );
};
