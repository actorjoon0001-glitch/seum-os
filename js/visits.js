/**
 * visits.js — Showroom Visits Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

let editingId = null;

// ── Render Stats ─────────────────────────────────────────────────────
function renderStats() {
  const all = Storage.visits.getAll();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const stats = [
    { label: 'Total Visits',       value: all.length },
    { label: 'Scheduled',          value: all.filter(v => v.status === 'scheduled').length },
    { label: 'Completed',          value: all.filter(v => v.status === 'completed').length },
    { label: 'This Month',         value: all.filter(v => v.date && v.date.startsWith(thisMonth)).length },
  ];

  document.getElementById('visitStats').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="margin-top:var(--sp-2)">${s.value}</div>
    </div>
  `).join('');
}

// ── Render Table ─────────────────────────────────────────────────────
function renderTable(records) {
  const tbody = document.getElementById('visitsBody');

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <h3>No visits found</h3>
      <p>Add a new visit or adjust your filters.</p>
    </div></td></tr>`;
    return;
  }

  const statusBadge = { scheduled: 'primary', completed: 'success', cancelled: 'neutral' };

  tbody.innerHTML = records.map(v => `
    <tr>
      <td><strong>${v.customerName}</strong></td>
      <td>${v.date || '—'}</td>
      <td>${v.time || '—'}</td>
      <td style="text-transform:capitalize;">${v.purpose || '—'}</td>
      <td>${v.staff || '—'}</td>
      <td><span class="badge badge-${statusBadge[v.status] || 'neutral'}">${v.status}</span></td>
      <td class="truncate" style="max-width:160px;" title="${v.notes || ''}">${v.notes || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEdit('${v.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteVisit('${v.id}')" title="Delete" style="color:var(--danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Filtering ─────────────────────────────────────────────────────────
function applyFilters() {
  let records = Storage.visits.getAll().sort((a, b) => (a.date > b.date ? -1 : 1));

  const q      = document.getElementById('searchInput').value.trim().toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const dateF  = document.getElementById('dateFilter').value;

  if (q) records = records.filter(v => v.customerName.toLowerCase().includes(q));
  if (status) records = records.filter(v => v.status === status);

  if (dateF) {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split('T')[0];
    if (dateF === 'today')   records = records.filter(v => v.date === today);
    if (dateF === 'week')    records = records.filter(v => v.date >= weekStr);
    if (dateF === 'month')   records = records.filter(v => v.date && v.date.startsWith(thisMonth));
  }

  renderTable(records);
}

// ── Modal ─────────────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const modal = document.getElementById('visitModal');
  document.getElementById('modalTitle').textContent = id ? 'Edit Visit' : 'New Visit';

  if (id) {
    const v = Storage.visits.getById(id);
    document.getElementById('visitId').value = v.id;
    document.getElementById('vCustomerName').value = v.customerName;
    document.getElementById('vDate').value = v.date;
    document.getElementById('vTime').value = v.time;
    document.getElementById('vPurpose').value = v.purpose;
    document.getElementById('vStaff').value = v.staff;
    document.getElementById('vStatus').value = v.status;
    document.getElementById('vNotes').value = v.notes || '';
  } else {
    document.getElementById('visitForm').reset();
    document.getElementById('vDate').value = new Date().toISOString().split('T')[0];
  }

  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('visitModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteVisit(id) {
  if (!confirm('Delete this visit record?')) return;
  Storage.visits.delete(id);
  Nav.toast('Visit deleted.', 'success');
  renderStats();
  applyFilters();
}

// ── Save ──────────────────────────────────────────────────────────────
document.getElementById('saveVisit').addEventListener('click', () => {
  const customerName = document.getElementById('vCustomerName').value.trim();
  const date = document.getElementById('vDate').value;
  const time = document.getElementById('vTime').value;

  if (!customerName || !date || !time) {
    Nav.toast('Please fill in required fields.', 'warning');
    return;
  }

  const data = {
    customerName,
    date,
    time,
    purpose: document.getElementById('vPurpose').value,
    staff:   document.getElementById('vStaff').value.trim(),
    status:  document.getElementById('vStatus').value,
    notes:   document.getElementById('vNotes').value.trim(),
  };

  if (editingId) {
    Storage.visits.update(editingId, data);
    Nav.toast('Visit updated successfully.', 'success');
  } else {
    Storage.visits.create(data);
    Nav.toast('Visit scheduled.', 'success');
  }

  closeModal();
  renderStats();
  applyFilters();
});

// ── Event Listeners ───────────────────────────────────────────────────
document.getElementById('addVisitBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('visitModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('dateFilter').addEventListener('change', applyFilters);

// ── Init ──────────────────────────────────────────────────────────────
renderStats();
applyFilters();
