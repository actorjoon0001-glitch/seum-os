/**
 * employees.js — Employee Management Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

let editingId = null;

const DEPT_COLORS = {
  Sales:       { bg: 'var(--success-soft)', color: 'var(--success)' },
  Design:      { bg: 'var(--accent-soft)',  color: 'var(--accent)' },
  Operations:  { bg: 'var(--warning-soft)', color: 'var(--warning)' },
  Management:  { bg: '#f3e8ff',             color: '#9333ea' },
};

function renderGrid(records) {
  const grid = document.getElementById('employeeGrid');

  if (records.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <h3>No employees found</h3><p>Add a team member or adjust your filters.</p>
    </div>`;
    return;
  }

  grid.innerHTML = records.map(e => {
    const initials  = e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const dc        = DEPT_COLORS[e.department] || { bg: 'var(--bg)', color: 'var(--text-muted)' };
    const hireYear  = e.hireDate ? e.hireDate.split('-')[0] : '—';

    return `
    <div class="card" style="padding:var(--sp-5);">
      <div style="display:flex;align-items:center;gap:var(--sp-4);margin-bottom:var(--sp-4)">
        <div style="width:48px;height:48px;border-radius:50%;background:${dc.bg};color:${dc.color};display:flex;align-items:center;justify-content:center;font-size:var(--text-base);font-weight:700;flex-shrink:0;">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:var(--text-base);">${e.name}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">${e.position || 'No position'}</div>
        </div>
        <span class="badge badge-${e.status === 'active' ? 'success' : 'neutral'}">${e.status}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--sp-2);margin-bottom:var(--sp-4);">
        <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--text-xs);color:var(--text-muted);">
          <span style="background:${dc.bg};color:${dc.color};padding:2px 8px;border-radius:999px;font-weight:600;">${e.department}</span>
          <span>· Since ${hireYear}</span>
        </div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);">${e.email}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);">${e.phone || '—'}</div>
      </div>
      <div style="display:flex;gap:var(--sp-2);">
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openEdit('${e.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteEmployee('${e.id}')" title="Delete" style="color:var(--danger)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

function applyFilters() {
  let records = Storage.employees.getAll().sort((a, b) => a.name.localeCompare(b.name));
  const q      = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept   = document.getElementById('deptFilter').value;
  const status = document.getElementById('statusFilter').value;

  if (q) records = records.filter(e =>
    e.name.toLowerCase().includes(q) || (e.department || '').toLowerCase().includes(q)
  );
  if (dept)   records = records.filter(e => e.department === dept);
  if (status) records = records.filter(e => e.status === status);

  renderGrid(records);
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit Employee' : 'Add Employee';
  if (id) {
    const e = Storage.employees.getById(id);
    document.getElementById('employeeId').value = e.id;
    document.getElementById('eName').value      = e.name;
    document.getElementById('eEmail').value     = e.email;
    document.getElementById('ePhone').value     = e.phone || '';
    document.getElementById('eDept').value      = e.department;
    document.getElementById('ePosition').value  = e.position || '';
    document.getElementById('eHireDate').value  = e.hireDate || '';
    document.getElementById('eStatus').value    = e.status;
  } else {
    document.getElementById('employeeForm').reset();
  }
  document.getElementById('employeeModal').classList.add('open');
}

function closeModal() {
  document.getElementById('employeeModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteEmployee(id) {
  if (!confirm('Remove this employee from the system?')) return;
  Storage.employees.delete(id);
  Nav.toast('Employee removed.', 'success');
  applyFilters();
}

document.getElementById('saveEmployee').addEventListener('click', () => {
  const name  = document.getElementById('eName').value.trim();
  const email = document.getElementById('eEmail').value.trim();
  if (!name || !email) { Nav.toast('Name and email are required.', 'warning'); return; }

  const data = {
    name, email,
    phone:      document.getElementById('ePhone').value.trim(),
    department: document.getElementById('eDept').value,
    position:   document.getElementById('ePosition').value.trim(),
    hireDate:   document.getElementById('eHireDate').value,
    status:     document.getElementById('eStatus').value,
  };

  if (editingId) {
    Storage.employees.update(editingId, data);
    Nav.toast('Employee updated.', 'success');
  } else {
    Storage.employees.create(data);
    Nav.toast('Employee added.', 'success');
  }
  closeModal();
  applyFilters();
});

document.getElementById('addEmployeeBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('employeeModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('deptFilter').addEventListener('change', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

applyFilters();
