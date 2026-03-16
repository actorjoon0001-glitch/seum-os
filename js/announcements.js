/**
 * announcements.js — Team Announcements Module
 * Seum OS | Seum Design Housing
 */

Nav.init();

const session = Auth.getSession();
let editingId = null;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderList(records) {
  const list = document.getElementById('announcementList');

  if (records.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <h3>No announcements</h3><p>Post the first team announcement.</p>
    </div>`;
    return;
  }

  const priorityBadge = { high: 'danger', normal: 'neutral', low: 'info' };

  list.innerHTML = records.map(a => `
    <div class="announcement-card ${a.pinned ? 'pinned' : ''}">
      <div class="ann-header">
        <div>
          ${a.pinned ? '<div class="pin-badge">📌 Pinned</div>' : ''}
          <div class="ann-title">${a.title}</div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-2);flex-shrink:0;">
          <span class="badge badge-${priorityBadge[a.priority] || 'neutral'}">${a.priority}</span>
          ${session.role === 'admin' || session.role === 'manager' ? `
          <div class="ann-actions">
            <button class="btn btn-ghost btn-sm btn-icon" onclick="openEdit('${a.id}')" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteAnn('${a.id}')" title="Delete" style="color:var(--danger)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>` : ''}
        </div>
      </div>
      <div class="ann-body">${a.content}</div>
      <div class="ann-meta">
        <span>By ${a.author}</span>
        <span>·</span>
        <span>${formatDate(a.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

function applyFilters() {
  let records = Storage.announcements.getAll().sort((a, b) => {
    // Pinned first, then by date desc
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.createdAt > b.createdAt ? -1 : 1;
  });

  const q         = document.getElementById('searchInput').value.trim().toLowerCase();
  const priority  = document.getElementById('priorityFilter').value;
  const pinnedOnly = document.getElementById('pinnedOnly').checked;

  if (q)          records = records.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  if (priority)   records = records.filter(a => a.priority === priority);
  if (pinnedOnly) records = records.filter(a => a.pinned);

  renderList(records);
}

function openModal(id = null) {
  editingId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit Announcement' : 'New Announcement';
  if (id) {
    const a = Storage.announcements.getById(id);
    document.getElementById('annId').value     = a.id;
    document.getElementById('aTitle').value   = a.title;
    document.getElementById('aContent').value = a.content;
    document.getElementById('aPriority').value = a.priority;
    document.getElementById('aPinned').checked = !!a.pinned;
  } else {
    document.getElementById('annForm').reset();
  }
  document.getElementById('annModal').classList.add('open');
}

function closeModal() {
  document.getElementById('annModal').classList.remove('open');
  editingId = null;
}

function openEdit(id) { openModal(id); }

function deleteAnn(id) {
  if (!confirm('Delete this announcement?')) return;
  Storage.announcements.delete(id);
  Nav.toast('Announcement deleted.', 'success');
  applyFilters();
}

document.getElementById('saveAnn').addEventListener('click', () => {
  const title   = document.getElementById('aTitle').value.trim();
  const content = document.getElementById('aContent').value.trim();
  if (!title || !content) { Nav.toast('Title and content are required.', 'warning'); return; }

  const data = {
    title, content,
    priority: document.getElementById('aPriority').value,
    pinned:   document.getElementById('aPinned').checked,
    author:   session.name,
  };

  if (editingId) {
    Storage.announcements.update(editingId, data);
    Nav.toast('Announcement updated.', 'success');
  } else {
    Storage.announcements.create(data);
    Nav.toast('Announcement published.', 'success');
  }
  closeModal();
  applyFilters();
});

// Role-based: only admin/manager can add announcements
if (!Auth.hasRole(['admin', 'manager'])) {
  document.getElementById('addAnnBtn').style.display = 'none';
}

document.getElementById('addAnnBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('annModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('priorityFilter').addEventListener('change', applyFilters);
document.getElementById('pinnedOnly').addEventListener('change', applyFilters);

applyFilters();
