/**
 * 세움OS 팀 휴무 캘린더
 *  - 로그인 사용자의 팀 기준으로 팀원 휴무 일정만 표시
 *  - 월간 캘린더 UI, 날짜 클릭 시 등록/수정 팝업
 *  - 로컬 저장 (seum_team_off_days)
 *  - 권한
 *      일반 직원: 본인 일정만 등록/수정/삭제
 *      팀장: 같은 팀 전체 등록/수정/삭제
 *      관리자/마스터: 모든 팀 관리
 *  - 노출: window.seumTeamOff = { render, isOffToday, getTodayOff }
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'seum_team_off_days';

  var TYPE_LABEL = {
    annual: '연차',
    monthly: '월차',
    half_am: '오전 반차',
    half_pm: '오후 반차',
    half: '반차',
    holiday: '공휴일',
    other: '기타'
  };

  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function genId() {
    return 'off-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function showToast(msg, kind) {
    if (window.showToast) return window.showToast(msg, kind);
    console.log('[toast]', kind || 'info', msg);
  }

  // ───────── 데이터 저장/조회 ─────────
  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveAll(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return true; }
    catch (e) { showToast('저장 용량이 초과됐습니다.', 'error'); return false; }
  }

  function _supa() {
    var s = (typeof window !== 'undefined') && (window.seumSupabase || window.supabase);
    return (s && typeof s.from === 'function') ? s : null;
  }

  // 월간 근무 캘린더에서 보이는 휴무들이 팀 휴무 캘린더에도 노출되도록 두 소스에서 합집합:
  //   1) leave_requests (status='approved')        — 신청·승인 워크플로우
  //   2) attendance (status in 휴무 유형들)          — 관리자가 직접 셋팅한 값
  var _leaveCache = {};   // 'YYYY-MM' → 변환된 엔트리 배열

  function fetchMonthLeaves(year, month) {
    var supabase = _supa();
    if (!supabase) return Promise.resolve([]);
    var key = year + '-' + pad(month + 1);
    var first = key + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var last = key + '-' + pad(lastDay);
    return supabase.from('leave_requests')
      .select('id, user_id, type, start_date, end_date, status')
      .eq('status', 'approved')
      .lte('start_date', last)
      .gte('end_date', first)
      .then(function (r) {
        if (r && r.error) { console.warn('[team-off] leave_requests fetch failed:', r.error); return []; }
        var rows = Array.isArray(r && r.data) ? r.data : [];
        console.log('[team-off] leave_requests fetched:', rows.length);
        return rows;
      }, function () { return []; });
  }

  function fetchMonthAttendanceLeaves(year, month) {
    var supabase = _supa();
    if (!supabase) return Promise.resolve([]);
    var key = year + '-' + pad(month + 1);
    var first = key + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var last = key + '-' + pad(lastDay);
    var leaveLikeStatuses = ['vacation', 'sick', 'outside', 'business_trip', 'half_am', 'half_pm'];
    return supabase.from('attendance')
      .select('user_id, user_name, team, showroom, date, status')
      .gte('date', first)
      .lte('date', last)
      .in('status', leaveLikeStatuses)
      .then(function (r) {
        if (r && r.error) { console.warn('[team-off] attendance fetch failed:', r.error); return []; }
        var rows = Array.isArray(r && r.data) ? r.data : [];
        console.log('[team-off] attendance leaves fetched:', rows.length);
        return rows;
      }, function () { return []; });
  }

  function mapLeaveTypeToOff(t) {
    if (t === 'annual') return 'annual';
    if (t === 'half_am') return 'half_am';
    if (t === 'half_pm') return 'half_pm';
    if (t === 'half') return 'half';
    if (t === 'sick' || t === 'outside' || t === 'business_trip') return 'other';
    return 'other';
  }
  function _leaveTypeKo(t) {
    return ({ annual:'연차', half_am:'오전 반차', half_pm:'오후 반차', half:'반차',
              sick:'병가', outside:'외근', business_trip:'출장' })[t] || t;
  }

  function expandLeaveToOffEntries(leaves) {
    if (!leaves || !leaves.length) return [];
    var emps = (typeof window.getEmployees === 'function') ? window.getEmployees() : [];
    var byAuth = {};
    emps.forEach(function (e) { if (e && e.authUserId) byAuth[e.authUserId] = e; });
    var entries = [];
    leaves.forEach(function (lv) {
      var emp = byAuth[lv.user_id];
      if (!emp) return;
      var type = mapLeaveTypeToOff(lv.type);
      var start = new Date(lv.start_date + 'T00:00:00');
      var end = new Date(lv.end_date + 'T00:00:00');
      var memo = '신청 ' + _leaveTypeKo(lv.type);
      for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        var dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        entries.push({
          id: 'leave-' + lv.id + '-' + dateStr,
          employeeId: emp.id,
          employeeName: emp.name || '',
          team: emp.team || '',
          showroom: emp.showroom || '',
          date: dateStr,
          type: type,
          memo: memo,
          __fromLeave: true
        });
      }
    });
    return entries;
  }

  function expandAttendanceToOffEntries(attRows) {
    if (!attRows || !attRows.length) return [];
    var emps = (typeof window.getEmployees === 'function') ? window.getEmployees() : [];
    var byAuth = {};
    emps.forEach(function (e) { if (e && e.authUserId) byAuth[e.authUserId] = e; });
    return attRows.map(function (a) {
      var emp = byAuth[a.user_id] || {};
      var type = mapLeaveTypeToOff(a.status);
      return {
        id: 'att-' + (a.user_id || '') + '-' + (a.date || ''),
        employeeId: emp.id || a.user_id || '',
        employeeName: a.user_name || emp.name || '',
        team: a.team || emp.team || '',
        showroom: a.showroom || emp.showroom || '',
        date: a.date,
        type: type,
        memo: '근태: ' + _leaveTypeKo(a.status),
        __fromAttendance: true
      };
    });
  }

  function getAllWithLeaves() {
    // 로컬 휴무 + 캐시된 월차/연차(승인됨) 합집합. (employeeId, date) 기준 dedup.
    var local = getAll();
    var leaves = [];
    Object.keys(_leaveCache).forEach(function (k) { leaves = leaves.concat(_leaveCache[k]); });
    var seen = {};
    var out = [];
    local.concat(leaves).forEach(function (o) {
      if (!o || !o.date || !o.employeeId) return;
      var key = String(o.employeeId) + '|' + o.date;
      if (seen[key]) return;  // 로컬이 우선 (먼저 들어옴)
      seen[key] = true;
      out.push(o);
    });
    return out;
  }

  // ───────── 권한 ─────────
  function currentEmployee() {
    return (window.seumAuth && window.seumAuth.currentEmployee) || null;
  }
  function isAdminLike() {
    try {
      if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
      if (typeof window.isMaster === 'function' && window.isMaster()) return true;
      if (typeof window.isSuperAdmin === 'function' && window.isSuperAdmin()) return true;
    } catch (e) {}
    return false;
  }
  function isLeaderOfTeam(team, showroom) {
    var cur = currentEmployee();
    if (!cur) return false;
    if (isAdminLike()) return true;
    var role = (cur.role || '').toString().toLowerCase();
    var isLead = role === 'leader' || role === '팀장' || role === 'team_lead' || role === 'manager';
    if (!isLead) return false;
    if (team && cur.team && cur.team !== team) return false;
    if (showroom && (cur.showroom || '') !== showroom) return false;
    return true;
  }

  // ───────── 팀 스코프 ─────────
  function getScopedEmployees() {
    var cur = currentEmployee();
    if (!cur) return [];
    var emps = (typeof window.getEmployees === 'function') ? window.getEmployees() : [];
    emps = emps.filter(function (e) {
      if (!e) return false;
      if (e.status && e.status !== 'active' && e.status !== 'pending' && e.status !== 'approved') return false;
      if (e.id && typeof e.id === 'string' && e.id.indexOf('tw-') === 0) return false;
      return true;
    });
    if (isAdminLike()) {
      // 관리자/마스터: scopeTeamId 가 설정되어 있으면 해당 팀 직원만, 빈 값이면 전체
      var scopedDef = getScopedTeamDef();
      if (scopedDef) {
        return emps.filter(function (e) {
          if (e.team !== scopedDef.team) return false;
          if (scopedDef.showroom && e.showroom && e.showroom !== scopedDef.showroom) return false;
          return true;
        });
      }
      return emps;
    }
    if (!cur.team) return emps.filter(function (e) {
      return (e.id || e.authUserId) === (cur.id || cur.authUserId);
    });
    return emps.filter(function (e) {
      if (e.team !== cur.team) return false;
      // 영업팀 같이 다수 전시장이면 showroom 도 맞아야 같은 팀으로 간주
      if (cur.showroom && e.showroom && cur.showroom !== e.showroom) {
        // 단, 본인 전시장이 비어있지 않은데 상대 전시장이 비어있으면 포함 (본사 직원 공통 소속 가능성)
        return false;
      }
      return true;
    });
  }

  function myTeamLabel() {
    var cur = currentEmployee();
    if (!cur) return '-';
    // 관리자/마스터가 특정 팀을 선택했으면 그 팀 이름, 전체면 '전체 팀'
    if (isAdminLike()) {
      var scoped = getScopedTeamDef();
      return scoped ? scoped.name : '전체 팀';
    }
    var parts = [];
    if (cur.team) parts.push(cur.team + '팀');
    if (cur.showroom) {
      var label = cur.showroom;
      if (typeof window.getShowroomName === 'function') label = window.getShowroomName(cur.showroom);
      parts.push(label);
    }
    return parts.length ? parts.join(' · ') : '소속 정보 없음';
  }

  // 관리자/마스터용 팀 선택 드롭다운 렌더 + 노출
  function renderTeamPicker() {
    var pickerEl = $('team-off-team-picker');
    var selEl = $('team-off-team-select');
    if (!pickerEl || !selEl) return;
    if (!isAdminLike()) {
      pickerEl.classList.add('hidden');
      return;
    }
    pickerEl.classList.remove('hidden');
    var teams = getTeamDefs();
    var html = '<option value="">전체 팀</option>';
    teams.forEach(function (t) {
      html += '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name) + '</option>';
    });
    selEl.innerHTML = html;
    selEl.value = _state.scopeTeamId || '';
  }

  // 팀 정의 조회 (TW_DEFAULT_TEAMS 가 app.js 에 있어 직접 접근 못 함 → window.seumTwTeams 또는 추정)
  function getTeamDefs() {
    // TW_DEFAULT_TEAMS 와 동일한 정의 (팀 휴무는 직원 team/showroom 매칭 기준)
    return [
      { id: 'hq-marketing',    name: '본사 마케팅팀',   team: '마케팅' },
      { id: 'hq-sales',        name: '본사 영업팀',     team: '영업', showroom: 'headquarters' },
      { id: 'hq-design',       name: '본사 설계팀',     team: '설계' },
      { id: 'hq-construction', name: '본사 시공팀',     team: '시공' },
      { id: 'hq-settlement',   name: '본사 정산팀',     team: '정산' },
      { id: 'sr1-sales',       name: '1전시장 영업팀',  team: '영업', showroom: 'showroom1' },
      { id: 'sr3-sales',       name: '3전시장 영업팀',  team: '영업', showroom: 'showroom3' },
      { id: 'sr4-sales',       name: '4전시장 영업팀',  team: '영업', showroom: 'showroom4' },
      { id: 'ganghwa-sales',   name: '강화전시장 영업팀', team: '영업', showroom: 'ganghwa' },
      { id: 'andong-sales',    name: '안동전시장 영업팀', team: '영업', showroom: 'andong' }
    ];
  }

  function filterOffForMyTeam(all) {
    var cur = currentEmployee();
    if (!cur) return [];
    var canViewAll = isAdminLike();

    // 관리자/마스터: scopeTeamId 가 설정되어 있으면 해당 팀만 필터, 빈 값이면 전체
    if (canViewAll) {
      if (!_state.scopeTeamId) return all.slice();
      var teamDef = getTeamDefs().find(function (t) { return t.id === _state.scopeTeamId; });
      if (!teamDef) return all.slice();
      return all.filter(function (o) {
        if (!o) return false;
        if (o.team !== teamDef.team) return false;
        if (teamDef.showroom && o.showroom && o.showroom !== teamDef.showroom) return false;
        return true;
      });
    }

    // 일반 직원: 본인 팀만
    return all.filter(function (o) {
      if (!o) return false;
      if (cur.team && o.team && o.team !== cur.team) return false;
      if (cur.showroom && o.showroom && o.showroom !== cur.showroom) return false;
      return true;
    });
  }

  function getScopedTeamDef() {
    // 관리자/마스터용: 현재 선택된 팀 정의
    if (!_state.scopeTeamId) return null;
    return getTeamDefs().find(function (t) { return t.id === _state.scopeTeamId; }) || null;
  }

  // ───────── 상태 ─────────
  var _state = {
    year: null,
    month: null,      // 0-11
    initialized: false,
    scopeTeamId: ''   // 관리자/마스터용 팀 필터 (빈 값 = 전체 팀)
  };

  function initState() {
    if (_state.year != null) return;
    var d = new Date();
    _state.year = d.getFullYear();
    _state.month = d.getMonth();
  }

  // ───────── 렌더 ─────────
  function render() {
    initState();
    ensureInit();
    renderHeader();
    renderCalendar();
    // 현재 월의 승인된 휴가 신청을 비동기로 가져와 캐시 후 재렌더 — 캘린더에 합쳐 표시
    ensureLeavesForMonth(_state.year, _state.month);
  }

  function ensureLeavesForMonth(year, month) {
    var key = year + '-' + pad(month + 1);
    if (_leaveCache[key] != null) return; // 이미 가져온 적 있으면 패스 (재진입 시 즉시 사용)
    _leaveCache[key] = []; // 동시 다발 fetch 방지용 마커
    Promise.all([
      fetchMonthLeaves(year, month),
      fetchMonthAttendanceLeaves(year, month)
    ]).then(function (results) {
      var leaveEntries = expandLeaveToOffEntries(results[0]);
      var attEntries = expandAttendanceToOffEntries(results[1]);
      _leaveCache[key] = leaveEntries.concat(attEntries);
      console.log('[team-off] cached', _leaveCache[key].length, 'entries for', key);
      renderCalendar();
    });
  }

  function renderHeader() {
    var label = $('team-off-label');
    if (label) label.textContent = _state.year + '년 ' + (_state.month + 1) + '월';
    var teamEl = $('team-off-team-label');
    if (teamEl) teamEl.textContent = myTeamLabel();
    renderTeamPicker();
  }

  function renderCalendar() {
    var grid = $('team-off-grid');
    if (!grid) return;
    var y = _state.year, m = _state.month;
    var first = new Date(y, m, 1);
    var startDay = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var todayStr = todayIso();

    var byDate = {};
    var scoped = filterOffForMyTeam(getAllWithLeaves());
    scoped.forEach(function (o) {
      if (!o.date) return;
      if (!byDate[o.date]) byDate[o.date] = [];
      byDate[o.date].push(o);
    });

    var weekdayNames = ['일','월','화','수','목','금','토'];
    var html = [];
    for (var i = 0; i < 7; i++) {
      var wcls = 'team-off-weekday';
      if (i === 0) wcls += ' sunday';
      if (i === 6) wcls += ' saturday';
      html.push('<div class="' + wcls + '">' + weekdayNames[i] + '</div>');
    }
    for (var p = 0; p < startDay; p++) {
      html.push('<div class="team-off-cell team-off-cell-empty"></div>');
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = y + '-' + pad(m + 1) + '-' + pad(day);
      var items = byDate[dateStr] || [];
      var cls = 'team-off-cell';
      if (dateStr === todayStr) cls += ' today';
      var eventsHtml = items.slice(0, 6).map(function (o) {
        return '<div class="team-off-event team-off-type-' + escapeHtml(o.type) + '" data-off-id="' + escapeHtml(o.id) + '">' +
          '<span class="team-off-event-type">' + escapeHtml(TYPE_LABEL[o.type] || '기타') + '</span>' +
          '<span class="team-off-event-name">' + escapeHtml(o.employeeName || '-') + '</span>' +
          '</div>';
      }).join('');
      if (items.length > 6) {
        eventsHtml += '<div class="team-off-event-more">+' + (items.length - 6) + '명</div>';
      }
      html.push(
        '<div class="' + cls + '" data-off-date="' + dateStr + '" role="button" tabindex="0">' +
        '<div class="team-off-cell-head">' +
          '<span class="team-off-date-num">' + day + '</span>' +
          (items.length ? '<span class="team-off-cell-count">' + items.length + '</span>' : '') +
        '</div>' +
        '<div class="team-off-events">' + eventsHtml + '</div>' +
        '</div>'
      );
    }
    grid.innerHTML = html.join('');
  }

  // ───────── 모달 ─────────
  function openModal(dateStr) {
    var modal = $('team-off-modal');
    if (!modal) return;
    $('team-off-date').value = dateStr;
    var dateDisp = $('team-off-date-display');
    if (dateDisp) dateDisp.textContent = dateStr;
    $('team-off-memo').value = '';
    var title = $('team-off-modal-title');
    if (title) title.textContent = dateStr + ' 휴무 체크';

    buildCheckList(dateStr);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var modal = $('team-off-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  // 직원별 체크 리스트 렌더 — 각 팀원에 대해 checkbox + 유형 select
  // 체크: 해당 날짜에 선택된 유형으로 저장
  // 미체크: 기존 기록 삭제
  // 권한: 본인은 항상 가능 / 팀장·관리자는 같은 팀 전원 / 그 외 직원은 본인 외 체크박스 disabled
  function buildCheckList(dateStr) {
    var listEl = $('team-off-check-list');
    if (!listEl) return;
    var cur = currentEmployee();
    var myId = cur ? (cur.id || cur.authUserId) : '';
    var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
    var scope = getScopedEmployees();
    var existing = {};
    getAll().forEach(function (o) {
      if (o.date === dateStr) existing[o.employeeId] = o;
    });
    if (!scope.length) {
      listEl.innerHTML = '<li class="team-off-check-empty">팀원 정보가 없습니다.</li>';
      return;
    }
    // 본인을 맨 위로, 그 다음 팀장, 그 외 이름순 (이미 sortTeam 적용된 scope 사용)
    scope = scope.slice().sort(function (a, b) {
      var ai = (a.id || a.authUserId) === myId ? 0 : 1;
      var bi = (b.id || b.authUserId) === myId ? 0 : 1;
      if (ai !== bi) return ai - bi;
      return 0;
    });
    listEl.innerHTML = scope.map(function (e) {
      var empId = e.id || e.authUserId || '';
      var isMe = empId === myId;
      var enabled = canManageTeam || isMe;
      var rec = existing[empId];
      var checked = !!rec;
      var type = rec ? rec.type : 'annual';
      var roleLabel = '';
      var role = (e.role || '').toString().toLowerCase();
      if (role === 'leader' || role === '팀장' || role === 'team_lead' || role === 'manager') {
        roleLabel = '<span class="team-off-check-role">팀장</span>';
      }
      return '<li class="team-off-check-item' + (checked ? ' team-off-check-item-on' : '') + '">' +
        '<label class="team-off-check-label">' +
          '<input type="checkbox" class="team-off-check-box" data-off-emp="' + escapeHtml(empId) + '"' +
            (checked ? ' checked' : '') + (enabled ? '' : ' disabled') + '>' +
          '<span class="team-off-check-name">' + escapeHtml(e.name || '-') + '</span>' +
          (isMe ? '<span class="team-off-check-me">나</span>' : '') +
          roleLabel +
        '</label>' +
        '<select class="team-off-check-type" data-off-emp-type="' + escapeHtml(empId) + '"' +
          (enabled && checked ? '' : ' disabled') + '>' +
          '<option value="annual"' + (type==='annual'?' selected':'') + '>연차</option>' +
          '<option value="monthly"' + (type==='monthly'?' selected':'') + '>월차</option>' +
          '<option value="half_am"' + (type==='half_am'?' selected':'') + '>오전 반차</option>' +
          '<option value="half_pm"' + (type==='half_pm'?' selected':'') + '>오후 반차</option>' +
          '<option value="holiday"' + (type==='holiday'?' selected':'') + '>공휴일</option>' +
          '<option value="other"' + (type==='other'?' selected':'') + '>기타</option>' +
        '</select>' +
        '</li>';
    }).join('');
  }

  // ───────── 저장 (체크리스트 diff) ─────────
  // 각 팀원에 대해 checkbox 상태와 기존 레코드를 비교하여
  //   체크됨 & 기존 없음 → 생성
  //   체크됨 & 기존 있음 (type 또는 memo 변경) → 업데이트
  //   체크 해제 & 기존 있음 → 삭제
  function saveEntry(e) {
    e.preventDefault();
    var date = $('team-off-date').value;
    if (!date) { showToast('날짜가 비어있습니다.', 'error'); return; }
    var memo = ($('team-off-memo').value || '').trim();

    var cur = currentEmployee();
    var myId = cur ? (cur.id || cur.authUserId) : '';
    var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
    var scope = getScopedEmployees();
    var existing = {};
    getAll().forEach(function (o) { if (o.date === date) existing[o.employeeId] = o; });

    var list = getAll();
    var created = 0, updated = 0, deleted = 0;
    var now = new Date().toISOString();

    scope.forEach(function (emp) {
      var empId = emp.id || emp.authUserId || '';
      var isMe = empId === myId;
      if (!(canManageTeam || isMe)) return; // 권한 없는 직원 스킵
      var chk = document.querySelector('.team-off-check-box[data-off-emp="' + cssEscape(empId) + '"]');
      var sel = document.querySelector('.team-off-check-type[data-off-emp-type="' + cssEscape(empId) + '"]');
      if (!chk) return;
      var wantOff = chk.checked;
      var type = sel ? sel.value : 'annual';
      var rec = existing[empId];
      if (wantOff && !rec) {
        list.push({
          id: genId(),
          employeeId: empId,
          employeeName: emp.name || '',
          team: emp.team || '',
          showroom: emp.showroom || '',
          date: date,
          type: type,
          memo: memo,
          createdAt: now,
          createdBy: myId
        });
        created++;
      } else if (wantOff && rec) {
        if (rec.type !== type || (rec.memo || '') !== memo) {
          var idx = list.findIndex(function (x) { return x.id === rec.id; });
          if (idx >= 0) {
            list[idx] = Object.assign({}, list[idx], {
              type: type, memo: memo, updatedAt: now, updatedBy: myId
            });
            updated++;
          }
        }
      } else if (!wantOff && rec) {
        list = list.filter(function (x) { return x.id !== rec.id; });
        deleted++;
      }
    });

    if (!saveAll(list)) return;
    closeModal();
    render();
    syncDashboardAttendance();
    var total = created + updated + deleted;
    if (total === 0) {
      showToast('변경 사항이 없습니다.');
    } else {
      var parts = [];
      if (created) parts.push('등록 ' + created);
      if (updated) parts.push('수정 ' + updated);
      if (deleted) parts.push('삭제 ' + deleted);
      showToast(parts.join(' · '));
    }
  }

  // CSS.escape 폴백 — 구형 브라우저 호환
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s);
    return String(s).replace(/["\\]/g, '\\$&');
  }

  // ───────── 대시보드 빠른실행 연동 ─────────
  function getTodayOff() {
    var cur = currentEmployee();
    if (!cur) return null;
    var myId = cur.id || cur.authUserId;
    var today = todayIso();
    return getAll().find(function (o) {
      return o.employeeId === myId && o.date === today;
    }) || null;
  }
  function isOffToday() {
    var o = getTodayOff();
    if (!o) return false;
    // 반차(오전/오후)는 부분 근무이므로 전일 휴무로 간주하지 않음
    if (o.type === 'half_am' || o.type === 'half_pm' || o.type === 'half') return false;
    return true;
  }

  function syncDashboardAttendance() {
    // 출근/퇴근 카드에 휴무 상태 즉시 반영
    if (window.seumAttendance && typeof window.seumAttendance.render === 'function') {
      try { window.seumAttendance.render(); } catch (e) {}
    }
    applyDashboardOffBadge();
  }

  function applyDashboardOffBadge() {
    var off = getTodayOff();
    var hintEl = document.querySelector('.dash-attendance-card .attendance-today-hint');
    var finishedNote = document.querySelector('.dash-attendance-card [data-attendance-finished-note]');
    var btnIn = document.querySelector('.dash-attendance-card [data-attendance-action="checkin"]');
    var btnOut = document.querySelector('.dash-attendance-card [data-attendance-action="checkout"]');
    if (!hintEl) return;

    if (off && isOffToday()) {
      if (hintEl) hintEl.textContent = '오늘은 ' + (TYPE_LABEL[off.type] || '휴무') + ' 일입니다. 출근하지 않아도 됩니다.';
      if (btnIn) btnIn.classList.add('hidden');
      if (btnOut) btnOut.classList.add('hidden');
      if (finishedNote) {
        finishedNote.classList.remove('hidden');
        var textEl = finishedNote.querySelector('.dash-attendance-finished-text');
        if (textEl) textEl.textContent = '오늘은 휴무일입니다';
        var iconEl = finishedNote.querySelector('.dash-attendance-finished-icon');
        if (iconEl) iconEl.textContent = '🌴';
      }
    } else {
      if (finishedNote) {
        var textElR = finishedNote.querySelector('.dash-attendance-finished-text');
        if (textElR) textElR.textContent = '오늘 근무 완료';
        var iconElR = finishedNote.querySelector('.dash-attendance-finished-icon');
        if (iconElR) iconElR.textContent = '✅';
      }
    }
  }

  // ───────── 초기화 (이벤트 바인딩) ─────────
  function ensureInit() {
    if (_state.initialized) return;
    _state.initialized = true;

    // 월 이동
    var btnPrev = $('team-off-prev');
    if (btnPrev) btnPrev.addEventListener('click', function () {
      initState();
      _state.month--;
      if (_state.month < 0) { _state.month = 11; _state.year--; }
      render();
    });
    var btnNext = $('team-off-next');
    if (btnNext) btnNext.addEventListener('click', function () {
      initState();
      _state.month++;
      if (_state.month > 11) { _state.month = 0; _state.year++; }
      render();
    });
    // 관리자/마스터용 팀 필터 변경
    var teamSel = $('team-off-team-select');
    if (teamSel) teamSel.addEventListener('change', function () {
      _state.scopeTeamId = teamSel.value || '';
      render();
    });

    var btnToday = $('team-off-today');
    if (btnToday) btnToday.addEventListener('click', function () {
      var d = new Date();
      _state.year = d.getFullYear();
      _state.month = d.getMonth();
      render();
    });

    // 셀/이벤트 클릭 → 해당 날짜의 직원 체크 모달
    var grid = $('team-off-grid');
    if (grid) grid.addEventListener('click', function (e) {
      var eventEl = e.target.closest('[data-off-id]');
      if (eventEl) {
        var off = getAll().find(function (o) { return o.id === eventEl.getAttribute('data-off-id'); });
        if (off) { openModal(off.date); return; }
      }
      var cell = e.target.closest('[data-off-date]');
      if (cell) openModal(cell.getAttribute('data-off-date'));
    });

    // 모달
    var modalClose = $('team-off-modal-close');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    var modalCancel = $('team-off-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    var form = $('team-off-form');
    if (form) form.addEventListener('submit', saveEntry);
    var modalEl = $('team-off-modal');
    if (modalEl) modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });

    // 체크리스트: checkbox 토글 시 유형 select 활성/비활성 + 행 강조
    var listEl = $('team-off-check-list');
    if (listEl) listEl.addEventListener('change', function (e) {
      var chk = e.target.closest('.team-off-check-box');
      if (!chk) return;
      var empId = chk.getAttribute('data-off-emp');
      var item = chk.closest('.team-off-check-item');
      if (item) item.classList.toggle('team-off-check-item-on', chk.checked);
      if (!empId) return;
      var sel = listEl.querySelector('.team-off-check-type[data-off-emp-type="' + cssEscape(empId) + '"]');
      if (sel) sel.disabled = !chk.checked;
    });
  }

  // 최초 대시보드 진입 시 휴무 배지 반영을 위한 훅
  function hookAttendance() {
    // seumAttendance.render 가 호출된 직후 휴무 배지가 후처리되도록 감쌈
    if (!window.seumAttendance || typeof window.seumAttendance.render !== 'function') return false;
    if (window.seumAttendance.__teamOffWrapped) return true;
    var orig = window.seumAttendance.render;
    window.seumAttendance.render = function () {
      var ret = orig.apply(this, arguments);
      try { applyDashboardOffBadge(); } catch (e) {}
      return ret;
    };
    window.seumAttendance.__teamOffWrapped = true;
    return true;
  }
  function bootstrap() {
    hookAttendance();
    applyDashboardOffBadge();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bootstrap, 100); });
  } else {
    setTimeout(bootstrap, 100);
  }

  window.seumTeamOff = {
    render: render,
    isOffToday: isOffToday,
    getTodayOff: getTodayOff,
    syncDashboard: syncDashboardAttendance
  };
})();
