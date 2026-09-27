// Global Theme Manager
function initTheme() {
  const savedTheme = localStorage.getItem('flyash_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('flyash_theme', next);
  updateThemeIcon(next);
  showToast(`Switched to ${next === 'dark' ? 'Dark Mode 🌙' : 'Yard Sunlight Mode ☀️'}`, 'info');
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-indigo-600';
  }
}

// Global Toast System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = 'fa-check-circle text-emerald-400';
  if (type === 'error') icon = 'fa-circle-xmark text-rose-400';
  if (type === 'info') icon = 'fa-circle-info text-blue-400';

  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg"></i>
    <div class="text-sm font-medium flex-1">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Live Table Search Filter
function setupTableSearch(inputId, tableBodySelector) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(`${tableBodySelector} tr`);
    rows.forEach((row) => {
      const text = row.textContent?.toLowerCase() || '';
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// 1-Click WhatsApp Delivery Slip Generator
function shareDispatchWhatsApp(partyName, materialType, qty, unit, vehicleNo, rate, amount, balanceDue) {
  const text = `*🏭 SRI BALAMURUGAN FLY ASH BRICKS*\n*Official Delivery Challan & Dispatch*\n--------------------------------\n📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n👤 *Customer:* ${partyName}\n🧱 *Product:* ${materialType}\n📦 *Quantity:* ${qty} ${unit}\n🚛 *Vehicle No:* ${vehicleNo || 'Self Loaded'}\n💰 *Rate:* ₹${rate} / ${unit}\n💵 *Total Bill:* ₹${amount.toLocaleString('en-IN')}\n💳 *Balance Outstanding:* ₹${balanceDue ? balanceDue.toLocaleString('en-IN') : '0'}\n--------------------------------\n_Thank you for your business!_`;
  
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  showToast('WhatsApp Delivery Slip prepared!', 'success');
}

// Live Reactive Calculation for Production Trays
function bindLiveProductionCalculator() {
  const trayInput = document.getElementById('trayCountInput');
  const pcsTrayInput = document.getElementById('pcsTrayInput');
  const wasteTrayInput = document.getElementById('wasteTrayInput');
  const rateInput = document.getElementById('rateInput');
  const livePreview = document.getElementById('liveCalculationPreview');

  if (!trayInput || !livePreview) return;

  function recalculate() {
    const trays = parseFloat(trayInput.value) || 0;
    const pcsPerTray = parseFloat(pcsTrayInput?.value) || 105;
    const wastePerTray = parseFloat(wasteTrayInput?.value) || 5;
    const rate = parseFloat(rateInput?.value) || 0;

    const grossQty = trays * pcsPerTray;
    const totalWastage = trays * wastePerTray;
    const netQty = grossQty - totalWastage;
    const grossAmt = grossQty * rate;
    const wasteAmt = totalWastage * rate;
    const netLaborAmt = netQty * rate;

    livePreview.innerHTML = `
      <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 text-xs">
        <div class="flex items-center justify-between font-medium">
          <span class="text-slate-400">Gross Production:</span>
          <span class="text-white font-mono font-bold">${grossQty.toLocaleString()} pcs</span>
        </div>
        <div class="flex items-center justify-between font-medium text-rose-400">
          <span>Breakage Cut (${wastePerTray} pcs/tray):</span>
          <span class="font-mono font-bold">-${totalWastage.toLocaleString()} pcs (₹${wasteAmt.toFixed(2)})</span>
        </div>
        <div class="flex items-center justify-between font-medium text-emerald-400 border-t border-slate-700/60 pt-1.5">
          <span>Payable Net Bricks:</span>
          <span class="font-mono font-bold">${netQty.toLocaleString()} pcs</span>
        </div>
        <div class="flex items-center justify-between font-medium text-amber-400 text-sm">
          <span>Net Total Labor Wage:</span>
          <span class="font-mono font-bold text-base">₹${netLaborAmt.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  [trayInput, pcsTrayInput, wasteTrayInput, rateInput].forEach((el) => {
    if (el) el.addEventListener('input', recalculate);
  });
  recalculate();
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindLiveProductionCalculator();
});
