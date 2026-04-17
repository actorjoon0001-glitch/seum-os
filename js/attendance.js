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
    employees: [],           // 현재 권한으로 볼 수 있는 직원 목록
    records: {},             // key: authUserId + '|' + dateKey → attendance row
    currentCell: null,       // 상세 모달에 표시 중인 셀 정보
  };

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

  function inferCellStatus(rec) {
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
    if (ySel) ySel.value = String(calState.year);
    if (mSel) mSel.value = String(calState.month);
    if (srSel) srSel.value = calState.showroom || '';
    if (tSel) tSel.value = calState.team || '';

    // 권한별 필터 잠금: 팀장=본인 팀/전시장 고정, 일반 직원=필터 숨김
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

  function renderCalendarGrid() {
    var thead = $('attendance-cal-thead');
    var tbody = $('attendance-cal-tbody');
    var empty = $('attendance-cal-empty');
    if (!thead || !tbody) return;
    var days = daysInMonth(calState.year, calState.month);

    // header
    var th = '<tr><th class="attendance-cal-name-col">이름</th><th class="attendance-cal-team-col">팀 / 소속</th>';
    for (var d = 1; d <= days; d++) {
      var weekday = new Date(calState.year, calState.month - 1, d).getDay();
      var wkClass = weekday === 0 ? ' attendance-cal-sun' : (weekday === 6 ? ' attendance-cal-sat' : '');
      th += '<th class="attendance-cal-day' + wkClass + '">' + d + '</th>';
    }
    th += '</tr>';
    thead.innerHTML = th;

    // body
    var rows = calState.employees.slice();
    // 필터 적용 (팀/전시장 선택 시 추가 필터 — 관리자 뷰)
    if (calState.showroom) rows = rows.filter(function (e) { return (e.showroom || '') === calState.showroom; });
    if (calState.team) rows = rows.filter(function (e) { return (e.team || '') === calState.team; });

    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    var html = '';
    rows.forEach(function (emp) {
      html += '<tr>';
      html += '<td class="attendance-cal-name-col" title="' + (emp.name || '') + '">' + (emp.name || '-') + '</td>';
      var teamLabel = (emp.team ? emp.team + '팀' : '-');
      var shLabel = emp.showroom ? (SHOWROOM_LABEL[emp.showroom] || emp.showroom) : '';
      html += '<td class="attendance-cal-team-col"><div class="attendance-cal-team-name">' + teamLabel + '</div>' +
              (shLabel ? '<div class="attendance-cal-team-sub">' + shLabel + '</div>' : '') + '</td>';
      for (var d2 = 1; d2 <= days; d2++) {
        var dateKey = calState.year + '-' + pad2(calState.month) + '-' + pad2(d2);
        var rec = calState.records[emp.auth_user_id + '|' + dateKey] || null;
        var st = inferCellStatus(rec);
        var ch = statusChar(st);
        var lbl = STATUS_LABEL[st] || '미기록';
        html += '<td class="attendance-cal-cell attendance-status-' + st + '" ' +
                'data-user-id="' + emp.auth_user_id + '" ' +
                'data-user-name="' + (emp.name || '').replace(/"/g, '&quot;') + '" ' +
                'data-team="' + (emp.team || '') + '" ' +
                'data-showroom="' + (emp.showroom || '') + '" ' +
                'data-date="' + dateKey + '" ' +
                'title="' + (emp.name || '') + ' / ' + dateKey + ' / ' + lbl + '">' + ch + '</td>';
      }
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  async function loadAndRenderCalendar() {
    populateCalYearSelect();
    syncCalFilters();
    updateCalTitle();
    var body = $('attendance-cal-tbody');
    if (body) body.innerHTML = '<tr><td colspan="33" class="attendance-cal-loading">불러오는 중...</td></tr>';
    var emps = await fetchVisibleEmployees();
    calState.employees = emps;
    var recs = await fetchMonthRecords(calState.year, calState.month, calState.showroom, calState.team);
    calState.records = buildRecordMap(recs);
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
    if (ySel) ySel.addEventListener('change', function () { calState.year = Number(ySel.value); loadAndRenderCalendar(); });
    if (mSel) mSel.addEventListener('change', function () { calState.month = Number(mSel.value); loadAndRenderCalendar(); });
    if (srSel) srSel.addEventListener('change', function () { calState.showroom = srSel.value; loadAndRenderCalendar(); });
    if (tSel) tSel.addEventListener('change', function () { calState.team = tSel.value; loadAndRenderCalendar(); });
    var resetBtn = $('attendance-cal-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      var now = new Date();
      calState.year = now.getFullYear();
      calState.month = now.getMonth() + 1;
      if (isAdminUser()) { calState.showroom = ''; calState.team = ''; }
      loadAndRenderCalendar();
    });
    var refreshBtn = $('attendance-cal-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRenderCalendar);

    var tbody = $('attendance-cal-tbody');
    if (tbody) tbody.addEventListener('click', function (e) {
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
