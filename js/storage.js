/**
 * storage.js — Data Abstraction Layer
 * Seum OS | Seum Design Housing
 *
 * All data operations go through this module.
 * Current backend: localStorage (prototype/dev phase).
 *
 * MIGRATION PATH TO SUPABASE:
 *   1. Install Supabase JS client
 *   2. Replace each store's read/write functions with supabase.from('table').select/insert/update/delete
 *   3. Remove localStorage calls — the rest of the app doesn't change.
 *
 * Data Collections (localStorage keys):
 *   seum_visits        — Showroom visits
 *   seum_customers     — Customer records
 *   seum_contracts     — Sales contracts
 *   seum_employees     — Employee records
 *   seum_announcements — Team announcements
 *   seum_kpi           — KPI entries
 */

const Storage = (() => {

  // ── Generic CRUD helpers ────────────────────────────────────────────

  function _getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function _saveAll(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function _now() {
    return new Date().toISOString();
  }

  // ── Generic Store Factory ───────────────────────────────────────────
  // Creates a standard CRUD interface for any collection key.

  function createStore(key) {
    return {
      /** Return all records */
      getAll() {
        return _getAll(key);
      },

      /** Return one record by id */
      getById(id) {
        return _getAll(key).find(r => r.id === id) || null;
      },

      /** Create a new record; auto-generates id, createdAt, updatedAt */
      create(data) {
        const records = _getAll(key);
        const record = {
          id: _genId(),
          createdAt: _now(),
          updatedAt: _now(),
          ...data,
        };
        records.push(record);
        _saveAll(key, records);
        return record;
      },

      /** Update a record by id; updates updatedAt automatically */
      update(id, data) {
        const records = _getAll(key);
        const idx = records.findIndex(r => r.id === id);
        if (idx === -1) return null;
        records[idx] = { ...records[idx], ...data, updatedAt: _now() };
        _saveAll(key, records);
        return records[idx];
      },

      /** Delete a record by id */
      delete(id) {
        const records = _getAll(key);
        const idx = records.findIndex(r => r.id === id);
        if (idx === -1) return false;
        records.splice(idx, 1);
        _saveAll(key, records);
        return true;
      },

      /** Filter records with a predicate function */
      filter(predFn) {
        return _getAll(key).filter(predFn);
      },

      /** Count all records */
      count() {
        return _getAll(key).length;
      },

      /** Clear all records (use with caution) */
      clear() {
        _saveAll(key, []);
      },
    };
  }

  // ── Stores ──────────────────────────────────────────────────────────

  const visits        = createStore('seum_visits');
  const customers     = createStore('seum_customers');
  const contracts     = createStore('seum_contracts');
  const employees     = createStore('seum_employees');
  const announcements = createStore('seum_announcements');
  const kpi           = createStore('seum_kpi');

  // ── Seed Demo Data ──────────────────────────────────────────────────

  function seedDemoData() {
    // Only seed once — check if data already exists
    if (customers.count() > 0) return;

    // Customers
    const cust = [
      { name: '김민준', phone: '010-1234-5678', email: 'minjun@example.com', address: '서울 강남구', source: 'walk-in', status: 'active', notes: '' },
      { name: '이서연', phone: '010-2345-6789', email: 'seoyeon@example.com', address: '서울 서초구', source: 'referral', status: 'active', notes: '인테리어 관심 높음' },
      { name: '박지호', phone: '010-3456-7890', email: 'jiho@example.com', address: '경기 성남시', source: 'online', status: 'inactive', notes: '' },
      { name: '최수아', phone: '010-4567-8901', email: 'sua@example.com', address: '서울 마포구', source: 'walk-in', status: 'active', notes: '' },
    ].map(c => customers.create(c));

    // Showroom Visits
    visits.create({ customerId: cust[0].id, customerName: cust[0].name, date: '2026-03-10', time: '14:00', staff: '이서연', purpose: 'consultation', status: 'completed', notes: '주방 리모델링 문의' });
    visits.create({ customerId: cust[1].id, customerName: cust[1].name, date: '2026-03-12', time: '11:00', staff: '박지호', purpose: 'purchase', status: 'completed', notes: '계약 논의 진행' });
    visits.create({ customerId: cust[3].id, customerName: cust[3].name, date: '2026-03-16', time: '15:30', staff: '이서연', purpose: 'consultation', status: 'scheduled', notes: '' });

    // Contracts
    contracts.create({ customerId: cust[0].id, customerName: cust[0].name, title: '강남구 인테리어 계약', amount: 12000000, status: 'signed', signedDate: '2026-03-11', startDate: '2026-03-20', endDate: '2026-05-20', notes: '' });
    contracts.create({ customerId: cust[1].id, customerName: cust[1].name, title: '서초구 풀패키지 계약', amount: 25000000, status: 'draft', signedDate: '', startDate: '2026-04-01', endDate: '2026-06-30', notes: '검토 중' });

    // Employees
    employees.create({ name: '이서연', email: 'seoyeon@seumhousing.com', phone: '010-1111-2222', department: 'Sales',      position: 'Manager',    hireDate: '2024-01-15', status: 'active' });
    employees.create({ name: '박지호', email: 'jiho@seumhousing.com',    phone: '010-3333-4444', department: 'Design',     position: 'Designer',   hireDate: '2024-03-01', status: 'active' });
    employees.create({ name: '최수진', email: 'sujin@seumhousing.com',   phone: '010-5555-6666', department: 'Operations', position: 'Coordinator', hireDate: '2023-09-10', status: 'active' });

    // Announcements
    announcements.create({ title: '3월 팀 미팅 안내', content: '3월 20일 오전 10시에 전체 팀 미팅이 진행됩니다. 참석 바랍니다.', author: 'Admin User', priority: 'normal', pinned: false });
    announcements.create({ title: '쇼룸 운영 시간 변경', content: '4월부터 쇼룸 운영 시간이 오전 9시~오후 7시로 변경됩니다.', author: 'Admin User', priority: 'high', pinned: true });

    // KPI
    const months = ['2026-01', '2026-02', '2026-03'];
    months.forEach((month, i) => {
      kpi.create({ month, visits: 28 + i * 4, contracts: 6 + i, revenue: 45000000 + i * 8000000, target_revenue: 50000000, target_contracts: 8, notes: '' });
    });
  }

  // ── Dashboard Summary Helper ────────────────────────────────────────

  function getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    return {
      totalCustomers:       customers.count(),
      totalVisitsThisMonth: visits.filter(v => v.date && v.date.startsWith(thisMonth)).length,
      activeContracts:      contracts.filter(c => c.status === 'signed').length,
      totalEmployees:       employees.filter(e => e.status === 'active').length,
      todayVisits:          visits.filter(v => v.date === today && v.status === 'scheduled').length,
      draftContracts:       contracts.filter(c => c.status === 'draft').length,
    };
  }

  return {
    visits,
    customers,
    contracts,
    employees,
    announcements,
    kpi,
    seedDemoData,
    getDashboardStats,
  };
})();
