/**
 * 세움OS 월차/연차 관리
 * - 직원: 월차 신청 + 본인 신청 내역/잔여 조회
 * - 관리자/마스터: 전체 신청 조회·승인·반려 (승인 시 leave_balance 자동 차감)
 * - 승인된 연차/반차/병가/외근은 근태 캘린더에 자동 반영 (attendance.js에서 조회)
 *
 * 노출: window.seumLeave = { init, render }
 */
(function () {
  'use strict';

  var TABLE_REQ = 'leave_requests';
  var TABLE_BAL = 'leave_balance';

  var TYPE_LABEL = {
    annual: '연차',
    half: '반차',
    sick: '병가',
    outside: '외근'
  };
  var STATUS_LABEL = {
    pending: '대기',
    approved: '승인',
    rejected: '반려'
  };

  var state = {
    inited: false,
    myFilter: '',
    adminFilter: 'pending',
    balance: null,
    balanceYear: new Date().getFullYear(),
    myHireDate: null,
    myRequests: [],
    adminRequests: []
  };

  // ───────── util ─────────
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function supa() { return (typeof window !== 'undefined') && window.seumSupabase; }
  function $(id) { return document.getElementById(id); }
  function currentEmployee() {
    return (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) || null;
  }
  function showToast(msg, type) {
    if (typeof window.seumShowToast === 'function') return window.seumShowToast(msg, type);
    var el = document.getElementById('seum-toast');
    if (!el) { el = document.createElement('div'); el.id = 'seum-toast'; document.body.appendChild(el); }
    el.textContent = msg || '';
    el.style.background = (type === 'error') ? '#ef4444' : '#22c55e';
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }
  function isAdminUser() {
    var emp = currentEmployee();
    if (!emp) return false;
    var p = (emp.permission || '').toLowerCase();
    var r = (emp.role || '').toLowerCase();
    if (p === 'admin' || p === 'master' || r === 'admin' || r === 'master') return true;
    if (typeof window.seumIsSuperAdmin === 'function' && window.seumIsSuperAdmin()) return true;
    try {
      var list = JSON.parse(localStorage.getItem('seum_employees') || '[]');
      var me = list.find(function (x) { return (x.name || '') === (emp.name || ''); });
      if (me && ((me.permission || '').toLowerCase() === 'admin' || (me.permission || '').toLowerCase() === 'master')) return true;
    } catch (e) {}
    return false;
  }

  /** 두 날짜 사이 포함 일수(달력일). */
  function countDays(start, end) {
    if (!start || !end) return 0;
    var s = new Date(start);
    var e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    var ms = e.getTime() - s.getTime();
    return Math.floor(ms / 86400000) + 1;
  }

  /** 차감 일수 계산: 연차=날짜수, 반차=0.5, 병가/외근=0 */
  function computeDeduction(type, start, end) {
    if (type === 'annual') return Math.max(0, countDays(start, end));
    if (type === 'half') return 0.5;
    return 0;
  }

  function fmtDays(v) {
    if (v == null) return '-';
    var n = Number(v);
    if (isNaN(n)) return '-';
    return (n % 1 === 0) ? String(n) : n.toFixed(1);
  }
  function fmtDate(s) { return s || '-'; }
  function fmtDateRange(s, e) {
    if (s === e) return s;
    return s + ' ~ ' + e;
  }
  function fmtDateTime(s) {
    if (!s) return '-';
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
           ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  // ───────── 연차 산정 (근로기준법 제60조) ─────────

  /**
   * 입사일과 기준연도로 해당 연도 연차 총일수 계산.
   * 1) 근속 1년 미만 → 해당 연도 기준 "개근 가능 월수"만큼 부여, 최대 11일
   *    (월 개근 여부는 앱에서 따로 추적하지 않으므로 실제 근무한 전월 개수로 근사)
   * 2) 근속 1년 이상 → 15일
   * 3) 근속 3년 이상 → (근속연수-1)/2 만큼 가산 (16, 17, ... 25일 한도)
   * 4) 최대 25일
   */
  function computeLeaveAllowance(hireDate, year) {
    if (!hireDate) return { total: 0, method: 'none', serviceYears: 0, serviceMonths: 0 };
    var hire = new Date(hireDate);
    if (isNaN(hire.getTime())) return { total: 0, method: 'none', serviceYears: 0, serviceMonths: 0 };

    // 기준 시점: 기준연도 말(12/31)
    var ref = new Date(year, 11, 31);
    if (ref < hire) return { total: 0, method: 'none', serviceYears: 0, serviceMonths: 0 };

    // 근속 연수/개월 계산
    var years = ref.getFullYear() - hire.getFullYear();
    var months = (ref.getFullYear() - hire.getFullYear()) * 12 + (ref.getMonth() - hire.getMonth());
    if (ref.getDate() < hire.getDate()) { months -= 1; years -= (ref.getMonth() === hire.getMonth() ? 1 : 0); }
    // 보정: 월/일 기준으로 아직 1년이 안 됐으면 years -= 1
    var anniversary = new Date(hire.getFullYear() + years, hire.getMonth(), hire.getDate());
    if (anniversary > ref) years -= 1;
    if (years < 0) years = 0;
    if (months < 0) months = 0;

    if (years < 1) {
      // 1년 미만: 월 1일 × 개근월수, 최대 11
      // months = 지금까지 완주한 개월 수(ref 기준)
      var monthly = Math.min(11, months);
      return { total: monthly, method: 'monthly', serviceYears: years, serviceMonths: months };
    }

    // 1년 이상
    var base = 15;
    var extra = 0;
    if (years >= 3) extra = Math.floor((years - 1) / 2);
    var total = Math.min(25, base + extra);
    return { total: total, method: 'annual', serviceYears: years, serviceMonths: months };
  }

  /** employees 테이블에서 입사일 포함 직원 정보 조회. */
  async function fetchEmployeeByAuthId(authUserId) {
    var client = supa();
    if (!client || !authUserId) return null;
    try {
      var r = await client.from('employees').select('id, name, team, showroom, hire_date').eq('auth_user_id', authUserId).maybeSingle();
      if (r.error) return null;
      return r.data || null;
    } catch (e) { return null; }
  }

  // ───────── 잔여일 ─────────

  /**
   * 기준연도 balance 조회·생성 + 법정 기준으로 total_days 갱신.
   * used_days 는 그대로 유지한다.
   */
  async function ensureBalance(authUserId, emp, year) {
    var client = supa();
    if (!client || !authUserId) return null;
    year = year || new Date().getFullYear();
    try {
      // 입사일 확보 (세션 캐시 → DB)
      var hireDate = (emp && emp.hire_date) || state.myHireDate;
      if (!hireDate) {
        var detail = await fetchEmployeeByAuthId(authUserId);
        if (detail) { hireDate = detail.hire_date || null; if (detail && !emp) emp = detail; }
      }
      state.myHireDate = hireDate;

      var calc = computeLeaveAllowance(hireDate, year);

      var r = await client.from(TABLE_BAL).select('*').eq('user_id', authUserId).eq('year', year).maybeSingle();
      if (r.error) return null;

      if (r.data) {
        // 정책 일수 갱신 (total_days / 메타데이터). used_days는 유지.
        // remain_days 음수 방지: total_days >= used_days 보장
        var patch = {
          hire_date: hireDate || null,
          service_years: calc.serviceYears,
          service_months: calc.serviceMonths,
          allowance_method: calc.method,
          computed_at: new Date().toISOString()
        };
        if (hireDate) {
          var currentUsed = Number(r.data.used_days || 0);
          patch.total_days = Math.max(calc.total, currentUsed);
        }
        var up = await client.from(TABLE_BAL).update(patch).eq('id', r.data.id).select('*').maybeSingle();
        return up.data || r.data;
      }

      var ins = await client.from(TABLE_BAL).insert({
        user_id: authUserId,
        employee_id: emp ? (emp.id || null) : null,
        user_name: emp ? (emp.name || null) : null,
        year: year,
        total_days: hireDate ? calc.total : 15,
        used_days: 0,
        hire_date: hireDate || null,
        service_years: calc.serviceYears,
        service_months: calc.serviceMonths,
        allowance_method: calc.method,
        computed_at: new Date().toISOString()
      }).select('*').maybeSingle();
      return ins.data || null;
    } catch (e) { return null; }
  }

  /** 관리자: 전 직원 해당 연도 balance 재계산. */
  async function recomputeAllBalances(year) {
    if (!isAdminUser()) { showToast('권한이 없습니다.', 'error'); return 0; }
    var client = supa();
    if (!client) return 0;
    var r = await client.from('employees').select('id, auth_user_id, name, team, showroom, hire_date').eq('status', 'approved');
    if (r.error || !Array.isArray(r.data)) return 0;
    var list = r.data.filter(function (e) { return e && e.auth_user_id; });
    var count = 0;
    for (var i = 0; i < list.length; i++) {
      var emp = list[i];
      try {
        await ensureBalance(emp.auth_user_id, { id: emp.id, name: emp.name, hire_date: emp.hire_date }, year);
        count++;
      } catch (e) {}
    }
    return count;
  }

  function renderBalance(bal) {
    $('leave-balance-total').textContent = bal ? fmtDays(bal.total_days) : '-';
    $('leave-balance-used').textContent  = bal ? fmtDays(bal.used_days)  : '-';
    $('leave-balance-remain').textContent= bal ? fmtDays(bal.remain_days): '-';
    $('leave-balance-year').textContent  = bal ? (bal.year + '년') : '-';
    var hint = $('leave-balance-hint');
    if (hint) {
      if (!bal || !bal.hire_date) {
        hint.textContent = '입사일이 등록돼있지 않아 기본 15일을 적용 중입니다. 인사관리에서 입사일을 등록하면 법정 기준으로 자동 계산됩니다.';
        hint.classList.add('leave-balance-hint-warn');
      } else {
        var method = bal.allowance_method === 'monthly' ? '월 단위(1년 미만)' : '연 단위';
        var sy = Number(bal.service_years || 0);
        var sm = Number(bal.service_months || 0);
        var yrs = Math.floor(sy);
        var extraMonths = sm - yrs * 12;
        var svc = yrs + '년' + (extraMonths > 0 ? ' ' + extraMonths + '개월' : '');
        hint.textContent = '입사일 ' + bal.hire_date + ' · 근속 ' + svc + ' · 산정방식: ' + method;
        hint.classList.remove('leave-balance-hint-warn');
      }
    }
    var ySel = $('leave-balance-year-select');
    if (ySel && bal) ySel.value = String(bal.year);
  }

  // ───────── 신청 목록 ─────────

  async function fetchMyRequests(authUserId, status) {
    var client = supa();
    if (!client || !authUserId) return [];
    try {
      var q = client.from(TABLE_REQ).select('*').eq('user_id', authUserId).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      var r = await q;
      return (r.data && !r.error) ? r.data : [];
    } catch (e) { return []; }
  }

  async function fetchAllRequests(status) {
    var client = supa();
    if (!client) return [];
    try {
      var q = client.from(TABLE_REQ).select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      var r = await q;
      return (r.data && !r.error) ? r.data : [];
    } catch (e) { return []; }
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function statusBadge(status) {
    return '<span class="leave-status leave-status-' + status + '">' + (STATUS_LABEL[status] || status) + '</span>';
  }
  function typeBadge(type) {
    return '<span class="leave-type leave-type-' + type + '">' + (TYPE_LABEL[type] || type) + '</span>';
  }

  function renderMyList(rows) {
    var tbody = $('leave-my-tbody');
    var empty = $('leave-my-empty');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    var html = '';
    rows.forEach(function (r) {
      var canDelete = (r.status === 'pending');
      html += '<tr>';
      html += '<td>' + typeBadge(r.type) + '</td>';
      html += '<td>' + escHtml(fmtDateRange(r.start_date, r.end_date)) + '</td>';
      html += '<td>' + fmtDays(r.days) + '</td>';
      html += '<td class="leave-reason-cell">' + escHtml(r.reason || '-') + '</td>';
      html += '<td>' + statusBadge(r.status) + (r.status === 'rejected' && r.rejected_reason ? '<div class="leave-rejected-reason">' + escHtml(r.rejected_reason) + '</div>' : '') + '</td>';
      html += '<td>' + fmtDateTime(r.created_at) + '</td>';
      html += '<td>' + (canDelete ? '<button type="button" class="btn btn-danger btn-sm" data-leave-cancel="' + r.id + '">취소</button>' : '-') + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderAdminList(rows) {
    var tbody = $('leave-admin-tbody');
    var empty = $('leave-admin-empty');
    var countEl = $('leave-pending-count');
    if (!tbody) return;
    if (countEl) countEl.textContent = rows.filter(function (r) { return r.status === 'pending'; }).length;
    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    var html = '';
    rows.forEach(function (r) {
      var isPending = (r.status === 'pending');
      var teamShow = [r.team ? r.team + '팀' : '', r.showroom || ''].filter(function (x) { return x; }).join(' / ') || '-';
      html += '<tr>';
      html += '<td>' + escHtml(r.user_name || '-') + '</td>';
      html += '<td>' + escHtml(teamShow) + '</td>';
      html += '<td>' + typeBadge(r.type) + '</td>';
      html += '<td>' + escHtml(fmtDateRange(r.start_date, r.end_date)) + '</td>';
      html += '<td>' + fmtDays(r.days) + '</td>';
      html += '<td class="leave-reason-cell">' + escHtml(r.reason || '-') + '</td>';
      html += '<td>' + statusBadge(r.status) + (r.status === 'rejected' && r.rejected_reason ? '<div class="leave-rejected-reason">' + escHtml(r.rejected_reason) + '</div>' : '') + '</td>';
      html += '<td>' + fmtDateTime(r.created_at) + '</td>';
      html += '<td class="leave-admin-actions-cell">';
      if (isPending) {
        html += '<button type="button" class="btn btn-primary btn-sm" data-leave-approve="' + r.id + '">승인</button> ';
        html += '<button type="button" class="btn btn-danger btn-sm" data-leave-reject="' + r.id + '">반려</button>';
      } else {
        html += '-';
      }
      html += '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ───────── 액션 ─────────

  async function submitRequest(evt) {
    if (evt && evt.preventDefault) evt.preventDefault();
    var emp = currentEmployee();
    if (!emp || !emp.authUserId) { showToast('로그인이 필요합니다.', 'error'); return; }
    var client = supa();
    if (!client) return;

    var type = $('leave-type').value;
    var start = $('leave-start').value;
    var end = $('leave-end').value;
    var reason = $('leave-reason').value.trim();
    if (!type || !start || !end) { showToast('유형/시작일/종료일을 입력하세요.', 'error'); return; }
    if (end < start) { showToast('종료일이 시작일보다 빠를 수 없습니다.', 'error'); return; }
    if (type === 'half' && start !== end) { showToast('반차는 하루만 선택할 수 있습니다.', 'error'); return; }

    // 연차/반차는 출근 기록이 있는 날에 신청 불가
    if (type === 'annual' || type === 'half') {
      try {
        var conf = await client.from('attendance')
          .select('date, check_in')
          .eq('user_id', emp.authUserId)
          .gte('date', start).lte('date', end)
          .not('check_in', 'is', null);
        if (conf.data && conf.data.length > 0) {
          var days = conf.data.map(function (x) { return x.date; }).join(', ');
          showToast('이미 출근 기록이 있어 연차 신청이 불가합니다: ' + days, 'error');
          return;
        }
      } catch (e) {}
    }

    var deduct = computeDeduction(type, start, end);

    var payload = {
      user_id: emp.authUserId,
      employee_id: emp.id || null,
      user_name: emp.name || null,
      team: emp.team || null,
      showroom: emp.showroom || null,
      type: type,
      start_date: start,
      end_date: end,
      days: deduct,
      status: 'pending',
      reason: reason || null
    };
    try {
      var r = await client.from(TABLE_REQ).insert(payload).select('*').maybeSingle();
      if (r.error) throw r.error;
      closeModal();
      showToast('월차 신청이 접수됐습니다.');
      await reloadAll();
    } catch (e) {
      showToast('신청 실패: ' + (e && e.message ? e.message : '오류'), 'error');
    }
  }

  async function cancelRequest(id) {
    if (!id) return;
    if (!window.confirm('신청을 취소(삭제)하시겠습니까?')) return;
    var client = supa();
    if (!client) return;
    try {
      var r = await client.from(TABLE_REQ).delete().eq('id', id).eq('status', 'pending');
      if (r.error) throw r.error;
      showToast('신청이 취소됐습니다.');
      await reloadAll();
    } catch (e) {
      showToast('취소 실패: ' + (e && e.message ? e.message : '오류'), 'error');
    }
  }

  async function approveRequest(id) {
    if (!isAdminUser()) { showToast('승인 권한이 없습니다.', 'error'); return; }
    var client = supa();
    if (!client) return;
    try {
      var fr = await client.from(TABLE_REQ).select('*').eq('id', id).maybeSingle();
      if (fr.error || !fr.data) throw fr.error || new Error('신청을 찾을 수 없습니다.');
      var req = fr.data;
      if (req.status !== 'pending') { showToast('대기 상태만 승인할 수 있습니다.', 'error'); return; }
      var me = currentEmployee();
      var up = await client.from(TABLE_REQ).update({
        status: 'approved',
        approved_by: me ? me.authUserId : null,
        approved_at: new Date().toISOString(),
        rejected_reason: null
      }).eq('id', id).select('*').maybeSingle();
      if (up.error) throw up.error;

      // 연차/반차는 balance 차감 (remain_days 음수 방지 가드)
      var deduct = Number(req.days) || 0;
      if (deduct > 0 && (req.type === 'annual' || req.type === 'half')) {
        var year = new Date(req.start_date).getFullYear() || new Date().getFullYear();
        var br = await client.from(TABLE_BAL).select('*').eq('user_id', req.user_id).eq('year', year).maybeSingle();
        var bal = (br && !br.error) ? br.data : null;
        var total = bal ? Number(bal.total_days || 0) : 15;
        var used = bal ? Number(bal.used_days || 0) : 0;
        if (used + deduct > total) {
          // 승인 취소: pending 으로 롤백
          await client.from(TABLE_REQ).update({ status: 'pending', approved_by: null, approved_at: null }).eq('id', id);
          showToast('잔여 연차 부족 (총 ' + total + '일 / 사용 ' + used + '일 / 신청 ' + deduct + '일). 승인이 취소됐습니다.', 'error');
          await reloadAll();
          return;
        }
        if (bal) {
          await client.from(TABLE_BAL).update({ used_days: used + deduct }).eq('id', bal.id);
        } else {
          await client.from(TABLE_BAL).insert({
            user_id: req.user_id,
            employee_id: req.employee_id || null,
            user_name: req.user_name || null,
            year: year,
            total_days: 15,
            used_days: deduct
          });
        }
      }
      showToast('승인 처리됐습니다.');
      await reloadAll();
    } catch (e) {
      showToast('승인 실패: ' + (e && e.message ? e.message : '오류'), 'error');
    }
  }

  function openRejectModal(id) {
    $('leave-reject-id').value = id;
    $('leave-reject-reason').value = '';
    var modal = $('leave-reject-modal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeRejectModal() {
    var modal = $('leave-reject-modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function submitReject(evt) {
    if (evt && evt.preventDefault) evt.preventDefault();
    if (!isAdminUser()) { showToast('권한이 없습니다.', 'error'); return; }
    var id = $('leave-reject-id').value;
    var reason = $('leave-reject-reason').value.trim();
    if (!id) return;
    if (!reason) { showToast('반려 사유를 입력하세요.', 'error'); return; }
    var client = supa();
    var me = currentEmployee();
    try {
      var r = await client.from(TABLE_REQ).update({
        status: 'rejected',
        approved_by: me ? me.authUserId : null,
        approved_at: new Date().toISOString(),
        rejected_reason: reason
      }).eq('id', id).eq('status', 'pending').select('*').maybeSingle();
      if (r.error) throw r.error;
      closeRejectModal();
      showToast('반려 처리됐습니다.');
      await reloadAll();
    } catch (e) {
      showToast('반려 실패: ' + (e && e.message ? e.message : '오류'), 'error');
    }
  }

  // ───────── 모달 ─────────

  function openModal() {
    var today = new Date();
    var k = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
    $('leave-type').value = 'annual';
    $('leave-start').value = k;
    $('leave-end').value = k;
    $('leave-reason').value = '';
    $('leave-edit-id').value = '';
    recalcDays();
    var modal = $('leave-modal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    var modal = $('leave-modal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function recalcDays() {
    var type = $('leave-type').value;
    var s = $('leave-start').value;
    var e = $('leave-end').value;
    if (type === 'half' && s && !e) $('leave-end').value = s;
    if (type === 'half' && s && e && s !== e) $('leave-end').value = s;
    var days = computeDeduction(type, $('leave-start').value, $('leave-end').value);
    $('leave-days').value = fmtDays(days) + '일';
  }

  // ───────── 로드 & 렌더 ─────────

  async function reloadAll() {
    var emp = currentEmployee();
    if (!emp) return;
    populateYearSelect();
    var bal = await ensureBalance(emp.authUserId, emp, state.balanceYear);
    state.balance = bal;
    renderBalance(bal);
    state.myRequests = await fetchMyRequests(emp.authUserId, state.myFilter);
    renderMyList(state.myRequests);
    if (isAdminUser()) {
      $('leave-admin-card').classList.remove('hidden');
      var rec = $('btn-leave-recompute-all');
      if (rec) rec.classList.remove('hidden');
      state.adminRequests = await fetchAllRequests(state.adminFilter);
      renderAdminList(state.adminRequests);
    } else {
      $('leave-admin-card').classList.add('hidden');
      var rec2 = $('btn-leave-recompute-all');
      if (rec2) rec2.classList.add('hidden');
    }
  }

  function populateYearSelect() {
    var sel = $('leave-balance-year-select');
    if (!sel || sel.options.length) return;
    var y = new Date().getFullYear();
    for (var i = y - 3; i <= y + 1; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = i + '년';
      if (i === y) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  async function render() {
    init();
    await reloadAll();
  }

  // ───────── 이벤트 ─────────

  function initEvents() {
    var newBtn = $('btn-leave-new');
    if (newBtn) newBtn.addEventListener('click', openModal);
    var closeBtn = $('leave-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    var cancelBtn = $('btn-leave-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    var modal = $('leave-modal');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    var form = $('form-leave');
    if (form) form.addEventListener('submit', submitRequest);

    ['leave-type', 'leave-start', 'leave-end'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', recalcDays);
    });

    var myFilter = $('leave-my-filter');
    if (myFilter) myFilter.addEventListener('change', function () { state.myFilter = myFilter.value; reloadAll(); });
    var adminFilter = $('leave-admin-filter');
    if (adminFilter) adminFilter.addEventListener('change', function () { state.adminFilter = adminFilter.value; reloadAll(); });

    var refreshBtn = $('btn-leave-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', reloadAll);
    var adminRefresh = $('btn-leave-admin-refresh');
    if (adminRefresh) adminRefresh.addEventListener('click', reloadAll);

    var myTbody = $('leave-my-tbody');
    if (myTbody) myTbody.addEventListener('click', function (e) {
      var id = e.target && e.target.getAttribute && e.target.getAttribute('data-leave-cancel');
      if (id) cancelRequest(id);
    });
    var adminTbody = $('leave-admin-tbody');
    if (adminTbody) adminTbody.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var ap = t.getAttribute('data-leave-approve');
      var rj = t.getAttribute('data-leave-reject');
      if (ap) approveRequest(ap);
      else if (rj) openRejectModal(rj);
    });

    var rejectClose = $('leave-reject-close');
    if (rejectClose) rejectClose.addEventListener('click', closeRejectModal);
    var rejectCancel = $('btn-leave-reject-cancel');
    if (rejectCancel) rejectCancel.addEventListener('click', closeRejectModal);
    var rejectModal = $('leave-reject-modal');
    if (rejectModal) rejectModal.addEventListener('click', function (e) { if (e.target === rejectModal) closeRejectModal(); });
    var rejectForm = $('form-leave-reject');
    if (rejectForm) rejectForm.addEventListener('submit', submitReject);

    var yearSel = $('leave-balance-year-select');
    if (yearSel) yearSel.addEventListener('change', function () {
      state.balanceYear = Number(yearSel.value);
      reloadAll();
    });
    var recomputeBtn = $('btn-leave-recompute-self');
    if (recomputeBtn) recomputeBtn.addEventListener('click', async function () {
      var emp = currentEmployee();
      if (!emp) return;
      state.myHireDate = null; // 캐시 무효화
      await ensureBalance(emp.authUserId, emp, state.balanceYear);
      await reloadAll();
      showToast('내 연차가 재계산됐습니다.');
    });
    var recomputeAllBtn = $('btn-leave-recompute-all');
    if (recomputeAllBtn) recomputeAllBtn.addEventListener('click', async function () {
      if (!window.confirm(state.balanceYear + '년 기준으로 전 직원 연차를 재계산합니다. 진행할까요?')) return;
      recomputeAllBtn.disabled = true;
      try {
        var n = await recomputeAllBalances(state.balanceYear);
        showToast('전 직원 ' + n + '명 연차가 재계산됐습니다.');
        await reloadAll();
      } finally {
        recomputeAllBtn.disabled = false;
      }
    });
  }

  function init() {
    if (state.inited) return;
    state.inited = true;
    initEvents();
  }

  window.seumLeave = { init: init, render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
