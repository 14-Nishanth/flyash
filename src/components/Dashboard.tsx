import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Boxes, 
  Truck, 
  Package, 
  Wallet, 
  Scale, 
  Warehouse, 
  Plus, 
  Share2, 
  ArrowUpRight,
  TrendingUp,
  Users,
  Hammer,
  ClipboardCheck,
  Banknote,
  Receipt,
  Sliders,
  Shield,
  Key,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    inwards, 
    outwards, 
    jobs, 
    expenses, 
    parties, 
    employees,
    workerGroups,
    productRates,
    calculatePartyBalance, 
    getRawMaterialStock, 
    getProductStock, 
    setActiveTab 
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's Calculations
  const todayProduction = jobs
    .filter((j) => j.date === todayStr)
    .reduce((sum, j) => sum + j.quantity, 0);

  const todayLaborCost = jobs
    .filter((j) => j.date === todayStr)
    .reduce((sum, j) => sum + j.total_amount, 0);

  const todayOutwardQty = outwards
    .filter((o) => o.date === todayStr)
    .reduce((sum, o) => sum + o.quantity_mt, 0);

  const todayOutwardRev = outwards
    .filter((o) => o.date === todayStr)
    .reduce((sum, o) => sum + o.amount, 0);

  const todayInwardQty = inwards
    .filter((i) => i.date === todayStr)
    .reduce((sum, i) => sum + i.quantity_mt, 0);

  const todayInwardCost = inwards
    .filter((i) => i.date === todayStr)
    .reduce((sum, i) => sum + i.amount, 0);

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Financial Balances
  let totalReceivables = 0;
  let totalPayables = 0;
  parties.forEach((p) => {
    const bal = calculatePartyBalance(p.id);
    if (bal > 0) totalReceivables += bal;
    else if (bal < 0) totalPayables += Math.abs(bal);
  });

  const rawStocks = getRawMaterialStock();
  const rawKeys = Object.keys(rawStocks);

  const prodStocks = getProductStock();
  const prodKeys = Object.keys(prodStocks);

  // Share WhatsApp Slip
  const shareWhatsApp = (item: any) => {
    const text = `*FLY ASH BRICK & BLOCK PLANT*\n*Delivery Slip*\n------------------------\nDate: ${item.date}\nCustomer: ${item.party_name || 'Walk-in'}\nProduct: ${item.material_type}\nQuantity: ${item.quantity_mt} ${item.quantity_unit}\nVehicle: ${item.vehicle_no || 'Self Loaded'}\nRate: ₹${item.rate}\nTotal: ₹${item.amount.toLocaleString('en-IN')}\n------------------------\nThank you for your business!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Directory of all system pages and modules
  const allPageShortcuts = [
    {
      id: 'analytics',
      title: 'Turnover & Analytics',
      subtitle: 'Week-wise breakdown (W1–W5), monthly profit, margin % & WhatsApp payment slips',
      badge: `₹${outwards.reduce((sum, o) => sum + o.amount, 0).toLocaleString()} Total Sales`,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'materials',
      title: 'Materials & Stock',
      subtitle: 'Raw material inward delivery challans, stock on hand & customer dispatches',
      badge: `${inwards.length} Inward • ${outwards.length} Outward`,
      icon: Truck,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'parties',
      title: 'Parties & Ledger',
      subtitle: 'Customer & supplier accounts, ledger history, payment entries & balance tracking',
      badge: `${parties.length} Registered Parties`,
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      bgLight: 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'production',
      title: 'Shift Production',
      subtitle: 'Machine press logs, trays pressed, wastage deduction & yard inventory',
      badge: `${jobs.length} Shift Logs Recorded`,
      icon: Hammer,
      color: 'from-amber-600 to-yellow-600',
      bgLight: 'bg-yellow-50/70 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'employees',
      title: 'Workers & Gangs',
      subtitle: 'Gang wage division (Equal / Multiplier), worker directory, daily attendance & material rates master',
      badge: `${employees.length} Workers • ${workerGroups.length} Gangs`,
      icon: ClipboardCheck,
      color: 'from-teal-500 to-emerald-600',
      bgLight: 'bg-teal-50/70 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'wages',
      title: 'Wages Sheet',
      subtitle: 'Shift piece-rate earnings, gang wage shares, worker payouts & payment clearances',
      badge: `₹${jobs.reduce((sum, j) => sum + j.total_amount, 0).toLocaleString()} Wages Disbursed`,
      icon: Banknote,
      color: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'expenses',
      title: 'Plant Expenses',
      subtitle: 'Diesel / Fuel, Electricity, machine maintenance, oil/grease & operating costs',
      badge: `${expenses.length} Expenses Recorded`,
      icon: Receipt,
      color: 'from-rose-500 to-red-600',
      bgLight: 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'settings',
      title: 'Settings & Security',
      subtitle: 'Change Password, User Accounts & Roles, Telegram/WhatsApp/Email Alerts & Backup',
      badge: 'Security & Cloud Config',
      icon: Sliders,
      color: 'from-slate-600 to-slate-800',
      bgLight: 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      iconColor: 'text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced Live
            </span>
            <span className="text-xs text-slate-500 font-mono">{todayStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Plant Executive Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time manufacturing metrics, active stock, dispatch feed & quick navigation to all pages
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('materials')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Inward / Dispatch
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4 text-amber-500" /> Record Production
          </button>
        </div>
      </div>

      {/* QUICK LINKS TO ALL PAGES (System Navigation Command Center) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                All Application Pages & Direct Shortcuts
              </h3>
              <p className="text-[11px] text-slate-500">Click any card to directly open that section or module</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs font-mono font-bold text-slate-400">
            8 Modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {allPageShortcuts.map((page) => {
            const Icon = page.icon;
            return (
              <button
                key={page.id}
                onClick={() => setActiveTab(page.id)}
                className={`group text-left p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md ${page.bgLight} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm ${page.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 shadow-xs border border-current opacity-90">
                      {page.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                    {page.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-amber-600 dark:text-amber-400" />
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {page.subtitle}
                  </p>
                </div>
                
                <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>Open {page.title.split(' ')[0]}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards (Interactive Direct Links) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production */}
        <button
          onClick={() => setActiveTab('production')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-700 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Today's Production
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {todayProduction.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Labor Wage:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{todayLaborCost.toLocaleString()}</span>
            </div>
          </div>
        </button>

        {/* Dispatches */}
        <button
          onClick={() => setActiveTab('materials')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left hover:scale-[1.02] hover:border-emerald-400 dark:hover:border-emerald-700 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Today's Dispatches
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {todayOutwardQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Revenue:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{todayOutwardRev.toLocaleString()}</span>
            </div>
          </div>
        </button>

        {/* Raw Inward */}
        <button
          onClick={() => setActiveTab('materials')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left hover:scale-[1.02] hover:border-indigo-400 dark:hover:border-indigo-700 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Today's Raw Inward
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {todayInwardQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">Tons</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Purchases:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">₹{todayInwardCost.toLocaleString()}</span>
            </div>
          </div>
        </button>

        {/* Expenses */}
        <button
          onClick={() => setActiveTab('expenses')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left hover:scale-[1.02] hover:border-rose-400 dark:hover:border-rose-700 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Today's Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ₹{todayExpenses.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Plant Operations</span>
              <span className="text-[10px] text-rose-500 uppercase font-semibold">Daily</span>
            </div>
          </div>
        </button>
      </div>

      {/* Raw Material Inventory & Yard Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Raw Material Stock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" /> Active Raw Material Stock
            </h3>
            <button
              onClick={() => setActiveTab('materials')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Add Inward <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rawKeys.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rawKeys.map((mat) => (
                <div
                  key={mat}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{mat}</span>
                    <div className="text-[11px] text-slate-400">
                      Unit: {rawStocks[mat].unit}
                      {rawStocks[mat].secondaryInfo && (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          {rawStocks[mat].secondaryInfo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {rawStocks[mat].quantity.toLocaleString()}{' '}
                      <span className="text-xs text-slate-400 font-normal">{rawStocks[mat].unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <Package className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No raw materials recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Only items recorded via Material Inward will appear here.</p>
            </div>
          )}
        </div>

        {/* Finished Goods Yard Stock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-600" /> Finished Goods Stock (Yard)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('production')}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                title="View shift press entries & add production"
              >
                Production <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => setActiveTab('materials')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                title="View & record dispatches"
              >
                Dispatch <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {prodKeys.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {prodKeys.map((prod) => (
                <button
                  key={prod}
                  onClick={() => setActiveTab('production')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between text-left transition hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400" title={prod}>
                      {prod}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div
                    className={`text-lg font-bold font-mono mt-1 ${
                      prodStocks[prod].stock >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {prodStocks[prod].stock.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">Pcs</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
              <Warehouse className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                No finished products produced or dispatched yet.
              </p>
              <button
                onClick={() => setActiveTab('production')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Record Shift Production
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Receivables / Payables */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" /> Party Balances & Outstanding Ledgers
          </h3>
          <button
            onClick={() => setActiveTab('parties')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            View All Accounts →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Customer Receivables</div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                ₹{totalReceivables.toLocaleString()}
              </div>
            </div>
            <Scale className="w-8 h-8 text-emerald-500/30" />
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold">Supplier Payables</div>
              <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 font-mono mt-1">
                ₹{totalPayables.toLocaleString()}
              </div>
            </div>
            <Wallet className="w-8 h-8 text-rose-500/30" />
          </div>
        </div>
      </div>

      {/* Live Dispatches Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" /> Live Dispatch Feed
          </h3>
          <button
            onClick={() => setActiveTab('materials')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            All dispatches →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Challan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {outwards.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-500">{o.date}</td>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-900 dark:text-white">
                    {o.party_name || 'Walk-in'}
                  </td>
                  <td className="px-4 py-3 font-sans">{o.material_type}</td>
                  <td className="px-4 py-3 text-slate-500">{o.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                    {o.quantity_mt} {o.quantity_unit}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{o.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => shareWhatsApp(o)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-lg transition font-sans text-xs flex items-center gap-1 mx-auto font-medium"
                    >
                      <Share2 className="w-3 h-3" /> Slip
                    </button>
                  </td>
                </tr>
              ))}
              {outwards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400 font-sans">
                    No dispatches recorded today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
