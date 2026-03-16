/**
 * contracts.js — Sales Contracts Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

let editingId = null;

function formatKRW(n) {
  return '₩' + Number(n || 0).toLocaleString('ko-KR');
}

function renderStats() {
  const all = Storage.contracts.getAll();
  const total = all.reduce((s, c) => s + Number(c.amount || 0), 0);
  const signed = all.filter(c => c.status === 'signed');
  const signedTotal = signed.reduce((s, c) => s + Number(c.amount || 0), 0);

  const stats = [
    { label: 'Total Contracts', value: all.length },
    { label: 'Signed',          value: signed.length },
    { label: 'Draft',           value: all.filter(c => c.status === 'draft').length },
    { label: 'Signed Value',    value: formatKRW(signedTotal) },
  ];

  document.getElementById('contractStats').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="margin-top:var(--sp-2);font-size:${typeof s.value === 'string' ? 'var(--text-lg)' : 'var(--text-3xl)'};">${s.value}</div>
    </div>
  `).join('');
}

function renderTable(records) {
  const tbody = document.getElementById('contractsBody');

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
      <h3>No contracts found</h3><p>Create a new contract or adjust your filters.</p>
    </div></td></tr>`;
    return;
  }

  const statusBadge = { draft: 'warning', signed: 'success', completed: 'info', cancelled: 'neutral' };

  tbody.innerHTML = records.map(c => `
    <tr>
      <td><strong>${c.title}</strong></td>
      <td>${c.customerName}</td>
      <td style="font-weight:600;">${formatKRW(c.amount)}</td>
      <td><span class="badge badge-${statusBadge[c.status] || 'neutral'}">${c.status}</span></td>
      <td>${c.signedDate || '—'}</td>
      <td>${c.startDate || '—'}</td>
      <td>${c.endDate || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEdit('${c.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteContract('${c.id}')" title="Delete" style="color:var(--danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function applyFilters() {
  let records = Storage.contracts.getAll().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  const q      = document.getElementById('searchInput').value.trim().toLowerCase();
  const status = document.getElementById('statusFilter').value;

  if (q) records = records.filter(c =>
    c.title.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q)
  );
  if (status) records = records.filter(c => c.status === status);

  renderTable(records);
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit Contract' : 'New Contract';
  if (id) {
    const c = Storage.contracts.getById(id);
    document.getElementById('contractId').value    = c.id;
    document.getElementById('ctTitle').value        = c.title;
    document.getElementById('ctCustomerName').value = c.customerName;
    document.getElementById('ctAmount').value       = c.amount;
    document.getElementById('ctStatus').value       = c.status;
    document.getElementById('ctSignedDate').value   = c.signedDate || '';
    document.getElementById('ctStartDate').value    = c.startDate || '';
    document.getElementById('ctEndDate').value      = c.endDate || '';
    document.getElementById('ctNotes').value        = c.notes || '';
  } else {
    document.getElementById('contractForm').reset();
  }
  document.getElementById('contractModal').classList.add('open');
}

function closeModal() {
  document.getElementById('contractModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteContract(id) {
  if (!confirm('Delete this contract?')) return;
  Storage.contracts.delete(id);
  Nav.toast('Contract deleted.', 'success');
  renderStats();
  applyFilters();
}

document.getElementById('saveContract').addEventListener('click', () => {
  const title        = document.getElementById('ctTitle').value.trim();
  const customerName = document.getElementById('ctCustomerName').value.trim();
  const amount       = document.getElementById('ctAmount').value;

  if (!title || !customerName || !amount) {
    Nav.toast('Title, customer, and amount are required.', 'warning');
    return;
  }

  const data = {
    title, customerName,
    amount:     Number(amount),
    status:     document.getElementById('ctStatus').value,
    signedDate: document.getElementById('ctSignedDate').value,
    startDate:  document.getElementById('ctStartDate').value,
    endDate:    document.getElementById('ctEndDate').value,
    notes:      document.getElementById('ctNotes').value.trim(),
  };

  if (editingId) {
    Storage.contracts.update(editingId, data);
    Nav.toast('Contract updated.', 'success');
  } else {
    Storage.contracts.create(data);
    Nav.toast('Contract created.', 'success');
  }
  closeModal();
  renderStats();
  applyFilters();
});

document.getElementById('addContractBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('contractModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

renderStats();
applyFilters();
