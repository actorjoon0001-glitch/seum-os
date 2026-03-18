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

    // 5초 후 자동 닫기
    var autoClose = setTimeout(function () { removeNotif(item); }, 5000);
    item._autoClose = autoClose;

    // 진행바 애니메이션
    var progress = document.createElement('div');
    progress.className = 'seum-notif-progress';
    item.appendChild(progress);

    // 슬라이드인 애니메이션
    requestAnimationFrame(function () {
      item.classList.add('seum-notif-show');
    });
  }

  function removeNotif(item) {
    if (!item || item._removing) return;
    item._removing = true;
    clearTimeout(item._autoClose);
    item.classList.remove('seum-notif-show');
    item.classList.add('seum-notif-hide');
    setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 350);
  }

  // --------------------------------------------------
  // 알림 소리 (Web Audio API)
  // --------------------------------------------------
  function playNotifSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  function handleIncomingNotification(row) {
    var myTeam = '';
    var myRole = '';
    // auth.js 의 현재 직원 팀/역할 정보 가져오기
    if (window.seumAuth && window.seumAuth.currentEmployee) {
      var emp = window.seumAuth.currentEmployee;
      myTeam = emp.team || '';
      myRole = emp.role || '';
    } else if (window.seumAuth && typeof window.seumAuth.getCurrentEmployee === 'function') {
      var emp = window.seumAuth.getCurrentEmployee();
      myTeam = emp ? (emp.team || '') : '';
      myRole = emp ? (emp.role || '') : '';
    }

    var isMasterOrAdmin = (myRole === 'master' || myRole === 'admin');
    var isRecipientTeam = myTeam && row.recipient_team === myTeam;

    if (!isMasterOrAdmin && !isRecipientTeam) return;

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
    // opts: { contractId, customerName, salesPerson, recipientTeam }
    var supabase = window.seumSupabase || null;
    if (!supabase) return;

    var recipientTeam = opts.recipientTeam || '설계';
    var title = '📋 새 계약이 접수되었습니다';
    var body = '고객명: ' + (opts.customerName || '-') + ' · 영업: ' + (opts.salesPerson || '-');

    supabase.from('notifications').insert({
      recipient_team: recipientTeam,
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

      '.seum-notif-progress {',
      '  position: absolute;',
      '  bottom: 0;',
      '  left: 0;',
      '  height: 3px;',
      '  background: #6366f1;',
      '  width: 100%;',
      '  animation: seum-notif-countdown 5s linear forwards;',
      '  border-radius: 0 0 14px 14px;',
      '}',

      '@keyframes seum-notif-countdown {',
      '  from { width: 100%; }',
      '  to   { width: 0%; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // --------------------------------------------------
  // 외부 공개
  // --------------------------------------------------
  window.seumNotifications = {
    init: initNotifications,
    send: sendContractNotification,
    showPopup: showInAppPopup
  };

  // DOM 준비되면 컨테이너 주입 + 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectNotifContainer();
    });
  } else {
    injectNotifContainer();
  }

  // auth 준비 후 구독 시작
  (window.seumAuth && window.seumAuth.authReady || Promise.resolve()).then(function () {
    initNotifications();
  }).catch(function () {});

})();
