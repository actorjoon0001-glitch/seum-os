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
      return !(e.status && e.status !== 'active' && e.status !== 'pending');
    });
    if (isAdminLike()) return emps;
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
    var parts = [];
    if (cur.team) parts.push(cur.team + '팀');
    if (cur.showroom) {
      var label = cur.showroom;
      if (typeof window.getShowroomName === 'function') label = window.getShowroomName(cur.showroom);
      parts.push(label);
    }
    return parts.length ? parts.join(' · ') : '소속 정보 없음';
  }

  function filterOffForMyTeam(all) {
    var cur = currentEmployee();
    if (!cur) return [];
    if (isAdminLike()) return all.slice();
    return all.filter(function (o) {
      if (!o) return false;
      if (cur.team && o.team && o.team !== cur.team) return false;
      if (cur.showroom && o.showroom && o.showroom !== cur.showroom) return false;
      return true;
    });
  }

  // ───────── 상태 ─────────
  var _state = {
    year: null,
    month: null,      // 0-11
    initialized: false
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
  }

  function renderHeader() {
    var label = $('team-off-label');
    if (label) label.textContent = _state.year + '년 ' + (_state.month + 1) + '월';
    var teamEl = $('team-off-team-label');
    if (teamEl) teamEl.textContent = myTeamLabel();
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
    var scoped = filterOffForMyTeam(getAll());
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
  function openModal(dateStr, editId) {
    var modal = $('team-off-modal');
    if (!modal) return;
    $('team-off-date').value = dateStr;
    var dateDisp = $('team-off-date-display');
    if (dateDisp) dateDisp.textContent = dateStr;

    // 팀원 셀렉트 채우기
    var empSel = $('team-off-employee');
    if (empSel) {
      var cur = currentEmployee();
      var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
      var scope = getScopedEmployees();
      empSel.innerHTML = scope.map(function (e) {
        return '<option value="' + escapeHtml(e.id || e.authUserId || '') + '">' + escapeHtml(e.name || '-') + '</option>';
      }).join('');
      // 일반 직원: 본인만 선택 가능 → disabled + 본인으로 고정
      if (!canManageTeam) {
        var myId = cur ? (cur.id || cur.authUserId) : '';
        if (myId) empSel.value = myId;
        empSel.disabled = true;
      } else {
        empSel.disabled = false;
      }
    }

    // 수정 모드 or 등록 모드
    var delBtn = $('team-off-delete');
    var title = $('team-off-modal-title');
    if (editId) {
      var rec = getAll().find(function (o) { return o.id === editId; });
      if (rec) {
        $('team-off-edit-id').value = editId;
        if (empSel) empSel.value = rec.employeeId;
        $('team-off-type').value = rec.type || 'annual';
        $('team-off-memo').value = rec.memo || '';
        if (delBtn) delBtn.classList.remove('hidden');
        if (title) title.textContent = '휴무 수정';
      }
    } else {
      $('team-off-edit-id').value = '';
      $('team-off-type').value = 'annual';
      $('team-off-memo').value = '';
      if (delBtn) delBtn.classList.add('hidden');
      if (title) title.textContent = '휴무 등록';
    }

    renderDayList(dateStr);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var modal = $('team-off-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderDayList(dateStr) {
    var wrap = $('team-off-day-list');
    if (!wrap) return;
    var items = filterOffForMyTeam(getAll()).filter(function (o) { return o.date === dateStr; });
    if (!items.length) {
      wrap.innerHTML = '<p class="team-off-day-empty">해당 날짜에 등록된 휴무가 없습니다.</p>';
      return;
    }
    var cur = currentEmployee();
    var myId = cur ? (cur.id || cur.authUserId) : '';
    var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
    wrap.innerHTML = '<h4 class="team-off-day-title">같은 날 등록된 휴무</h4>' +
      '<ul class="team-off-day-ul">' +
      items.map(function (o) {
        var own = (o.employeeId === myId);
        var canEdit = own || canManageTeam;
        return '<li class="team-off-day-item team-off-type-' + escapeHtml(o.type) + '">' +
          '<span class="team-off-day-type">' + escapeHtml(TYPE_LABEL[o.type] || '기타') + '</span>' +
          '<span class="team-off-day-name">' + escapeHtml(o.employeeName || '-') + '</span>' +
          (o.memo ? '<span class="team-off-day-memo">' + escapeHtml(o.memo) + '</span>' : '') +
          (canEdit
            ? '<button type="button" class="btn btn-sm btn-secondary team-off-edit-btn" data-off-id="' + escapeHtml(o.id) + '">수정</button>'
            : '') +
          '</li>';
      }).join('') +
      '</ul>';
  }

  // ───────── 저장/삭제 ─────────
  function saveEntry(e) {
    e.preventDefault();
    var editId = $('team-off-edit-id').value || '';
    var date = $('team-off-date').value;
    var employeeId = $('team-off-employee').value;
    var type = $('team-off-type').value;
    var memo = ($('team-off-memo').value || '').trim();

    if (!date) { showToast('날짜가 비어있습니다.', 'error'); return; }
    if (!employeeId) { showToast('대상 직원을 선택해 주세요.', 'error'); return; }
    if (!type) { showToast('휴무 유형을 선택해 주세요.', 'error'); return; }

    var cur = currentEmployee();
    var myId = cur ? (cur.id || cur.authUserId) : '';
    var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
    if (!canManageTeam && employeeId !== myId) {
      showToast('본인 휴무만 등록할 수 있습니다.', 'error');
      return;
    }

    // 대상 직원 정보 스냅샷
    var scope = getScopedEmployees();
    var target = scope.find(function (x) { return (x.id || x.authUserId) === employeeId; });
    if (!target) { showToast('대상 직원을 찾을 수 없습니다.', 'error'); return; }

    var list = getAll();
    if (editId) {
      var idx = list.findIndex(function (o) { return o.id === editId; });
      if (idx < 0) { showToast('수정할 항목을 찾을 수 없습니다.', 'error'); return; }
      list[idx] = Object.assign({}, list[idx], {
        employeeId: employeeId,
        employeeName: target.name || '',
        team: target.team || '',
        showroom: target.showroom || '',
        date: date,
        type: type,
        memo: memo,
        updatedAt: new Date().toISOString(),
        updatedBy: myId
      });
    } else {
      // 동일 (employee, date) 중복 방지 — 덮어쓰기
      var dup = list.findIndex(function (o) { return o.employeeId === employeeId && o.date === date; });
      if (dup >= 0) {
        list[dup] = Object.assign({}, list[dup], {
          type: type, memo: memo, updatedAt: new Date().toISOString(), updatedBy: myId
        });
      } else {
        list.push({
          id: genId(),
          employeeId: employeeId,
          employeeName: target.name || '',
          team: target.team || '',
          showroom: target.showroom || '',
          date: date,
          type: type,
          memo: memo,
          createdAt: new Date().toISOString(),
          createdBy: myId
        });
      }
    }

    if (!saveAll(list)) return;
    closeModal();
    render();
    syncDashboardAttendance();
    showToast(editId ? '휴무가 수정됐습니다.' : '휴무가 등록됐습니다.');
  }

  function deleteCurrent() {
    var editId = $('team-off-edit-id').value;
    if (!editId) return;
    if (!window.confirm('이 휴무를 삭제할까요?')) return;
    var list = getAll();
    var rec = list.find(function (o) { return o.id === editId; });
    if (!rec) return;
    var cur = currentEmployee();
    var myId = cur ? (cur.id || cur.authUserId) : '';
    var canManageTeam = isLeaderOfTeam(cur && cur.team, cur && cur.showroom);
    if (!canManageTeam && rec.employeeId !== myId) {
      showToast('본인 휴무만 삭제할 수 있습니다.', 'error');
      return;
    }
    list = list.filter(function (o) { return o.id !== editId; });
    if (!saveAll(list)) return;
    closeModal();
    render();
    syncDashboardAttendance();
    showToast('휴무가 삭제됐습니다.');
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
    var btnToday = $('team-off-today');
    if (btnToday) btnToday.addEventListener('click', function () {
      var d = new Date();
      _state.year = d.getFullYear();
      _state.month = d.getMonth();
      render();
    });

    // 셀 클릭 → 모달
    var grid = $('team-off-grid');
    if (grid) grid.addEventListener('click', function (e) {
      var eventEl = e.target.closest('[data-off-id]');
      if (eventEl) {
        var off = getAll().find(function (o) { return o.id === eventEl.getAttribute('data-off-id'); });
        if (off) openModal(off.date, off.id);
        return;
      }
      var cell = e.target.closest('[data-off-date]');
      if (cell) openModal(cell.getAttribute('data-off-date'), '');
    });

    // 모달
    var modalClose = $('team-off-modal-close');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    var modalCancel = $('team-off-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    var form = $('team-off-form');
    if (form) form.addEventListener('submit', saveEntry);
    var delBtn = $('team-off-delete');
    if (delBtn) delBtn.addEventListener('click', deleteCurrent);
    var modalEl = $('team-off-modal');
    if (modalEl) modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });

    // 모달 내 수정 버튼 (day list)
    var dayList = $('team-off-day-list');
    if (dayList) dayList.addEventListener('click', function (e) {
      var b = e.target.closest('.team-off-edit-btn');
      if (!b) return;
      var id = b.getAttribute('data-off-id');
      var rec = getAll().find(function (o) { return o.id === id; });
      if (rec) openModal(rec.date, rec.id);
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
