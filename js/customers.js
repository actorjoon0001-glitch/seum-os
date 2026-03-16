/**
 * customers.js — Customer Database Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

let editingId = null;

function renderTable(records) {
  const tbody = document.getElementById('customersBody');

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <h3>No customers found</h3>
      <p>Add your first customer or adjust filters.</p>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(c => {
    const visitCount = Storage.visits.filter(v => v.customerId === c.id).length;
    return `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:700;flex-shrink:0;">${c.name.slice(0,1)}</div>
          <strong>${c.name}</strong>
        </div>
      </td>
      <td>${c.phone || '—'}</td>
      <td>${c.email || '—'}</td>
      <td class="truncate" style="max-width:180px;">${c.address || '—'}</td>
      <td style="text-transform:capitalize;">${c.source || '—'}</td>
      <td><span class="badge badge-${c.status === 'active' ? 'success' : 'neutral'}">${c.status}</span></td>
      <td><span class="badge badge-primary">${visitCount}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEdit('${c.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteCustomer('${c.id}')" title="Delete" style="color:var(--danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function applyFilters() {
  let records = Storage.customers.getAll().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  const q      = document.getElementById('searchInput').value.trim().toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const source = document.getElementById('sourceFilter').value;

  if (q) records = records.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.phone || '').includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  );
  if (status) records = records.filter(c => c.status === status);
  if (source) records = records.filter(c => c.source === source);

  renderTable(records);
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit Customer' : 'Add Customer';
  if (id) {
    const c = Storage.customers.getById(id);
    document.getElementById('customerId').value = c.id;
    document.getElementById('cName').value    = c.name;
    document.getElementById('cPhone').value   = c.phone;
    document.getElementById('cEmail').value   = c.email || '';
    document.getElementById('cSource').value  = c.source;
    document.getElementById('cAddress').value = c.address || '';
    document.getElementById('cStatus').value  = c.status;
    document.getElementById('cNotes').value   = c.notes || '';
  } else {
    document.getElementById('customerForm').reset();
  }
  document.getElementById('customerModal').classList.add('open');
}

function closeModal() {
  document.getElementById('customerModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteCustomer(id) {
  if (!confirm('Delete this customer? Associated visits will remain.')) return;
  Storage.customers.delete(id);
  Nav.toast('Customer deleted.', 'success');
  applyFilters();
}

document.getElementById('saveCustomer').addEventListener('click', () => {
  const name  = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  if (!name || !phone) { Nav.toast('Name and phone are required.', 'warning'); return; }

  const data = {
    name,
    phone,
    email:   document.getElementById('cEmail').value.trim(),
    source:  document.getElementById('cSource').value,
    address: document.getElementById('cAddress').value.trim(),
    status:  document.getElementById('cStatus').value,
    notes:   document.getElementById('cNotes').value.trim(),
  };

  if (editingId) {
    Storage.customers.update(editingId, data);
    Nav.toast('Customer updated.', 'success');
  } else {
    Storage.customers.create(data);
    Nav.toast('Customer added.', 'success');
  }
  closeModal();
  applyFilters();
});

document.getElementById('addCustomerBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('customerModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('sourceFilter').addEventListener('change', applyFilters);

applyFilters();
