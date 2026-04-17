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

  function init() {
    if (inited) return;
    inited = true;
    var btnIn = $('btn-attendance-checkin');
    var btnOut = $('btn-attendance-checkout');
    if (btnIn) btnIn.addEventListener('click', handleCheckIn);
    if (btnOut) btnOut.addEventListener('click', handleCheckOut);
  }

  window.seumAttendance = {
    init: init,
    render: function () { init(); render(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
