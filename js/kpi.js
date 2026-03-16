/**
 * kpi.js — KPI Tracking Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

let editingId = null;

function formatKRW(n) {
  return '₩' + Number(n || 0).toLocaleString('ko-KR');
}

function pct(val, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((val / target) * 100));
}

function fillClass(p) {
  return p >= 100 ? 'success' : p >= 70 ? '' : p >= 40 ? 'warning' : 'danger';
}

function badgeForPct(p) {
  if (p >= 100) return { cls: 'badge-success', label: '🎯 Goal Met' };
  if (p >= 80)  return { cls: 'badge-info',    label: '✓ On Track' };
  if (p >= 50)  return { cls: 'badge-warning', label: '⚠ Needs Attention' };
  return              { cls: 'badge-danger',   label: '✕ Below Target' };
}

function monthLabel(m) {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mo,10)-1]} ${y}`;
}

function renderKpiList() {
  const records = Storage.kpi.getAll().sort((a, b) => (a.month > b.month ? -1 : 1));
  const list = document.getElementById('kpiList');

  if (records.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <h3>No KPI data yet</h3><p>Log your first monthly KPI to get started.</p>
    </div>`;
    return;
  }

  list.innerHTML = records.map(k => {
    const revPct  = pct(k.revenue, k.target_revenue);
    const conPct  = pct(k.contracts, k.target_contracts);
    const overallPct = Math.round((revPct + conPct) / 2);
    const badge   = badgeForPct(overallPct);

    return `
    <div class="kpi-month-card">
      <div class="kpi-month-header">
        <div class="kpi-month-title">${monthLabel(k.month)}</div>
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <span class="badge ${badge.cls}">${badge.label}</span>
          ${Auth.hasRole(['admin','manager']) ? `
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEdit('${k.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteKpi('${k.id}')" title="Delete" style="color:var(--danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>` : ''}
        </div>
      </div>
      <div class="kpi-month-body">
        <div class="kpi-metrics">
          <div class="kpi-metric">
            <span class="kpi-metric-label">Visits</span>
            <span class="kpi-metric-value">${k.visits || 0}</span>
            <span class="kpi-metric-target">Showroom visits</span>
          </div>
          <div class="kpi-metric">
            <span class="kpi-metric-label">Contracts</span>
            <span class="kpi-metric-value">${k.contracts || 0}</span>
            <span class="kpi-metric-target">Target: ${k.target_contracts || '—'}</span>
          </div>
          <div class="kpi-metric">
            <span class="kpi-metric-label">Revenue</span>
            <span class="kpi-metric-value" style="font-size:var(--text-lg);">${formatKRW(k.revenue)}</span>
            <span class="kpi-metric-target">Target: ${formatKRW(k.target_revenue)}</span>
          </div>
          <div class="kpi-metric">
            <span class="kpi-metric-label">Achievement</span>
            <span class="kpi-metric-value" style="color:${overallPct >= 100 ? 'var(--success)' : overallPct >= 70 ? 'var(--text)' : 'var(--danger)'};">${overallPct}%</span>
            <span class="kpi-metric-target">Overall score</span>
          </div>
        </div>
        <div class="kpi-bars">
          <div class="kpi-bar-row">
            <span class="kpi-bar-label">Revenue</span>
            <div class="progress-bar"><div class="progress-fill ${fillClass(revPct)}" style="width:${revPct}%"></div></div>
            <span class="kpi-bar-pct">${revPct}%</span>
          </div>
          <div class="kpi-bar-row">
            <span class="kpi-bar-label">Contracts</span>
            <div class="progress-bar"><div class="progress-fill ${fillClass(conPct)}" style="width:${conPct}%"></div></div>
            <span class="kpi-bar-pct">${conPct}%</span>
          </div>
        </div>
        ${k.notes ? `<div style="margin-top:var(--sp-4);padding:var(--sp-3);background:var(--surface-2);border-radius:var(--radius-md);font-size:var(--text-sm);color:var(--text-muted);">📝 ${k.notes}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit KPI' : 'Log Monthly KPI';
  if (id) {
    const k = Storage.kpi.getById(id);
    document.getElementById('kpiId').value            = k.id;
    document.getElementById('kMonth').value           = k.month;
    document.getElementById('kVisits').value          = k.visits || '';
    document.getElementById('kContracts').value       = k.contracts || '';
    document.getElementById('kTargetContracts').value = k.target_contracts || '';
    document.getElementById('kRevenue').value         = k.revenue || '';
    document.getElementById('kTargetRevenue').value   = k.target_revenue || '';
    document.getElementById('kNotes').value           = k.notes || '';
  } else {
    document.getElementById('kpiForm').reset();
    document.getElementById('kMonth').value = new Date().toISOString().slice(0, 7);
  }
  document.getElementById('kpiModal').classList.add('open');
}

function closeModal() {
  document.getElementById('kpiModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteKpi(id) {
  if (!confirm('Delete this KPI entry?')) return;
  Storage.kpi.delete(id);
  Nav.toast('KPI entry deleted.', 'success');
  renderKpiList();
}

document.getElementById('saveKpi').addEventListener('click', () => {
  const month = document.getElementById('kMonth').value;
  if (!month) { Nav.toast('Month is required.', 'warning'); return; }

  const data = {
    month,
    visits:           Number(document.getElementById('kVisits').value) || 0,
    contracts:        Number(document.getElementById('kContracts').value) || 0,
    target_contracts: Number(document.getElementById('kTargetContracts').value) || 0,
    revenue:          Number(document.getElementById('kRevenue').value) || 0,
    target_revenue:   Number(document.getElementById('kTargetRevenue').value) || 0,
    notes:            document.getElementById('kNotes').value.trim(),
  };

  if (editingId) {
    Storage.kpi.update(editingId, data);
    Nav.toast('KPI updated.', 'success');
  } else {
    Storage.kpi.create(data);
    Nav.toast('KPI logged.', 'success');
  }
  closeModal();
  renderKpiList();
});

if (!Auth.hasRole(['admin', 'manager'])) {
  document.getElementById('addKpiBtn').style.display = 'none';
}

document.getElementById('addKpiBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('kpiModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

renderKpiList();
