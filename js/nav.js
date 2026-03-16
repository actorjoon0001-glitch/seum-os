/**
 * nav.js — Shared Navigation & Layout Utilities
 * Seum OS | Seum Design Housing
 *
 * Injects the sidebar nav into every page and handles:
 *  - Active link highlighting
 *  - User info in sidebar footer
 *  - Logout button
 *  - Mobile menu toggle
 *  - Toast notifications
 */

const Nav = (() => {

  const NAV_ITEMS = [
    {
      section: 'Overview',
      links: [
        { href: '/dashboard.html', label: 'Dashboard', icon: 'grid' },
      ],
    },
    {
      section: 'Operations',
      links: [
        { href: '/visits.html',    label: 'Showroom Visits', icon: 'calendar' },
        { href: '/customers.html', label: 'Customers',       icon: 'users' },
        { href: '/contracts.html', label: 'Contracts',       icon: 'file-text' },
      ],
    },
    {
      section: 'Team',
      links: [
        { href: '/employees.html',     label: 'Employees',     icon: 'user' },
        { href: '/announcements.html', label: 'Announcements', icon: 'bell' },
        { href: '/kpi.html',           label: 'KPI',           icon: 'bar-chart' },
      ],
    },
  ];

  // SVG icon map (inline SVG for zero dependencies)
  const ICONS = {
    'grid':       '<polyline points="3 3 10 3 10 10 3 10 3 3"/><polyline points="14 3 21 3 21 10 14 10 14 3"/><polyline points="14 14 21 14 21 21 14 21 14 14"/><polyline points="3 14 10 14 10 21 3 21 3 14"/>',
    'calendar':   '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'users':      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'file-text':  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    'user':       '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'bell':       '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    'bar-chart':  '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    'log-out':    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'menu':       '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  };

  function icon(name) {
    return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  // ── Render Sidebar ──────────────────────────────────────────────────

  function renderSidebar() {
    const session = Auth.getSession();
    if (!session) return;

    const currentPage = '/' + (window.location.pathname.split('/').pop() || 'index.html');
    const initials = session.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const sectionsHtml = NAV_ITEMS.map(({ section, links }) => `
      <div class="sidebar-section">
        <div class="sidebar-label">${section}</div>
        <nav class="sidebar-nav">
          ${links.map(({ href, label, icon: ic }) => `
            <a href="${href}" class="${currentPage === href ? 'active' : ''}">
              ${icon(ic)}
              <span>${label}</span>
            </a>
          `).join('')}
        </nav>
      </div>
    `).join('');

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-logo">S</div>
        <div>
          <div class="brand-name">Seum OS</div>
          <div class="brand-sub">Design Housing</div>
        </div>
      </div>
      ${sectionsHtml}
      <div class="sidebar-footer">
        <div class="user-pill">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${session.name}</div>
            <div class="user-role">${session.role}</div>
          </div>
          <button class="btn-logout" id="logoutBtn" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS['log-out']}</svg>
          </button>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
      Auth.logout();
    });

    // Mobile overlay
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeMobileMenu);
    }
  }

  function openMobileMenu() {
    document.getElementById('sidebar').classList.add('open');
    const bd = document.getElementById('sidebarBackdrop');
    if (bd) { bd.style.display = 'block'; }
  }

  function closeMobileMenu() {
    document.getElementById('sidebar').classList.remove('open');
    const bd = document.getElementById('sidebarBackdrop');
    if (bd) { bd.style.display = 'none'; }
  }

  // ── Toast Notification System ───────────────────────────────────────

  function _getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration  ms before auto-dismiss (default 3500)
   */
  function toast(message, type = 'info', duration = 3500) {
    const toastIconMap = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };

    const container = _getToastContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${toastIconMap[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Init ────────────────────────────────────────────────────────────

  function init() {
    Auth.requireAuth();
    Storage.seedDemoData();
    renderSidebar();

    // Mobile menu button
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', openMobileMenu);
    }
  }

  return { init, toast, renderSidebar };
})();
