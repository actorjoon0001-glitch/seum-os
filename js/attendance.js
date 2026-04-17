/**
 * 세움OS 근태관리 (Step 2: 직원용 출퇴근 UI 전용)
 * - 오늘 카드 렌더 + 출근/퇴근 API 호출만 담당
 * - 관리자 페이지/KPI/업무일지 연동은 이후 단계에서 추가
 *
 * 노출: window.seumAttendance = { init, render }
 */
(function () {
  'use strict';

  var TABLE = 'attendance';

  /** 상태 enum (DB string union 과 일치). */
  var STATUS = {
    BEFORE: 'before',
    WORKING: 'working',
    FINISHED: 'finished',
    LATE: 'late'
  };

  /** 한글 라벨. */
  var STATUS_LABEL = {
    before: '출근전',
    working: '근무중',
    finished: '퇴근완료',
    late: '지각',
    absent: '결근',
    outside: '외근',
    business_trip: '출장',
    vacation: '휴가',
    sick: '병가'
  };

  /** 기준 출근시간 (분). 09:00. 이후 환경설정으로 교체 가능. */
  var LATE_THRESHOLD_MINUTES = 9 * 60;

  var renderTimer = null;
  var inited = false;
  var busy = false;

  // ────────── util ──────────

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function toDateKey(d) {
    var x = d instanceof Date ? d : new Date(d || Date.now());
    return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
  }
  function toHHMM(v) {
    if (!v) return '-';
    var d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return '-';
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function minutesOfDay(v) {
    if (!v) return null;
    var d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  }
  function isLate(v) {
    var m = minutesOfDay(v);
    return m != null && m > LATE_THRESHOLD_MINUTES;
  }
  function formatDuration(minutes) {
    if (minutes == null || isNaN(minutes) || minutes < 0) return '-';
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return h + '시간 ' + m + '분';
  }
  function formatDateKo(d) {
    var x = d instanceof Date ? d : new Date(d);
    var days = ['일', '월', '화', '수', '목', '금', '토'];
    return x.getFullYear() + '년 ' + (x.getMonth() + 1) + '월 ' + x.getDate() + '일 (' + days[x.getDay()] + ')';
  }
  function supa() { return (typeof window !== 'undefined') && window.seumSupabase; }
  function currentEmployee() {
    return (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) || null;
  }
  function showToast(msg, type) {
    if (typeof window.seumShowToast === 'function') return window.seumShowToast(msg, type);
    var el = document.getElementById('seum-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'seum-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg || '';
    el.style.background = (type === 'error') ? '#ef4444' : '#22c55e';
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  function buildLocalId(userId, dateKey) {
    return 'att_' + String(userId || 'anon') + '_' + dateKey;
  }

  // ────────── API ──────────

  /** 내 오늘 레코드 조회. 없으면 null. */
  async function getMyTodayRecord() {
    var emp = currentEmployee();
    var client = supa();
    if (!emp || !emp.authUserId || !client) return null;
    try {
      var r = await client
        .from(TABLE)
        .select('*')
        .eq('user_id', emp.authUserId)
        .eq('date', toDateKey(new Date()))
        .maybeSingle();
      if (r.error) return null;
      return r.data || null;
    } catch (e) { return null; }
  }

  /** 오늘 레코드 업서트. */
  async function upsertMyToday(patch) {
    var emp = currentEmployee();
    var client = supa();
    if (!emp || !emp.authUserId) throw new Error('로그인이 필요합니다.');
    if (!client) throw new Error('Supabase 연결이 없습니다.');
    var dateKey = toDateKey(new Date());
    var payload = Object.assign({
      local_id: buildLocalId(emp.authUserId, dateKey),
      user_id: emp.authUserId,
      employee_id: emp.id || null,
      user_name: emp.name || null,
      team: emp.team || null,
      showroom: emp.showroom || null,
      date: dateKey,
      updated_by: emp.authUserId
    }, patch || {});
    if (payload.check_in && payload.check_out) {
      var diff = Math.floor((new Date(payload.check_out).getTime() - new Date(payload.check_in).getTime()) / 60000);
      payload.work_minutes = diff > 0 ? diff : 0;
    }
    if (payload.check_in) payload.is_late = isLate(payload.check_in);
    var r = await client.from(TABLE).upsert(payload, { onConflict: 'local_id' }).select('*').maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }

  async function checkIn() {
    var existing = await getMyTodayRecord();
    if (existing && existing.check_in) {
      return { ok: false, reason: 'already_checked_in', record: existing };
    }
    var now = new Date();
    var status = isLate(now) ? STATUS.LATE : STATUS.WORKING;
    var rec = await upsertMyToday({
      check_in: now.toISOString(),
      status: status,
      created_by: (currentEmployee() || {}).authUserId || null
    });
    return { ok: true, record: rec };
  }

  async function checkOut() {
    var existing = await getMyTodayRecord();
    if (!existing || !existing.check_in) return { ok: false, reason: 'no_check_in' };
    if (existing.check_out) return { ok: false, reason: 'already_checked_out', record: existing };
    var now = new Date();
    var finalStatus = isLate(existing.check_in) ? STATUS.LATE : STATUS.FINISHED;
    var rec = await upsertMyToday({
      check_in: existing.check_in,
      check_out: now.toISOString(),
      status: finalStatus
    });
    return { ok: true, record: rec };
  }

  // ────────── UI ──────────

  function $(id) { return document.getElementById(id); }

  function applyStatusBadge(el, status) {
    if (!el) return;
    el.classList.remove(
      'attendance-status-before',
      'attendance-status-working',
      'attendance-status-finished',
      'attendance-status-late',
      'attendance-status-absent',
      'attendance-status-outside',
      'attendance-status-business_trip',
      'attendance-status-vacation',
      'attendance-status-sick'
    );
    el.classList.add('attendance-status-' + status);
    el.textContent = STATUS_LABEL[status] || '출근전';
  }

  function calcLiveDuration(rec) {
    if (!rec || !rec.check_in) return null;
    var start = new Date(rec.check_in).getTime();
    var end = rec.check_out ? new Date(rec.check_out).getTime() : Date.now();
    return Math.max(0, Math.floor((end - start) / 60000));
  }

  function renderCard(rec) {
    var emp = currentEmployee();
    var dateEl = $('attendance-today-date');
    var nameEl = $('attendance-today-name');
    var badgeEl = $('attendance-today-status-badge');
    var inEl = $('attendance-today-checkin');
    var outEl = $('attendance-today-checkout');
    var durEl = $('attendance-today-duration');
    var btnIn = $('btn-attendance-checkin');
    var btnOut = $('btn-attendance-checkout');
    var hintEl = $('attendance-today-hint');

    if (dateEl) dateEl.textContent = formatDateKo(new Date());
    if (nameEl) nameEl.textContent = (emp && emp.name) ? emp.name + ' 님' : '로그인 정보 없음';

    var status = (rec && rec.status) || STATUS.BEFORE;
    // check_in/check_out 으로 파생 상태 보정 (수동 상태 값은 유지)
    var manual = ['vacation', 'sick', 'outside', 'business_trip', 'absent'];
    if (manual.indexOf(status) < 0) {
      if (rec && rec.check_in && rec.check_out) status = isLate(rec.check_in) ? STATUS.LATE : STATUS.FINISHED;
      else if (rec && rec.check_in) status = isLate(rec.check_in) ? STATUS.LATE : STATUS.WORKING;
      else status = STATUS.BEFORE;
    }
    applyStatusBadge(badgeEl, status);

    if (inEl) inEl.textContent = rec && rec.check_in ? toHHMM(rec.check_in) : '-';
    if (outEl) outEl.textContent = rec && rec.check_out ? toHHMM(rec.check_out) : '-';
    if (durEl) durEl.textContent = formatDuration(calcLiveDuration(rec));

    var hasIn = !!(rec && rec.check_in);
    var hasOut = !!(rec && rec.check_out);
    if (btnIn) btnIn.disabled = hasIn || busy;
    if (btnOut) btnOut.disabled = !hasIn || hasOut || busy;

    if (hintEl) {
      if (!hasIn) hintEl.textContent = '';
      else if (hasIn && !hasOut) hintEl.textContent = '근무 중입니다. 퇴근 시 "퇴근하기" 버튼을 눌러주세요.';
      else hintEl.textContent = '오늘 퇴근 기록이 완료됐습니다.';
    }

    // 근무중일 때만 실시간 카운트 갱신
    if (renderTimer) { clearInterval(renderTimer); renderTimer = null; }
    if (hasIn && !hasOut) {
      renderTimer = setInterval(function () {
        if (!durEl) return;
        durEl.textContent = formatDuration(calcLiveDuration(rec));
      }, 60 * 1000);
    }
  }

  async function render() {
    var emp = currentEmployee();
    if (!emp) {
      renderCard(null);
      return;
    }
    var rec = await getMyTodayRecord();
    renderCard(rec);
  }

  async function handleCheckIn() {
    if (busy) return;
    busy = true;
    try {
      var r = await checkIn();
      if (!r.ok) {
        if (r.reason === 'already_checked_in') showToast('이미 오늘 출근 처리됐습니다.', 'error');
        else showToast('출근 처리에 실패했습니다.', 'error');
      } else {
        showToast('출근이 기록됐습니다.');
      }
    } catch (e) {
      showToast('오류: ' + (e && e.message ? e.message : '출근 실패'), 'error');
    } finally {
      busy = false;
      render();
    }
  }

  async function handleCheckOut() {
    if (busy) return;
    busy = true;
    try {
      var r = await checkOut();
      if (!r.ok) {
        if (r.reason === 'no_check_in') showToast('출근 기록이 없어 퇴근할 수 없습니다.', 'error');
        else if (r.reason === 'already_checked_out') showToast('이미 오늘 퇴근 처리됐습니다.', 'error');
        else showToast('퇴근 처리에 실패했습니다.', 'error');
      } else {
        showToast('퇴근이 기록됐습니다. 오늘도 수고하셨습니다!');
      }
    } catch (e) {
      showToast('오류: ' + (e && e.message ? e.message : '퇴근 실패'), 'error');
    } finally {
      busy = false;
      render();
    }
  }

  // ────────── 권한 ──────────

  function isAdminUser() {
    var emp = currentEmployee();
    if (!emp) return false;
    var p = (emp.permission || '').toLowerCase();
    var r = (emp.role || '').toLowerCase();
    if (p === 'admin' || p === 'master' || r === 'admin' || r === 'master') return true;
    if (typeof window.seumIsSuperAdmin === 'function' && window.seumIsSuperAdmin()) return true;
    // fallback: localStorage 보완 조회 (app.js 패턴과 동일)
    try {
      var list = JSON.parse(localStorage.getItem('seum_employees') || '[]');
      var me = list.find(function (x) { return (x.name || '') === (emp.name || ''); });
      if (me && ((me.permission || '').toLowerCase() === 'admin' || (me.permission || '').toLowerCase() === 'master')) return true;
    } catch (e) {}
    return false;
  }

  function isManagerUser() {
    var emp = currentEmployee();
    if (!emp) return false;
    var p = (emp.permission || '').toLowerCase();
    var r = (emp.role || '').toLowerCase();
    return p === 'manager' || r === 'manager';
  }

  // ────────── 월간 캘린더 ──────────

  var calState = {
    inited: false,
    year: 0,
    month: 0,
    showroom: '',
    team: '',
    status: '',               // 상태 필터 (빈 문자열이면 전체)
    groupMode: 'showroom_team', // showroom_team | showroom | team | flat
    employees: [],            // 현재 권한으로 볼 수 있는 직원 목록
    records: {},              // key: authUserId + '|' + dateKey → attendance row
    leaves: {},               // key: authUserId + '|' + dateKey → 'vacation'|'sick'|'outside'|'business_trip'
    collapsed: {},            // 그룹 접힘 상태. key: group id(예 'sr:headquarters' / 'tm:headquarters|영업')
    currentCell: null,        // 상세 모달에 표시 중인 셀 정보
  };

  var SHOWROOM_ORDER = ['headquarters', 'showroom1', 'showroom3', 'showroom4', 'ganghwa', '_etc'];
  var TEAM_ORDER = ['영업', '설계', '시공', '마케팅', '정산', '경영', '_etc'];

  var SHOWROOM_LABEL = {
    headquarters: '본사 전시장',
    showroom1: '1전시장',
    showroom3: '3전시장',
    showroom4: '4전시장',
    ganghwa: '강화전시장'
  };

  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  function monthDateRange(y, m) {
    var last = daysInMonth(y, m);
    return {
      first: y + '-' + pad2(m) + '-01',
      last: y + '-' + pad2(m) + '-' + pad2(last),
      days: last
    };
  }

  /** 권한에 따라 볼 수 있는 직원 후보를 Supabase에서 조회. */
  async function fetchVisibleEmployees() {
    var client = supa();
    var me = currentEmployee();
    if (!client || !me) return [];
    try {
      var q = client.from('employees').select('id, auth_user_id, name, team, showroom, permission, status').eq('status', 'approved');
      var r = await q;
      if (r.error || !Array.isArray(r.data)) return [];
      var list = r.data.filter(function (e) { return e && e.auth_user_id; });
      if (isAdminUser()) return list;
      if (isManagerUser()) {
        return list.filter(function (e) {
          return (e.team || '') === (me.team || '') && (e.showroom || '') === (me.showroom || '');
        });
      }
      // 일반 직원: 본인만
      return list.filter(function (e) { return e.auth_user_id === me.authUserId; });
    } catch (e) { return []; }
  }

  /** 해당 월의 attendance 레코드 조회 (필터 적용). */
  async function fetchMonthRecords(year, month, showroom, team) {
    var client = supa();
    if (!client) return [];
    var range = monthDateRange(year, month);
    try {
      var q = client.from(TABLE).select('*').gte('date', range.first).lte('date', range.last);
      if (showroom) q = q.eq('showroom', showroom);
      if (team) q = q.eq('team', team);
      var r = await q;
      if (r.error || !Array.isArray(r.data)) return [];
      return r.data;
    } catch (e) { return []; }
  }

  /** 해당 월에 겹치는 승인된 월차/연차/병가/외근을 user_id+date 맵으로 반환. */
  async function fetchMonthApprovedLeaves(year, month) {
    var client = supa();
    if (!client) return {};
    var range = monthDateRange(year, month);
    try {
      var r = await client.from('leave_requests').select('user_id, type, start_date, end_date, status')
        .eq('status', 'approved')
        .lte('start_date', range.last)
        .gte('end_date', range.first);
      if (r.error || !Array.isArray(r.data)) return {};
      var map = {};
      r.data.forEach(function (lv) {
        if (!lv.user_id || !lv.start_date || !lv.end_date) return;
        var mapped = leaveTypeToStatus(lv.type);
        if (!mapped) return;
        var s = new Date(lv.start_date + 'T00:00:00');
        var e = new Date(lv.end_date + 'T00:00:00');
        var first = new Date(range.first + 'T00:00:00');
        var last = new Date(range.last + 'T00:00:00');
        if (s < first) s = first;
        if (e > last) e = last;
        for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          var key = lv.user_id + '|' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
          // 우선순위: sick > vacation > business_trip > outside (가장 강한 상태 남김)
          var prev = map[key];
          if (!prev || priorityOf(mapped) > priorityOf(prev)) map[key] = mapped;
        }
      });
      return map;
    } catch (e) { return {}; }
  }

  function leaveTypeToStatus(type) {
    if (type === 'annual' || type === 'half') return 'vacation';
    if (type === 'sick') return 'sick';
    if (type === 'outside') return 'outside';
    return null;
  }
  function priorityOf(status) {
    var order = { outside: 1, business_trip: 2, vacation: 3, sick: 4 };
    return order[status] || 0;
  }

  function inferCellStatus(rec, leaveStatus) {
    // 승인된 월차가 있으면 최우선 적용 (출근 기록보다 우선)
    if (leaveStatus) return leaveStatus;
    if (!rec) return 'empty';
    var manual = ['vacation', 'sick', 'outside', 'business_trip', 'absent'];
    if (manual.indexOf(rec.status) >= 0) return rec.status;
    if (rec.check_in && rec.check_out) return isLate(rec.check_in) ? 'late' : 'finished';
    if (rec.check_in) return isLate(rec.check_in) ? 'late' : 'working';
    return 'empty';
  }

  function statusChar(status) {
    switch (status) {
      case 'working': return '근';
      case 'finished': return '퇴';
      case 'late': return '지';
      case 'absent': return '결';
      case 'outside': return '외';
      case 'business_trip': return '출';
      case 'vacation': return '휴';
      case 'sick': return '병';
      default: return '·';
    }
  }

  function populateCalYearSelect() {
    var sel = $('attendance-cal-year');
    if (!sel || sel.options.length) return;
    var now = new Date();
    var y = now.getFullYear();
    for (var i = y - 2; i <= y + 1; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = i + '년';
      sel.appendChild(opt);
    }
  }

  function syncCalFilters() {
    var now = new Date();
    if (!calState.year) calState.year = now.getFullYear();
    if (!calState.month) calState.month = now.getMonth() + 1;

    var ySel = $('attendance-cal-year');
    var mSel = $('attendance-cal-month');
    var srSel = $('attendance-cal-showroom');
    var tSel = $('attendance-cal-team');
    var stSel = $('attendance-cal-status');
    var gmSel = $('attendance-cal-groupmode');
    if (ySel) ySel.value = String(calState.year);
    if (mSel) mSel.value = String(calState.month);
    if (srSel) srSel.value = calState.showroom || '';
    if (tSel) tSel.value = calState.team || '';
    if (stSel) stSel.value = calState.status || '';
    if (gmSel) gmSel.value = calState.groupMode || 'showroom_team';

    // 권한별 필터 잠금
    var me = currentEmployee();
    var isAdm = isAdminUser();
    var isMgr = isManagerUser();
    if (srSel) srSel.disabled = !isAdm;
    if (tSel) tSel.disabled = !isAdm;
    if (!isAdm && (isMgr || !!me)) {
      if (srSel && me && me.showroom) srSel.value = me.showroom;
      if (tSel && me && me.team) tSel.value = me.team;
      calState.showroom = (me && me.showroom) || '';
      calState.team = (me && me.team) || '';
    }
  }

  function updateCalTitle() {
    var el = $('attendance-cal-title');
    var hint = $('attendance-cal-hint');
    if (el) el.textContent = calState.year + '년 ' + calState.month + '월 근태 현황';
    if (hint) {
      var parts = [];
      if (calState.showroom) parts.push(SHOWROOM_LABEL[calState.showroom] || calState.showroom);
      if (calState.team) parts.push(calState.team + '팀');
      if (calState.status) parts.push('상태: ' + (STATUS_LABEL[calState.status] || calState.status));
      if (!isAdminUser() && !isManagerUser()) parts.push('본인만');
      hint.textContent = parts.join(' · ');
    }
  }

  function buildRecordMap(records) {
    var map = {};
    records.forEach(function (r) {
      if (!r || !r.user_id || !r.date) return;
      var key = r.user_id + '|' + r.date;
      map[key] = r;
    });
    return map;
  }

  function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

  function buildHeaderHtml(days) {
    var y = calState.year, m = calState.month;
    var th = '<tr><th class="attendance-cal-name-col">이름</th><th class="attendance-cal-team-col">팀 / 소속</th>';
    for (var d = 1; d <= days; d++) {
      var weekday = new Date(y, m - 1, d).getDay();
      var wkClass = weekday === 0 ? ' attendance-cal-sun' : (weekday === 6 ? ' attendance-cal-sat' : '');
      th += '<th class="attendance-cal-day' + wkClass + '">' + d + '</th>';
    }
    th += '</tr>';
    return th;
  }

  function buildEmployeeRowHtml(emp, days) {
    var y = calState.year, m = calState.month;
    var teamLabel = (emp.team ? emp.team + '팀' : '-');
    var shLabel = emp.showroom ? (SHOWROOM_LABEL[emp.showroom] || emp.showroom) : '';
    var html = '<tr>';
    html += '<td class="attendance-cal-name-col" title="' + escAttr(emp.name) + '">' + (emp.name || '-') + '</td>';
    html += '<td class="attendance-cal-team-col"><div class="attendance-cal-team-name">' + teamLabel + '</div>' +
            (shLabel ? '<div class="attendance-cal-team-sub">' + shLabel + '</div>' : '') + '</td>';
    for (var d = 1; d <= days; d++) {
      var dateKey = y + '-' + pad2(m) + '-' + pad2(d);
      var rec = calState.records[emp.auth_user_id + '|' + dateKey] || null;
      var leaveSt = calState.leaves[emp.auth_user_id + '|' + dateKey] || null;
      var st = inferCellStatus(rec, leaveSt);
      var highlight = (calState.status && calState.status === st) ? ' attendance-cal-cell-hit' : '';
      var dim = (calState.status && calState.status !== st) ? ' attendance-cal-cell-dim' : '';
      html += '<td class="attendance-cal-cell attendance-status-' + st + highlight + dim + '" ' +
              'data-user-id="' + escAttr(emp.auth_user_id) + '" ' +
              'data-user-name="' + escAttr(emp.name) + '" ' +
              'data-team="' + escAttr(emp.team) + '" ' +
              'data-showroom="' + escAttr(emp.showroom) + '" ' +
              'data-date="' + dateKey + '" ' +
              'title="' + escAttr(emp.name) + ' / ' + dateKey + ' / ' + (STATUS_LABEL[st] || '미기록') + '">' +
              statusChar(st) + '</td>';
    }
    html += '</tr>';
    return html;
  }

  /** 월 내에 해당 상태의 셀을 1개 이상 가진 직원만 남긴다. */
  function employeeMatchesStatus(emp, status, days) {
    if (!status) return true;
    var y = calState.year, m = calState.month;
    for (var d = 1; d <= days; d++) {
      var dateKey = y + '-' + pad2(m) + '-' + pad2(d);
      var rec = calState.records[emp.auth_user_id + '|' + dateKey] || null;
      var leaveSt = calState.leaves[emp.auth_user_id + '|' + dateKey] || null;
      if (inferCellStatus(rec, leaveSt) === status) return true;
    }
    return false;
  }

  /** 전시장 → 팀 → 직원 트리로 그룹핑. */
  function groupEmployees(rows) {
    var shMap = {};
    rows.forEach(function (e) {
      var sr = e.showroom || '_etc';
      var tm = e.team || '_etc';
      if (!shMap[sr]) shMap[sr] = {};
      if (!shMap[sr][tm]) shMap[sr][tm] = [];
      shMap[sr][tm].push(e);
    });
    var present = SHOWROOM_ORDER.filter(function (k) { return shMap[k]; });
    Object.keys(shMap).forEach(function (k) { if (present.indexOf(k) < 0) present.push(k); });
    return present.map(function (sr) {
      var teams = shMap[sr];
      var tkeys = TEAM_ORDER.filter(function (k) { return teams[k]; });
      Object.keys(teams).forEach(function (k) { if (tkeys.indexOf(k) < 0) tkeys.push(k); });
      return {
        showroom: sr,
        teams: tkeys.map(function (t) {
          return {
            team: t,
            employees: teams[t].slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
          };
        })
      };
    });
  }

  function showroomLabel(sr) {
    if (!sr || sr === '_etc') return '기타 전시장';
    return SHOWROOM_LABEL[sr] || sr;
  }
  function teamLabel(tm) {
    if (!tm || tm === '_etc') return '기타 팀';
    return tm + '팀';
  }

  function isGroupCollapsed(key) { return !!calState.collapsed[key]; }

  function buildSubTableHtml(employees, days) {
    var html = '<div class="attendance-cal-scroll attendance-cal-scroll-sub">';
    html += '<table class="attendance-cal-table">';
    html += '<thead>' + buildHeaderHtml(days) + '</thead>';
    html += '<tbody>';
    employees.forEach(function (e) { html += buildEmployeeRowHtml(e, days); });
    html += '</tbody></table></div>';
    return html;
  }

  function buildTeamBlockHtml(showroomKey, teamKey, employees, days) {
    var gkey = 'tm:' + showroomKey + '|' + teamKey;
    var collapsed = isGroupCollapsed(gkey);
    var html = '<div class="attendance-cal-team-block">';
    html += '<button type="button" class="attendance-cal-group-toggle attendance-cal-team-toggle' +
            (collapsed ? ' is-collapsed' : '') + '" data-toggle-group="' + escAttr(gkey) + '">';
    html += '<span class="attendance-cal-group-caret">▾</span>';
    html += '<span class="attendance-cal-group-label">' + teamLabel(teamKey) + '</span>';
    html += '<span class="attendance-cal-group-count">' + employees.length + '명</span>';
    html += '</button>';
    if (!collapsed) html += buildSubTableHtml(employees, days);
    html += '</div>';
    return html;
  }

  function buildShowroomBlockHtml(group, days, mode) {
    var gkey = 'sr:' + group.showroom;
    var collapsed = isGroupCollapsed(gkey);
    var total = 0;
    group.teams.forEach(function (t) { total += t.employees.length; });
    var html = '<section class="attendance-cal-showroom-block">';
    html += '<button type="button" class="attendance-cal-group-toggle attendance-cal-showroom-toggle' +
            (collapsed ? ' is-collapsed' : '') + '" data-toggle-group="' + escAttr(gkey) + '">';
    html += '<span class="attendance-cal-group-caret">▾</span>';
    html += '<span class="attendance-cal-group-label">' + showroomLabel(group.showroom) + '</span>';
    html += '<span class="attendance-cal-group-count">' + total + '명</span>';
    html += '</button>';
    if (!collapsed) {
      if (mode === 'showroom_team') {
        html += '<div class="attendance-cal-showroom-body">';
        group.teams.forEach(function (t) {
          html += buildTeamBlockHtml(group.showroom, t.team, t.employees, days);
        });
        html += '</div>';
      } else {
        // 전시장만 그룹핑: 전시장 아래에 전체 직원 테이블 1개
        var all = [];
        group.teams.forEach(function (t) { all = all.concat(t.employees); });
        all.sort(function (a, b) {
          var t = (a.team || '').localeCompare(b.team || '');
          return t !== 0 ? t : (a.name || '').localeCompare(b.name || '');
        });
        html += buildSubTableHtml(all, days);
      }
    }
    html += '</section>';
    return html;
  }

  function renderCalendarGrid() {
    var container = $('attendance-cal-groups');
    var empty = $('attendance-cal-empty');
    if (!container) return;
    var days = daysInMonth(calState.year, calState.month);

    // 1) 기본 필터 (전시장/팀)
    var rows = calState.employees.slice();
    if (calState.showroom) rows = rows.filter(function (e) { return (e.showroom || '') === calState.showroom; });
    if (calState.team) rows = rows.filter(function (e) { return (e.team || '') === calState.team; });

    // 2) 상태 필터: 월 안에서 해당 상태가 하나라도 있는 직원만
    if (calState.status) {
      rows = rows.filter(function (e) { return employeeMatchesStatus(e, calState.status, days); });
    }

    if (!rows.length) {
      container.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    var mode = calState.groupMode || 'showroom_team';

    if (mode === 'flat') {
      container.innerHTML = buildSubTableHtml(
        rows.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }),
        days
      );
      return;
    }

    if (mode === 'team') {
      // 팀만 그룹핑 (전시장 무시)
      var teamMap = {};
      rows.forEach(function (e) {
        var t = e.team || '_etc';
        if (!teamMap[t]) teamMap[t] = [];
        teamMap[t].push(e);
      });
      var tkeys = TEAM_ORDER.filter(function (k) { return teamMap[k]; });
      Object.keys(teamMap).forEach(function (k) { if (tkeys.indexOf(k) < 0) tkeys.push(k); });
      var html = '';
      tkeys.forEach(function (t) {
        html += buildTeamBlockHtml('_all', t,
          teamMap[t].sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }),
          days);
      });
      container.innerHTML = html;
      return;
    }

    // showroom_team 또는 showroom 모드
    var groups = groupEmployees(rows);
    var outHtml = '';
    groups.forEach(function (g) { outHtml += buildShowroomBlockHtml(g, days, mode); });
    container.innerHTML = outHtml;
  }

  async function loadAndRenderCalendar() {
    populateCalYearSelect();
    syncCalFilters();
    updateCalTitle();
    var container = $('attendance-cal-groups');
    if (container) container.innerHTML = '<p class="attendance-cal-loading">불러오는 중...</p>';
    var emps = await fetchVisibleEmployees();
    calState.employees = emps;
    var recs = await fetchMonthRecords(calState.year, calState.month, calState.showroom, calState.team);
    calState.records = buildRecordMap(recs);
    calState.leaves = await fetchMonthApprovedLeaves(calState.year, calState.month);
    renderCalendarGrid();
  }

  function listAllGroupKeys() {
    var keys = [];
    var rows = calState.employees.slice();
    if (calState.showroom) rows = rows.filter(function (e) { return (e.showroom || '') === calState.showroom; });
    if (calState.team) rows = rows.filter(function (e) { return (e.team || '') === calState.team; });
    var mode = calState.groupMode || 'showroom_team';
    if (mode === 'flat') return keys;
    var groups = groupEmployees(rows);
    groups.forEach(function (g) {
      keys.push('sr:' + g.showroom);
      if (mode === 'showroom_team') g.teams.forEach(function (t) { keys.push('tm:' + g.showroom + '|' + t.team); });
    });
    if (mode === 'team') {
      var teamSet = {};
      rows.forEach(function (e) { teamSet[e.team || '_etc'] = true; });
      Object.keys(teamSet).forEach(function (t) { keys.push('tm:_all|' + t); });
    }
    return keys;
  }

  function collapseAll(collapsed) {
    var keys = listAllGroupKeys();
    calState.collapsed = {};
    if (collapsed) keys.forEach(function (k) { calState.collapsed[k] = true; });
    renderCalendarGrid();
  }

  // ────────── 셀 상세/수정 ──────────

  function openDetailModal(cellInfo) {
    calState.currentCell = cellInfo;
    var modal = $('attendance-detail-modal');
    if (!modal) return;
    var rec = calState.records[cellInfo.userId + '|' + cellInfo.date] || null;
    $('attendance-detail-user-id').value = cellInfo.userId;
    $('attendance-detail-date').value = cellInfo.date;
    $('attendance-detail-name').value = cellInfo.name || '-';
    var teamTxt = (cellInfo.team ? cellInfo.team + '팀' : '-');
    var shTxt = cellInfo.showroom ? (SHOWROOM_LABEL[cellInfo.showroom] || cellInfo.showroom) : '';
    $('attendance-detail-team').value = teamTxt + (shTxt ? ' / ' + shTxt : '');
    $('attendance-detail-date-view').value = cellInfo.date;
    $('attendance-detail-checkin').value = rec && rec.check_in ? toHHMM(rec.check_in) : '';
    $('attendance-detail-checkout').value = rec && rec.check_out ? toHHMM(rec.check_out) : '';
    $('attendance-detail-status').value = (rec && rec.status) || inferCellStatus(rec);
    $('attendance-detail-note').value = (rec && rec.note) || '';

    var canEdit = isAdminUser();
    ['attendance-detail-checkin', 'attendance-detail-checkout', 'attendance-detail-status', 'attendance-detail-note']
      .forEach(function (id) { var el = $(id); if (el) el.disabled = !canEdit; });
    var saveBtn = $('btn-attendance-detail-save');
    if (saveBtn) saveBtn.style.display = canEdit ? '' : 'none';
    var delBtn = $('btn-attendance-detail-delete');
    if (delBtn) delBtn.style.display = (canEdit && rec && rec.id) ? '' : 'none';

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeDetailModal() {
    var modal = $('attendance-detail-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    calState.currentCell = null;
  }

  function combineDateTime(dateKey, hhmm) {
    if (!dateKey || !hhmm) return null;
    var parts = hhmm.split(':');
    if (parts.length !== 2) return null;
    var dateParts = dateKey.split('-');
    var dt = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]), Number(parts[0]), Number(parts[1]), 0, 0);
    return dt.toISOString();
  }

  async function saveDetail(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAdminUser()) { showToast('수정 권한이 없습니다.', 'error'); return; }
    var cell = calState.currentCell;
    if (!cell) return;
    var client = supa();
    if (!client) return;
    var me = currentEmployee();
    var emp = calState.employees.find(function (x) { return x.auth_user_id === cell.userId; }) || {};
    var checkInVal = $('attendance-detail-checkin').value;
    var checkOutVal = $('attendance-detail-checkout').value;
    var status = $('attendance-detail-status').value;
    var note = $('attendance-detail-note').value;

    var payload = {
      local_id: 'att_' + cell.userId + '_' + cell.date,
      user_id: cell.userId,
      employee_id: emp.id || null,
      user_name: emp.name || cell.name || null,
      team: emp.team || cell.team || null,
      showroom: emp.showroom || cell.showroom || null,
      date: cell.date,
      check_in: combineDateTime(cell.date, checkInVal),
      check_out: combineDateTime(cell.date, checkOutVal),
      status: status,
      note: note,
      updated_by: me ? me.authUserId : null
    };
    if (payload.check_in) payload.is_late = isLate(payload.check_in);
    if (payload.check_in && payload.check_out) {
      var d1 = new Date(payload.check_in).getTime();
      var d2 = new Date(payload.check_out).getTime();
      payload.work_minutes = Math.max(0, Math.floor((d2 - d1) / 60000));
    }

    try {
      var r = await client.from(TABLE).upsert(payload, { onConflict: 'local_id' }).select('*').maybeSingle();
      if (r.error) throw r.error;
      calState.records[cell.userId + '|' + cell.date] = r.data;
      renderCalendarGrid();
      closeDetailModal();
      showToast('근태 정보가 저장됐습니다.');
    } catch (err) {
      showToast('저장 실패: ' + (err && err.message ? err.message : '오류'), 'error');
    }
  }

  async function deleteDetail() {
    if (!isAdminUser()) { showToast('삭제 권한이 없습니다.', 'error'); return; }
    var cell = calState.currentCell;
    if (!cell) return;
    var rec = calState.records[cell.userId + '|' + cell.date];
    if (!rec || !rec.id) { showToast('삭제할 기록이 없습니다.', 'error'); return; }
    if (!window.confirm((cell.name || '직원') + ' / ' + cell.date + ' 의 근태 기록을 삭제하시겠습니까?')) return;
    var client = supa();
    if (!client) return;
    try {
      var r = await client.from(TABLE).delete().eq('id', rec.id);
      if (r.error) throw r.error;
      delete calState.records[cell.userId + '|' + cell.date];
      renderCalendarGrid();
      closeDetailModal();
      showToast('근태 기록이 삭제됐습니다.');
    } catch (err) {
      showToast('삭제 실패: ' + (err && err.message ? err.message : '오류'), 'error');
    }
  }

  // ────────── 탭 전환 & 이벤트 ──────────

  function switchTab(tab) {
    var tabs = document.querySelectorAll('.attendance-tab');
    tabs.forEach(function (btn) { btn.classList.toggle('active', btn.getAttribute('data-attendance-tab') === tab); });
    var todayPanel = $('attendance-panel-today');
    var calPanel = $('attendance-panel-calendar');
    if (todayPanel) todayPanel.classList.toggle('hidden', tab !== 'today');
    if (calPanel) calPanel.classList.toggle('hidden', tab !== 'calendar');
    if (tab === 'calendar' && !calState.inited) {
      calState.inited = true;
      loadAndRenderCalendar();
    } else if (tab === 'calendar') {
      loadAndRenderCalendar();
    }
  }

  function initCalendarEvents() {
    document.querySelectorAll('.attendance-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-attendance-tab')); });
    });
    var ySel = $('attendance-cal-year');
    var mSel = $('attendance-cal-month');
    var srSel = $('attendance-cal-showroom');
    var tSel = $('attendance-cal-team');
    var stSel = $('attendance-cal-status');
    var gmSel = $('attendance-cal-groupmode');
    if (ySel) ySel.addEventListener('change', function () { calState.year = Number(ySel.value); loadAndRenderCalendar(); });
    if (mSel) mSel.addEventListener('change', function () { calState.month = Number(mSel.value); loadAndRenderCalendar(); });
    if (srSel) srSel.addEventListener('change', function () { calState.showroom = srSel.value; loadAndRenderCalendar(); });
    if (tSel) tSel.addEventListener('change', function () { calState.team = tSel.value; loadAndRenderCalendar(); });
    if (stSel) stSel.addEventListener('change', function () { calState.status = stSel.value; updateCalTitle(); renderCalendarGrid(); });
    if (gmSel) gmSel.addEventListener('change', function () { calState.groupMode = gmSel.value; renderCalendarGrid(); });

    var resetBtn = $('attendance-cal-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      var now = new Date();
      calState.year = now.getFullYear();
      calState.month = now.getMonth() + 1;
      calState.status = '';
      calState.groupMode = 'showroom_team';
      calState.collapsed = {};
      if (isAdminUser()) { calState.showroom = ''; calState.team = ''; }
      loadAndRenderCalendar();
    });
    var refreshBtn = $('attendance-cal-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRenderCalendar);

    var collapseAllBtn = $('attendance-cal-collapse-all');
    if (collapseAllBtn) collapseAllBtn.addEventListener('click', function () { collapseAll(true); });
    var expandAllBtn = $('attendance-cal-expand-all');
    if (expandAllBtn) expandAllBtn.addEventListener('click', function () { collapseAll(false); });

    var groups = $('attendance-cal-groups');
    if (groups) groups.addEventListener('click', function (e) {
      var toggle = e.target.closest && e.target.closest('.attendance-cal-group-toggle');
      if (toggle) {
        var key = toggle.getAttribute('data-toggle-group');
        if (!key) return;
        calState.collapsed[key] = !calState.collapsed[key];
        renderCalendarGrid();
        return;
      }
      var td = e.target.closest && e.target.closest('.attendance-cal-cell');
      if (!td) return;
      openDetailModal({
        userId: td.getAttribute('data-user-id'),
        name: td.getAttribute('data-user-name'),
        team: td.getAttribute('data-team'),
        showroom: td.getAttribute('data-showroom'),
        date: td.getAttribute('data-date')
      });
    });

    var closeBtn = $('attendance-detail-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDetailModal);
    var cancelBtn = $('btn-attendance-detail-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeDetailModal);
    var modal = $('attendance-detail-modal');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeDetailModal(); });
    var form = $('form-attendance-detail');
    if (form) form.addEventListener('submit', saveDetail);
    var delBtn = $('btn-attendance-detail-delete');
    if (delBtn) delBtn.addEventListener('click', deleteDetail);
  }

  function init() {
    if (inited) return;
    inited = true;
    var btnIn = $('btn-attendance-checkin');
    var btnOut = $('btn-attendance-checkout');
    if (btnIn) btnIn.addEventListener('click', handleCheckIn);
    if (btnOut) btnOut.addEventListener('click', handleCheckOut);
    initCalendarEvents();
  }

  window.seumAttendance = {
    init: init,
    render: function () { init(); render(); },
    renderCalendar: function () { init(); switchTab('calendar'); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
