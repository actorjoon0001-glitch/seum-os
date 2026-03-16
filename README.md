# Seum OS — Internal Operating System

**Company:** Seum Design Housing
**Version:** 0.1.0 (Prototype)
**Stack:** HTML · CSS · Vanilla JavaScript
**Deployment:** Netlify (planned)
**Database:** localStorage → Supabase (planned migration)

---

## Project Structure

```
seum-os/
├── index.html            Login page (entry point)
├── dashboard.html        Main dashboard with KPI overview
├── visits.html           Showroom visit scheduler & tracker
├── customers.html        Customer database (CRUD)
├── contracts.html        Sales contracts manager
├── employees.html        Employee directory
├── announcements.html    Team announcements board
├── kpi.html              Monthly KPI reporting
│
├── css/
│   └── main.css          Design system (tokens, components, layout)
│
└── js/
    ├── auth.js           Authentication & session management
    ├── storage.js        Data abstraction layer (localStorage → Supabase)
    ├── nav.js            Sidebar nav renderer + toast notification system
    ├── visits.js         Showroom visits module logic
    ├── customers.js      Customer database module logic
    ├── contracts.js      Contracts module logic
    ├── employees.js      Employee management module logic
    ├── announcements.js  Announcements module logic
    └── kpi.js            KPI dashboard module logic
```

---

## Architecture

### Design Principles
- **Zero build tools** — pure HTML/CSS/JS, runs directly in the browser
- **Modular** — each page loads only the JS it needs
- **Data-layer abstraction** — all data goes through `Storage.*` so the backend can be swapped without touching UI code
- **Role-based UI** — admin/manager/staff roles gate certain features

### Authentication Flow
1. `index.html` (login) → `Auth.login()` → stores session in `localStorage`
2. Every protected page calls `Auth.requireAuth()` on load — redirects to login if not authenticated
3. `Auth.logout()` clears the session and redirects

### Data Flow
```
Page JS → Storage.{collection}.create/update/delete/getAll() → localStorage
                                                               ↕ (future)
                                                           Supabase tables
```

### Demo Credentials
| Role    | Email                       | Password   |
|---------|-----------------------------|------------|
| Admin   | admin@seumhousing.com       | admin123   |
| Manager | sales@seumhousing.com       | sales123   |
| Staff   | staff@seumhousing.com       | staff123   |

> ⚠️ These are prototype credentials only. Replace with Supabase Auth before any production use.

---

## Modules

| Module        | File                  | Features |
|---------------|-----------------------|---------|
| Dashboard     | `dashboard.html`      | Stats overview, today's visits, KPI progress, pinned announcements |
| Visits        | `visits.html`         | Schedule/track showroom visits, filter by status/date |
| Customers     | `customers.html`      | Full CRUD, search, source & status filters, visit count per customer |
| Contracts     | `contracts.html`      | Draft/signed/completed contracts, value tracking |
| Employees     | `employees.html`      | Card grid view, department color coding, CRUD |
| Announcements | `announcements.html`  | Post/pin announcements, priority levels, role-gated authoring |
| KPI           | `kpi.html`            | Monthly revenue & contract targets, progress bars, achievement scoring |

---

## Known Issues (v0.1 Prototype)

1. **No password hashing** — credentials stored plain text in localStorage (prototype only)
2. **No session expiry** — sessions persist indefinitely until logout
3. **No real-time sync** — multiple tabs/users see stale data without refresh
4. **No file attachments** — contracts cannot store PDFs yet
5. **localStorage size limit** — ~5MB per origin; sufficient for prototype, not for production

---

## Roadmap — Supabase Migration

### Phase 1: Auth
```js
// Replace auth.js login() with:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

### Phase 2: Database Tables
- `visits`, `customers`, `contracts`, `employees`, `announcements`, `kpi`
- Replace each `Storage.*` method with `supabase.from('table')` calls

### Phase 3: Real-time
Add `supabase.channel()` subscriptions for live visit and announcement updates.

### Phase 4: File Storage
Use Supabase Storage for contract PDF uploads.

---

## Security Checklist (Before Production)

- [ ] Migrate to Supabase Auth (server-side password hashing, JWT tokens)
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Sanitize all user-rendered HTML
- [ ] Add HTTPS enforcement (Netlify handles this automatically)
- [ ] Remove all demo passwords from source code
- [ ] Add session expiry (e.g., 8-hour token refresh)
- [ ] Move role checks to server-side RLS policies