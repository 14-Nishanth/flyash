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
  ArrowUpRight 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    inwards, 
    outwards, 
    jobs, 
    expenses, 
    parties, 
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
    const text = `*🏭 SRI BALAMURUGAN FLY ASH BRICKS*\n*Official Delivery Slip*\n------------------------\n📅 Date: ${item.date}\n👤 Customer: ${item.party_name || 'Walk-in'}\n🧱 Product: ${item.material_type}\n📦 Quantity: ${item.quantity_mt} ${item.quantity_unit}\n🚛 Vehicle: ${item.vehicle_no || 'Self Loaded'}\n💰 Rate: ₹${item.rate}\n💵 Total: ₹${item.amount.toLocaleString('en-IN')}\n------------------------\n_Thank you for your business!_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Plant Telemetry
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{todayStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Plant Executive Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time manufacturing metrics, active inventory & party balances
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('materials')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Inward / Dispatch
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-500" /> Record Production
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Production</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {todayProduction.toLocaleString()} <span className="text-xs font-normal text-slate-500">Pcs</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Labor Wage:</span>
              <span className="font-mono font-bold text-amber-500">₹{todayLaborCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dispatches */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Dispatches</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {todayOutwardQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Revenue:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{todayOutwardRev.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Raw Inward */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Raw Inward</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {todayInwardQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">Tons</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Purchases:</span>
              <span className="font-mono font-bold text-indigo-500">₹{todayInwardCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ₹{todayExpenses.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Fuel & Plant Ops</span>
              <span className="text-[10px] text-rose-500 uppercase font-semibold">Daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Material Inventory & Yard Stock (Only showing user mentioned/recorded materials) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Raw Material Stock */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" /> Active Raw Material Stock
            </h3>
            <button onClick={() => setActiveTab('materials')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Add Inward <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rawKeys.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rawKeys.map((mat) => (
                <div key={mat} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{mat}</span>
                    <div className="text-xs text-slate-400">Unit: {rawStocks[mat].unit}</div>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {rawStocks[mat].quantity.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{rawStocks[mat].unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <Package className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No raw materials recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Only items recorded via Material Inward will appear here.</p>
            </div>
          )}
        </div>

        {/* Finished Goods Yard Stock */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-500" /> Finished Goods Stock (Yard)
            </h3>
            <span className="text-xs text-slate-400">Available Pcs</span>
          </div>

          {prodKeys.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {prodKeys.map((prod) => (
                <div key={prod} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={prod}>{prod}</span>
                  <div className={`text-lg font-bold font-mono mt-1 ${prodStocks[prod].stock >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {prodStocks[prod].stock.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Pcs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 font-medium">No finished products produced or dispatched yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Receivables / Payables */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-500" /> Party Balances & Outstanding Ledgers
          </h3>
          <button onClick={() => setActiveTab('parties')} className="text-xs text-blue-500 hover:underline">
            View All Accounts →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Customer Receivables</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                ₹{totalReceivables.toLocaleString()}
              </div>
            </div>
            <Scale className="w-8 h-8 text-emerald-500/30" />
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Supplier Payables</div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                ₹{totalPayables.toLocaleString()}
              </div>
            </div>
            <Wallet className="w-8 h-8 text-rose-500/30" />
          </div>
        </div>
      </div>

      {/* Live Dispatches Feed */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" /> Live Dispatch Feed
          </h3>
          <button onClick={() => setActiveTab('materials')} className="text-xs text-blue-500 hover:underline">
            All dispatches →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 rounded-r-xl text-center">Challan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
              {outwards.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-400">{o.date}</td>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-900 dark:text-white">{o.party_name || 'Walk-in'}</td>
                  <td className="px-4 py-3 font-sans">{o.material_type}</td>
                  <td className="px-4 py-3 text-slate-400">{o.vehicle_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{o.quantity_mt} {o.quantity_unit}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{o.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => shareWhatsApp(o)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg transition font-sans text-xs flex items-center gap-1 mx-auto"
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
