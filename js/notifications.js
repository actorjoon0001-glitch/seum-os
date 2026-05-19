(function () {
  'use strict';

  // ========================================================
  // 세움 OS - 설계팀 계약 알림 시스템
  // 계약 생성 시 설계팀 전원 컴퓨터에 카카오톡 스타일 팝업 표시
  // ========================================================

  var notifRealtimeSubscribed = false;

  // --------------------------------------------------
  // 브라우저 알림 권한 요청 (OS 레벨 알림)
  // --------------------------------------------------
  function requestBrowserNotifPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // --------------------------------------------------
  // OS 레벨 브라우저 알림 표시
  // --------------------------------------------------
  function showBrowserNotification(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body: body,
        icon: './icons/seum-os-192.png',
        badge: './icons/seum-os-192.png',
        tag: 'seum-contract-' + Date.now(),
        requireInteraction: false
      });
    } catch (e) { /* ignore */ }
  }

  // --------------------------------------------------
  // 카카오톡 스타일 인앱 팝업 (우측 하단)
  // --------------------------------------------------
  function showInAppPopup(title, body, contractId) {
    var container = document.getElementById('seum-notif-container');
    if (!container) return;

    var item = document.createElement('div');
    item.className = 'seum-notif-item';

    var iconEl = document.createElement('div');
    iconEl.className = 'seum-notif-icon';
    iconEl.textContent = '📋';

    var content = document.createElement('div');
    content.className = 'seum-notif-content';

    var titleEl = document.createElement('div');
    titleEl.className = 'seum-notif-title';
    titleEl.textContent = title;

    var bodyEl = document.createElement('div');
    bodyEl.className = 'seum-notif-body';
    bodyEl.textContent = body;

    content.appendChild(titleEl);
    content.appendChild(bodyEl);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'seum-notif-close';
    closeBtn.textContent = '×';
    closeBtn.title = '닫기';

    item.appendChild(iconEl);
    item.appendChild(content);
    item.appendChild(closeBtn);
    container.appendChild(item);

    // 클릭 시 해당 계약 채팅 열기
    if (contractId) {
      content.style.cursor = 'pointer';
      content.addEventListener('click', function () {
        if (typeof window.openContractChatModal === 'function') {
          window.openContractChatModal(contractId);
        }
        removeNotif(item);
      });
    }

    // 닫기 버튼
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeNotif(item);
    });

    // 슬라이드인 애니메이션
    requestAnimationFrame(function () {
      item.classList.add('seum-notif-show');
    });
  }

  function removeNotif(item) {
    if (!item || item._removing) return;
    item._removing = true;
    item.classList.remove('seum-notif-show');
    item.classList.add('seum-notif-hide');
    setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 350);
  }

  // --------------------------------------------------
  // 알림 소리 (Web Audio API)
  // 브라우저 자동재생 차단 우회: 첫 클릭 시 AudioContext 미리 unlock
  // --------------------------------------------------
  var _audioCtx = null;

  function getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    return _audioCtx;
  }

  function unlockAudio() {
    try {
      var ctx = getAudioCtx();
      // 무음 버퍼 재생으로 unlock
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) { /* ignore */ }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  }

  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  function playNotifSound() {
    try {
      var ctx = getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* ignore */ }
  }

  // --------------------------------------------------
  // 알림 표시 메인 함수
  // --------------------------------------------------
  // 동일 이벤트(같은 title+body+contract_id)가 여러 행으로 들어와도 한 번만 띄우기.
  // 예: 해영 건축사 업로드 1건 = 설계/시공 두 팀에 각각 행이 들어가는데,
  //     관리자/master 권한은 두 행 모두 매칭되어 팝업이 두 번 떴음.
  //     이 dedup 로직으로 5초 이내 동일 알림은 1회만 표시.
  var _recentNotifKeys = {};
  function _shouldDedup(row) {
    try {
      var key = String(row.title || '') + '|' + String(row.body || '') + '|' + String(row.contract_id || '');
      var now = Date.now();
      var last = _recentNotifKeys[key] || 0;
      _recentNotifKeys[key] = now;
      // 메모리 누수 방지: 100개 넘으면 오래된 것부터 정리
      var keys = Object.keys(_recentNotifKeys);
      if (keys.length > 100) {
        keys.sort(function (a, b) { return _recentNotifKeys[a] - _recentNotifKeys[b]; });
        for (var i = 0; i < keys.length - 50; i++) delete _recentNotifKeys[keys[i]];
      }
      return (now - last) < 5000;
    } catch (e) { return false; }
  }

  function handleIncomingNotification(row) {
    var myTeam = '';
    var myRole = '';
    var myName = '';
    var myPermission = '';
    // auth.js 의 현재 직원 팀/역할/이름 정보 가져오기
    if (window.seumAuth && window.seumAuth.currentEmployee) {
      var emp = window.seumAuth.currentEmployee;
      myTeam = emp.team || '';
      myRole = emp.role || '';
      myName = emp.name || '';
      myPermission = emp.permission || '';
    } else if (window.seumAuth && typeof window.seumAuth.getCurrentEmployee === 'function') {
      var emp = window.seumAuth.getCurrentEmployee();
      myTeam = emp ? (emp.team || '') : '';
      myRole = emp ? (emp.role || '') : '';
      myName = emp ? (emp.name || '') : '';
      myPermission = emp ? (emp.permission || '') : '';
    }

    var isMasterOrAdmin = (myRole === 'master' || myRole === 'admin'
                           || myPermission === 'master' || myPermission === 'admin' || myPermission === 'superadmin');
    var isRecipientTeam = myTeam && row.recipient_team === myTeam;
    // 개인 지정 수신자(row.recipient_name) 가 내 이름과 일치하면 알림 수신
    var isRecipientName = myName && row.recipient_name && row.recipient_name === myName;

    if (!isMasterOrAdmin && !isRecipientTeam && !isRecipientName) return;

    // 같은 이벤트가 여러 팀 행으로 들어와 중복 팝업이 뜨는 것 차단 (관리자가 주 대상)
    if (_shouldDedup(row)) return;

    var title = row.title || '새 알림';
    var body = row.body || '';

    showInAppPopup(title, body, row.contract_id);
    showBrowserNotification(title, body);
    playNotifSound();
  }

  // --------------------------------------------------
  // Supabase Realtime 구독
  // --------------------------------------------------
  function subscribeNotifications() {
    var supabase = window.seumSupabase || null;
    if (!supabase || notifRealtimeSubscribed) return;
    notifRealtimeSubscribed = true;

    supabase.channel('seum-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        function (payload) {
          if (payload && payload.new) {
            handleIncomingNotification(payload.new);
          }
        }
      )
      .subscribe();
  }

  // --------------------------------------------------
  // 알림 전송 함수 (계약 생성한 쪽에서 호출)
  // --------------------------------------------------
  function sendContractNotification(opts) {
    // opts: { contractId, customerName, salesPerson, recipientTeam, recipientName, title, body }
    var supabase = window.seumSupabase || null;
    if (!supabase) return;

    var recipientTeam = opts.recipientTeam || '설계';
    var title = opts.title || '📋 새 계약이 접수되었습니다';
    var body = opts.body || ('고객명: ' + (opts.customerName || '-') + ' · 영업: ' + (opts.salesPerson || '-'));

    supabase.from('notifications').insert({
      recipient_team: recipientTeam || null,
      recipient_name: opts.recipientName || null,
      title: title,
      body: body,
      contract_id: opts.contractId || null,
      customer_name: opts.customerName || null,
      created_by_name: opts.salesPerson || null
    }).then(function (res) {
      if (res.error) console.warn('[알림] 전송 실패:', res.error.message);
    });
  }

  // --------------------------------------------------
  // 초기화 (로그인 완료 후 호출)
  // --------------------------------------------------
  function initNotifications() {
    requestBrowserNotifPermission();
    subscribeNotifications();
  }

  // --------------------------------------------------
  // 컨테이너 DOM 주입 + 스타일
  // --------------------------------------------------
  function injectNotifContainer() {
    if (document.getElementById('seum-notif-container')) return;

    var container = document.createElement('div');
    container.id = 'seum-notif-container';
    document.body.appendChild(container);

    var style = document.createElement('style');
    style.textContent = [
      '#seum-notif-container {',
      '  position: fixed;',
      '  bottom: 24px;',
      '  right: 24px;',
      '  z-index: 99999;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 10px;',
      '  pointer-events: none;',
      '}',

      '.seum-notif-item {',
      '  pointer-events: all;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  gap: 12px;',
      '  background: #1e293b;',
      '  border: 1px solid #334155;',
      '  border-left: 4px solid #6366f1;',
      '  border-radius: 14px;',
      '  padding: 14px 16px;',
      '  min-width: 300px;',
      '  max-width: 360px;',
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.45);',
      '  position: relative;',
      '  overflow: hidden;',
      '  transform: translateX(120%);',
      '  opacity: 0;',
      '  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;',
      '}',

      '.seum-notif-item.seum-notif-show {',
      '  transform: translateX(0);',
      '  opacity: 1;',
      '}',

      '.seum-notif-item.seum-notif-hide {',
      '  transform: translateX(120%);',
      '  opacity: 0;',
      '}',

      '.seum-notif-icon {',
      '  font-size: 22px;',
      '  flex-shrink: 0;',
      '  margin-top: 1px;',
      '}',

      '.seum-notif-content {',
      '  flex: 1;',
      '  min-width: 0;',
      '}',

      '.seum-notif-title {',
      '  font-size: 13px;',
      '  font-weight: 700;',
      '  color: #f1f5f9;',
      '  margin-bottom: 4px;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',

      '.seum-notif-body {',
      '  font-size: 12px;',
      '  color: #94a3b8;',
      '  line-height: 1.5;',
      '}',

      '.seum-notif-close {',
      '  flex-shrink: 0;',
      '  background: none;',
      '  border: none;',
      '  color: #64748b;',
      '  font-size: 18px;',
      '  cursor: pointer;',
      '  line-height: 1;',
      '  padding: 0 2px;',
      '  margin-top: -2px;',
      '  transition: color 0.2s;',
      '}',

      '.seum-notif-close:hover { color: #f1f5f9; }',

      '@keyframes seum-notif-fadein { from { opacity: 0; } to { opacity: 1; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // --------------------------------------------------
  // 17:30 퇴근 30분 전 — 팀 업무일지 작성 리마인더
  // 매분 검사하여 17:30~17:35 평일에 한 번만 발송 (사용자별 localStorage 로 중복 방지).
  // 모든 로그인 직원이 동일 시간에 자동으로 받음.
  // --------------------------------------------------
  var CLOCKOUT_REMINDER_KEY = 'seum_last_clockout_reminder';
  function _todayKeyKst() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function fireClockOutReminderIfDue() {
    try {
      var emp = window.seumAuth && window.seumAuth.currentEmployee;
      if (!emp) return; // 로그인 상태에서만 발송
      var now = new Date();
      var hh = now.getHours();
      var mm = now.getMinutes();
      // 17:30 ~ 17:35 윈도우 (브라우저를 17:30 직전~직후에 열어도 안전 발송)
      if (hh !== 17) return;
      if (mm < 30 || mm > 35) return;
      // 평일만 (0=일, 6=토)
      var dow = now.getDay();
      if (dow === 0 || dow === 6) return;
      var key = _todayKeyKst();
      if (localStorage.getItem(CLOCKOUT_REMINDER_KEY) === key) return;
      localStorage.setItem(CLOCKOUT_REMINDER_KEY, key);

      var title = '⏰ 퇴근 30분 전 알림';
      var body = '오후 5시 30분, 퇴근 30분 전 입니다.\n퇴근 전 팀 업무일지를 작성해주세요.';
      // 인앱 토스트 (계약 알림과 동일 스타일)
      try { showInAppPopup(title, body, null); } catch (_) {}
      // OS 브라우저 알림 (다른 탭/최소화 상태에서도 표시)
      try { showBrowserNotification(title, body); } catch (_) {}
      // 알림 사운드
      try { playNotifSound(); } catch (_) {}
    } catch (e) {
      console.warn('[clockout-reminder] failed:', e);
    }
  }
  function startClockOutReminderScheduler() {
    // 페이지 진입 직후 1회 + 매분 검사
    setTimeout(fireClockOutReminderIfDue, 5000);
    setInterval(fireClockOutReminderIfDue, 60 * 1000);
  }

  // --------------------------------------------------
  // 외부 공개
  // --------------------------------------------------
  window.seumNotifications = {
    init: initNotifications,
    send: sendContractNotification,
    showPopup: showInAppPopup,
    triggerClockOutReminder: fireClockOutReminderIfDue  // 디버그/테스트용
  };

  // DOM 준비되면 컨테이너 주입 + 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectNotifContainer();
    });
  } else {
    injectNotifContainer();
  }

  // auth 준비 후 구독 시작 + 퇴근 리마인더 스케줄러 가동
  (window.seumAuth && window.seumAuth.authReady || Promise.resolve()).then(function () {
    initNotifications();
    startClockOutReminderScheduler();
  }).catch(function () {});

})();
