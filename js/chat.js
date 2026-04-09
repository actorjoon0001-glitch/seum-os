(function () {
  'use strict';
  /* Chat data and logic. Supabase DB + Realtime. Depends on window.getContracts, window.seumAuth, window.isAdmin (set by app.js). */

  var STORAGE_CHAT_LAST_READ = 'seum_chat_last_read';
  var STORAGE_CONTRACT_CHAT_READ = 'seum_chat_contract_read';

  var CHAT_CHANNELS = ['admin_request', 'all', 'headquarters', 'showroom1', 'showroom3', 'showroom4', 'ganghwa'];
  var CHAT_CHANNEL_LABELS = { admin_request: '관리자 요청', all: '전체 협업', headquarters: '본사 전시장', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장', ganghwa: '강화전시장' };
  var ADMIN_REQUEST_CHANNEL = 'admin_request';
  // 관리자 요청 채널에서 관리자 답변임을 구분하기 위한 sender_team 마커
  var ADMIN_REQUEST_ADMIN_TEAM_MARKER = '__admin_request_admin__';
  // 요청 상태 접두사 — 사용자 요청 본문 앞에 [상태:요청] 형태로 저장
  var ADMIN_REQUEST_STATUS_RE = /^\[상태:(요청|진행중|완료)\]\s*/;

  /** in-memory cache: channel -> list of UI-format messages */
  var teamChatCache = {};
  /** in-memory cache: contractId -> list of UI-format messages */
  var contractChatCache = {};
  var teamRealtimeSubscribed = false;
  var contractRealtimeSubscribed = false;

  function getSupabase() {
    return typeof window !== 'undefined' && window.seumSupabase;
  }

  function getCurrentChatUser() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return { id: 'guest', name: '비로그인', team: '' };
    return {
      id: cur.id || cur.email || cur.name || 'user',
      name: cur.name || cur.email || '직원',
      team: (cur.team || '').trim()
    };
  }

  /** DB row -> UI format (team) */
  function rowToUiTeam(row) {
    if (!row) return null;
    return {
      id: row.id,
      channel: row.channel,
      type: 'user',
      userId: row.sender_id,
      userName: row.sender_name,
      team: row.sender_team || '',
      at: row.created_at,
      message_type: row.message_type || 'text',
      text: row.message || '',
      file_url: row.file_url || '',
      file_name: row.file_name || '',
      is_pinned: !!row.is_pinned,
      is_deleted: !!row.is_deleted,
      pinned_at: row.pinned_at || null,
      pinned_by: row.pinned_by || null,
      deleted_at: row.deleted_at || null,
      deleted_by: row.deleted_by || null
    };
  }

  /** UI msg -> DB row (team) */
  function msgToRowTeam(channel, msg) {
    return {
      channel: channel,
      sender_id: (msg && msg.userId) || getCurrentChatUser().id,
      sender_name: (msg && msg.userName) || getCurrentChatUser().name,
      sender_team: (msg && msg.team) || getCurrentChatUser().team || '',
      message_type: (msg && msg.message_type) || 'text',
      message: (msg && msg.text) || '',
      file_url: (msg && msg.file_url) || null,
      file_name: (msg && msg.file_name) || null
    };
  }

  /** DB row -> UI format (contract) */
  function rowToUiContract(row) {
    if (!row) return null;
    return {
      id: row.id,
      contract_id: row.contract_id,
      sender_id: row.sender_id,
      sender_name: row.sender_name || '',
      message: row.message || '',
      created_at: row.created_at,
      type: row.type || 'user',
      is_pinned: !!row.is_pinned,
      is_deleted: !!row.is_deleted,
      pinned_at: row.pinned_at || null,
      pinned_by: row.pinned_by || null,
      deleted_at: row.deleted_at || null,
      deleted_by: row.deleted_by || null
    };
  }

  /** UI msg -> DB row (contract) */
  function msgToRowContract(contractId, msg) {
    return {
      contract_id: contractId,
      sender_id: (msg && msg.sender_id) || getCurrentChatUser().id,
      sender_name: (msg && msg.sender_name) || getCurrentChatUser().name,
      message: (msg && msg.message) || '',
      type: (msg && msg.type) || 'user'
    };
  }

  /** 관리자 요청 채널 메시지를 현재 사용자 기준으로 필터링
   *  - 관리자/마스터: 모든 메시지 노출
   *  - 일반 사용자: 본인이 올린 메시지 + 관리자 답변(sender_team 마커) 만 노출
   *
   *  "본인 메시지" 매칭은 여러 식별자를 OR 로 비교. getCurrentChatUser() 가
   *  세션 타이밍에 따라 id/email/name 중 다른 값을 돌려주는 경우에도
   *  본인 메시지가 누락되지 않도록 방어적으로 처리.
   */
  /** 관리자 답변 메시지 여부 + 타깃 사용자 ID 추출 헬퍼
   *  반환: { isAdminReply: bool, targetUserId: string|null }
   *  - 기존형 마커 '__admin_request_admin__' 는 타깃 없음 (레거시)
   *  - 신규형 마커 '__admin_request_admin__:<target_id>' 는 타깃 있음
   */
  function parseAdminReplyMarker(team) {
    if (!team || typeof team !== 'string') return { isAdminReply: false, targetUserId: null };
    if (team === ADMIN_REQUEST_ADMIN_TEAM_MARKER) {
      return { isAdminReply: true, targetUserId: null };
    }
    var prefix = ADMIN_REQUEST_ADMIN_TEAM_MARKER + ':';
    if (team.indexOf(prefix) === 0) {
      return { isAdminReply: true, targetUserId: team.substring(prefix.length) };
    }
    return { isAdminReply: false, targetUserId: null };
  }

  function filterAdminRequestMessages(messages) {
    if (!Array.isArray(messages) || !messages.length) return [];
    var isAdminUser = (typeof window.isAdmin === 'function' && window.isAdmin()) ||
                      (typeof window.isMaster === 'function' && window.isMaster());
    if (isAdminUser) return messages.slice();
    var me = getCurrentChatUser();
    var cur = (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) || null;
    var identities = [];
    function pushId(v) { if (v != null && v !== '' && identities.indexOf(v) === -1) identities.push(v); }
    pushId(me && me.id);
    pushId(cur && cur.id);
    pushId(cur && cur.authUserId);
    pushId(cur && cur.email);
    var myName = (me && me.name) || (cur && cur.name) || '';

    // 1 패스: 레거시 무타깃 관리자 답변의 inferred target 계산
    //   = 그 답변 바로 앞에 있던 일반 사용자 메시지의 sender_id
    // (오래된 PR #157 ~ #158 시절 관리자가 보낸 답변이 여기에 해당)
    var legacyInferredTarget = {};
    var lastNonAdminUserId = null;
    for (var i = 0; i < messages.length; i++) {
      var mm = messages[i];
      if (!mm) continue;
      var info = parseAdminReplyMarker(mm.team);
      if (info.isAdminReply && !info.targetUserId) {
        legacyInferredTarget[mm.id || ('idx_' + i)] = lastNonAdminUserId;
      } else if (!info.isAdminReply) {
        lastNonAdminUserId = mm.userId;
      }
    }

    // 2 패스: 실제 필터링
    var result = messages.filter(function (m, i) {
      if (!m) return false;
      var info = parseAdminReplyMarker(m.team);
      if (info.isAdminReply) {
        // 타깃이 명시돼 있으면 그 기준으로, 없으면 inferred 기준으로
        var target = info.targetUserId || legacyInferredTarget[m.id || ('idx_' + i)];
        if (!target) return false; // 타깃 없는 고아 답변 → 비노출
        return identities.indexOf(target) !== -1;
      }
      // 본인 메시지 매칭: sender_id 를 여러 식별자와 OR 비교
      if (m.userId && identities.indexOf(m.userId) !== -1) return true;
      // 동일 이름 매칭 (email/id 가 바뀌었을 때 안전망)
      if (myName && m.userName && m.userName === myName) return true;
      return false;
    });
    // 디버그 로그
    try {
      console.log('[admin_request filter]', {
        totalMessages: messages.length,
        shownToUser: result.length,
        identities: identities,
        myName: myName
      });
    } catch (e) {}
    return result;
  }

  function getChatStore() {
    var data = {};
    CHAT_CHANNELS.forEach(function (ch) {
      var list = teamChatCache[ch] ? teamChatCache[ch].slice() : [];
      if (ch === ADMIN_REQUEST_CHANNEL) {
        list = filterAdminRequestMessages(list);
      }
      data[ch] = list;
    });
    return data;
  }

  function getChatLastRead() {
    try {
      var raw = localStorage.getItem(STORAGE_CHAT_LAST_READ);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function setChatLastRead(channel, lastReadAt) {
    var at = lastReadAt || new Date().toISOString();
    var data = getChatLastRead();
    data[channel] = at;
    try {
      localStorage.setItem(STORAGE_CHAT_LAST_READ, JSON.stringify(data));
    } catch (e) {}
  }

  function getChatUnreadCount(channel) {
    var messages = teamChatCache[channel] || [];
    if (channel === ADMIN_REQUEST_CHANNEL) {
      messages = filterAdminRequestMessages(messages);
    }
    var lastRead = getChatLastRead();
    var since = lastRead[channel] || '';
    if (!since) return messages.filter(function (m) { return !m.is_deleted; }).length;
    return messages.filter(function (m) { return m.at && m.at > since && !m.is_deleted; }).length;
  }

  function updateChatTabBadges() {
    document.querySelectorAll('.chat-tab[data-channel]').forEach(function (btn) {
      var ch = btn.getAttribute('data-channel');
      var badge = btn.querySelector('.chat-tab-unread');
      if (!badge) return;
      var n = getChatUnreadCount(ch);
      badge.textContent = n;
      badge.classList.toggle('hidden', n <= 0);
    });
  }

  function saveChatMessage(channel, msg) {
    console.log('[chat] saveChatMessage channel=', channel, 'msg=', msg);
    var supabase = getSupabase();
    if (!supabase) {
      console.error('[chat] Supabase 미연결 — 메시지 저장 불가');
      try { window.alert('채팅 서버 연결이 끊겼습니다. 페이지를 새로고침 해주세요.'); } catch (e) {}
      return;
    }
    var row = msgToRowTeam(channel, msg);
    // 관리자 요청 채널에서 관리자가 보내는 경우 sender_team 에 마커 + 타깃 ID 저장
    // 형식: __admin_request_admin__:<target_user_id>
    // 렌더/필터 시 타깃이 현재 사용자와 일치할 때만 노출되어 1:1 프라이버시 유지
    if (channel === ADMIN_REQUEST_CHANNEL) {
      var isAdminUser = (typeof window.isAdmin === 'function' && window.isAdmin()) ||
                        (typeof window.isMaster === 'function' && window.isMaster());
      if (isAdminUser) {
        // 같은 채널의 "가장 최근 일반 사용자 메시지"의 sender_id 를 타깃으로 사용
        var cache = teamChatCache[ADMIN_REQUEST_CHANNEL] || [];
        var targetId = null;
        for (var i = cache.length - 1; i >= 0; i--) {
          var cm = cache[i];
          if (!cm) continue;
          var cmTeam = cm.team || '';
          var cmIsAdminReply = cmTeam === ADMIN_REQUEST_ADMIN_TEAM_MARKER ||
                               cmTeam.indexOf(ADMIN_REQUEST_ADMIN_TEAM_MARKER + ':') === 0;
          if (!cmIsAdminReply && cm.userId) {
            targetId = cm.userId;
            break;
          }
        }
        row.sender_team = targetId
          ? (ADMIN_REQUEST_ADMIN_TEAM_MARKER + ':' + targetId)
          : ADMIN_REQUEST_ADMIN_TEAM_MARKER;
      }
    }
    console.log('[chat] insert row=', row);
    supabase.from('team_chat_messages').insert(row).select().single()
      .then(function (res) {
        // Supabase는 에러를 res.error 로 반환하기도 함 (reject 없이)
        if (res && res.error) {
          console.error('[chat] team_chat_messages insert error', res.error, 'row=', row);
          try {
            window.alert('메시지 전송 실패: ' + (res.error.message || res.error.code || '알 수 없는 오류') +
              '\n\n' + (row ? '채널: ' + row.channel : ''));
          } catch (e) {}
          return;
        }
        if (res && res.data) {
          var ui = rowToUiTeam(res.data);
          if (!teamChatCache[channel]) teamChatCache[channel] = [];
          if (!teamChatCache[channel].some(function (m) { return m.id === ui.id; })) {
            teamChatCache[channel].push(ui);
          }
          if (typeof window.renderChatMessageList === 'function') window.renderChatMessageList(channel);
          if (typeof window.setChatLastRead === 'function') window.setChatLastRead(channel, ui.at);
          if (typeof window.updateChatTabBadges === 'function') window.updateChatTabBadges();
          if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
          return;
        }
        // res 객체는 있는데 data/error 둘 다 없는 이상 케이스
        console.warn('[chat] team_chat_messages insert: no data, no error', res);
      })
      .catch(function (err) {
        console.error('[chat] team_chat_messages insert promise rejected', err, 'row=', row);
        try {
          window.alert('메시지 전송 실패: ' + (err && (err.message || err.code || String(err)) || '알 수 없는 오류'));
        } catch (e) {}
      });
  }

  function deleteChatMessage(channel, messageId) {
    var supabase = getSupabase();
    var me = getCurrentChatUser();
    if (supabase) {
      supabase.from('team_chat_messages').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: me.id
      }).eq('id', messageId).eq('channel', channel).then(function () {
        var list = teamChatCache[channel];
        if (list) {
          var m = list.find(function (x) { return x.id === messageId; });
          if (m) {
            m.is_deleted = true;
            m.deleted_at = new Date().toISOString();
            m.deleted_by = me.id;
          }
        }
        if (typeof window.renderChatMessageList === 'function') window.renderChatMessageList(channel);
      }).catch(function (err) { console.error('team_chat delete failed', err); });
    }
  }

  function canPinChatMessage() {
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.isMaster === 'function' && window.isMaster()) return true;
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var role = (cur && cur.role || '').toString().toLowerCase();
    return role === 'leader' || role === '팀장' || role === 'team_lead';
  }

  function getPinnedMessages(channel) {
    var list = (teamChatCache[channel] || []).filter(function (m) { return m.is_pinned && !m.is_deleted && m.type !== 'system'; });
    list.sort(function (a, b) { return (a.pinned_at || '').localeCompare(b.pinned_at || ''); });
    return list.slice(0, 5);
  }

  function pinChatMessage(channel, messageId) {
    var supabase = getSupabase();
    var list = teamChatCache[channel];
    if (!list) return;
    var msg = list.find(function (m) { return m.id === messageId; });
    if (!msg) return;
    var me = getCurrentChatUser();
    var nextPinned = !msg.is_pinned;
    if (nextPinned) {
      var pinned = getPinnedMessages(channel);
      if (pinned.length >= 5) {
        var oldest = pinned[0];
        supabase.from('team_chat_messages').update({ is_pinned: false, pinned_at: null, pinned_by: null }).eq('id', oldest.id).eq('channel', channel).then(function () {
          var o = list.find(function (m) { return m.id === oldest.id; });
          if (o) { o.is_pinned = false; o.pinned_at = null; o.pinned_by = null; }
        });
      }
    }
    var payload = nextPinned
      ? { is_pinned: true, pinned_at: new Date().toISOString(), pinned_by: me.id }
      : { is_pinned: false, pinned_at: null, pinned_by: null };
    if (supabase) {
      supabase.from('team_chat_messages').update(payload).eq('id', messageId).eq('channel', channel).then(function () {
        msg.is_pinned = nextPinned;
        msg.pinned_at = nextPinned ? payload.pinned_at : null;
        msg.pinned_by = nextPinned ? payload.pinned_by : null;
        if (typeof window.renderChatMessageList === 'function') window.renderChatMessageList(channel);
      }).catch(function (err) { console.error('team_chat pin failed', err); });
    }
  }

  function getContractChatStore() {
    return contractChatCache;
  }

  function getContractChatReadStatus(contractId) {
    try {
      var raw = localStorage.getItem(STORAGE_CONTRACT_CHAT_READ);
      var data = raw ? JSON.parse(raw) : {};
      var me = getCurrentChatUser();
      var userId = (me && me.id) ? String(me.id) : 'guest';
      var userData = data[userId];
      if (!userData || !userData[contractId]) return { last_read_message_id: null, updated_at: null };
      return userData[contractId];
    } catch (e) {
      return { last_read_message_id: null, updated_at: null };
    }
  }

  function setContractChatReadStatus(contractId, lastReadMessageId) {
    if (!contractId) return;
    var me = getCurrentChatUser();
    var userId = (me && me.id) ? String(me.id) : 'guest';
    try {
      var raw = localStorage.getItem(STORAGE_CONTRACT_CHAT_READ);
      var data = raw ? JSON.parse(raw) : {};
      if (!data[userId]) data[userId] = {};
      data[userId][contractId] = {
        last_read_message_id: lastReadMessageId || null,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_CONTRACT_CHAT_READ, JSON.stringify(data));
    } catch (e) {}
  }

  function getContractChatMessages(contractId) {
    if (!contractId) return [];
    return contractChatCache[contractId] ? contractChatCache[contractId].slice() : [];
  }

  function getContractChatUnreadCount(contractId) {
    var messages = getContractChatMessages(contractId);
    var list = messages.filter(function (m) { return m.type !== 'system'; });
    if (list.length === 0) return 0;
    list.sort(function (a, b) {
      var ta = (a.created_at || '').toString();
      var tb = (b.created_at || '').toString();
      return ta.localeCompare(tb);
    });
    var status = getContractChatReadStatus(contractId);
    var lastId = status.last_read_message_id;
    if (!lastId) return list.length;
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === lastId) { idx = i; break; }
    }
    if (idx === -1) return list.length;
    return list.length - idx - 1;
  }

  function saveContractChatMessage(contractId, msg) {
    if (!contractId) return;
    var supabase = getSupabase();
    if (!supabase) return;
    var row = msgToRowContract(contractId, msg);
    supabase.from('contract_chat_messages').insert(row).select().single()
      .then(function (res) {
        if (res && res.data) {
          var ui = rowToUiContract(res.data);
          if (!contractChatCache[contractId]) contractChatCache[contractId] = [];
          if (!contractChatCache[contractId].some(function (m) { return m.id === ui.id; })) {
            contractChatCache[contractId].push(ui);
          }
          if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'chat-message-list');
          if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'modal-contract-chat-message-list');
          if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
        }
      })
      .catch(function (err) {
        console.error('contract_chat_messages insert failed', err);
      });
  }

  function getContractPinnedMessages(contractId) {
    var messages = getContractChatMessages(contractId) || [];
    var list = messages.filter(function (m) { return m.is_pinned && !m.is_deleted && m.type !== 'system'; });
    list.sort(function (a, b) { return (a.pinned_at || '').localeCompare(b.pinned_at || ''); });
    return list.slice(0, 5);
  }

  function pinContractChatMessage(contractId, messageId) {
    var supabase = getSupabase();
    var list = contractChatCache[contractId];
    if (!list) return;
    var msg = list.find(function (m) { return m.id === messageId; });
    if (!msg) return;
    var me = getCurrentChatUser();
    var nextPinned = !msg.is_pinned;
    if (nextPinned) {
      var pinned = getContractPinnedMessages(contractId);
      if (pinned.length >= 5) {
        var oldest = pinned[0];
        if (supabase) {
          supabase.from('contract_chat_messages').update({ is_pinned: false, pinned_at: null, pinned_by: null }).eq('id', oldest.id).eq('contract_id', contractId).then(function () {
            var o = list.find(function (m) { return m.id === oldest.id; });
            if (o) { o.is_pinned = false; o.pinned_at = null; o.pinned_by = null; }
          });
        }
      }
    }
    var payload = nextPinned
      ? { is_pinned: true, pinned_at: new Date().toISOString(), pinned_by: me.id }
      : { is_pinned: false, pinned_at: null, pinned_by: null };
    if (supabase) {
      supabase.from('contract_chat_messages').update(payload).eq('id', messageId).eq('contract_id', contractId).then(function () {
        msg.is_pinned = nextPinned;
        msg.pinned_at = nextPinned ? payload.pinned_at : null;
        msg.pinned_by = nextPinned ? payload.pinned_by : null;
        if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'chat-message-list');
        if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'modal-contract-chat-message-list');
      }).catch(function (err) { console.error('contract_chat pin failed', err); });
    }
  }

  function deleteContractChatMessage(contractId, messageId) {
    var supabase = getSupabase();
    var list = contractChatCache[contractId];
    if (!list) return;
    var me = getCurrentChatUser();
    if (supabase) {
      supabase.from('contract_chat_messages').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: me.id
      }).eq('id', messageId).eq('contract_id', contractId).then(function () {
        var m = list.find(function (x) { return x.id === messageId; });
        if (m) {
          m.is_deleted = true;
          m.deleted_at = new Date().toISOString();
          m.deleted_by = me.id;
        }
        if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'chat-message-list');
        if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'modal-contract-chat-message-list');
      }).catch(function (err) { console.error('contract_chat delete failed', err); });
    }
  }

  function addContractSystemMessage(contractId, text) {
    if (!contractId || !text) return;
    var supabase = getSupabase();
    if (!supabase) return;
    var row = {
      contract_id: contractId,
      sender_id: 'system',
      sender_name: 'system',
      message: text,
      type: 'system'
    };
    supabase.from('contract_chat_messages').insert(row).select().single()
      .then(function (res) {
        if (res && res.data) {
          var ui = rowToUiContract(res.data);
          if (!contractChatCache[contractId]) contractChatCache[contractId] = [];
          if (!contractChatCache[contractId].some(function (m) { return m.id === ui.id; })) {
            contractChatCache[contractId].push(ui);
          }
          if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'chat-message-list');
          if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'modal-contract-chat-message-list');
        }
      })
      .catch(function (err) {
        console.error('contract_chat_messages system insert failed', err);
      });
  }

  function ensureContractChatRoom(contractId) {
    /* 계약 생성 알림은 loadContractChatMessages에서 메시지 로드 후 없을 때만 1회 추가 */
  }

  /** 담당설계자/시공담당자 등록 시 채팅에 초대 메시지 추가 (이미 있으면 스킵). role: 'design' | 'construction' */
  function addContractInviteMessage(contractId, role, personName) {
    if (!contractId || !personName) return;
    personName = String(personName).trim();
    if (!personName) return;
    var suffix = role === 'design' ? '님이 설계 담당으로 초대되었습니다.' : '님이 시공 담당으로 초대되었습니다.';
    var searchStr = personName + '님이 ' + (role === 'design' ? '설계' : '시공') + ' 담당으로 초대';
    loadContractChatMessages(contractId).then(function () {
      var messages = getContractChatMessages(contractId) || [];
      var already = messages.some(function (m) {
        return (m.type === 'system' && (m.message || '').indexOf(searchStr) !== -1);
      });
      if (!already) addContractSystemMessage(contractId, '👤 ' + personName + suffix);
    });
  }

  function ensureContractChatSystemMessages(contractId, c) {
    if (!contractId || !c) return;
    var messages = getContractChatMessages(contractId);
    var texts = (messages || []).map(function (m) { return (m.message || '').replace(/^[^\s]+\s/, ''); });
    if (c.depositReceivedAt && texts.indexOf('계약금 입금 확인') === -1) addContractSystemMessage(contractId, '💰 계약금 입금 확인');
    if ((c.designStatus || '') !== '' && (c.designStatus || '') !== 'none' && texts.indexOf('설계 요청') === -1 && texts.indexOf('설계 진행') === -1) addContractSystemMessage(contractId, '📐 설계 진행');
    if (c.constructionStartOk && texts.indexOf('착공 가능') === -1 && texts.indexOf('착공 시작') === -1) addContractSystemMessage(contractId, '🏗 착공 시작');
  }

  function formatChatTime(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    var h = d.getHours();
    var m = d.getMinutes();
    if (isToday) return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    var mon = d.getMonth() + 1;
    var day = d.getDate();
    return mon + '/' + day + ' ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function formatChatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function escapeChatText(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function chatBodyWithMentions(text) {
    var escaped = escapeChatText(text || '');
    return escaped.replace(/@([^\s@]+)/g, '<span class="chat-mention">@$1</span>');
  }

  function getContractChatRoomList() {
    var me = getCurrentChatUser();
    var myName = (me && me.name) ? String(me.name).trim() : '';
    var myTeam = (me && me.team) ? String(me.team).trim() : '';
    var isAdminUser = (typeof window.isAdmin === 'function' && window.isAdmin()) || (typeof window.isMaster === 'function' && window.isMaster());
    var isManagerUser = (typeof window.isManager === 'function' && window.isManager());
    var _cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var myShowroom = (typeof window.resolveShowroomId === 'function') ? window.resolveShowroomId(_cur) : ((_cur && (_cur.showroom || _cur.showroomId)) ? (_cur.showroom || _cur.showroomId) : '');
    var isDesignTeam = (myTeam === '설계');
    var isConstructionTeam = (myTeam === '시공' || myTeam === '시공팀');
    var contracts = typeof window.getContracts === 'function' ? window.getContracts() : [];
    var store = getContractChatStore();
    var list = [];

    contracts.forEach(function (c) {
      var sales = (c.salesPerson || '').trim();
      var design = (c.designContactName || c.designPermitDesigner || '').trim();
      var construction = (c.constructionManager || '').trim();
      var isSameShowroom = isManagerUser && myShowroom && (c.showroomId || '') === myShowroom;
      var isAssignee = (sales === myName) || (design === myName) || (construction === myName) || isDesignTeam || isConstructionTeam || isSameShowroom;
      if (!isAssignee && !isAdminUser) return;

      ensureContractChatRoom(c.id);
      var names = [sales, design, construction].filter(function (s) { return (s || '').trim(); });
      var uniqueNames = names.filter(function (n, i) { return names.indexOf(n) === i; });
      var participantCount = uniqueNames.length;
      var showroomLabel = c.showroomId ? (CHAT_CHANNEL_LABELS[c.showroomId] || c.showroomId) : '';
      var typeMap = { '컨테이너/농막': '컨테이너/농막', '체류형쉼터': '체류형쉼터', '전원주택': '전원주택', '기타': '기타' };
      var designType = typeMap[(c.projectType || c.contractModel || '').trim()] || '기타';
      var dateStr = (function () {
        var d = c.contractDate || '';
        if (!d) return '';
        var parts = d.slice(0, 10).split('-');
        if (parts.length === 3) return parts[1] + '.' + parts[2];
        return d.slice(0, 10);
      })();
      var label = (showroomLabel ? '[' + showroomLabel + '] ' : '') + (c.customerName || '-') + ' · ' + designType + (dateStr ? ' · ' + dateStr : '');
      list.push({ type: 'contract', id: c.id, label: label, participantCount: participantCount, showroomId: c.showroomId || '', contractDate: c.contractDate || '' });
    });

    // 계약일 오래된 순 (오름차순)
    list.sort(function (a, b) {
      var dA = a.contractDate || '';
      var dB = b.contractDate || '';
      return dA < dB ? -1 : dA > dB ? 1 : 0;
    });
    return list;
  }

  /** Supabase에서 팀 채팅 전체 채널 로드. Promise. */
  function loadAllTeamChatMessages() {
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve();
    var promises = CHAT_CHANNELS.map(function (ch) {
      return supabase.from('team_chat_messages').select('*').eq('channel', ch).order('created_at', { ascending: true })
        .then(function (res) {
          teamChatCache[ch] = (res.data || []).map(rowToUiTeam);
        });
    });
    return Promise.all(promises).then(function () {
      if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
    });
  }

  /** 현재 사용자가 접근 가능한 모든 계약 채팅 메시지를 일괄 로드 (사이드바 안읽음 뱃지용) */
  function loadAllAccessibleContractChatMessages() {
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve();
    var list = getContractChatRoomList();
    if (!list || !list.length) return Promise.resolve();
    var promises = list.map(function (room) {
      if (contractChatCache[room.id] && contractChatCache[room.id].length > 0) return Promise.resolve();
      return supabase.from('contract_chat_messages').select('*').eq('contract_id', room.id).order('created_at', { ascending: true })
        .then(function (res) {
          contractChatCache[room.id] = (res.data || []).map(rowToUiContract);
        });
    });
    return Promise.all(promises).then(function () {
      if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
    });
  }

  /** Supabase에서 계약 채팅 로드. Promise. 메시지 없을 때만 '계약 생성' 시스템 메시지 1회 추가 */
  function loadContractChatMessages(contractId) {
    if (!contractId) return Promise.resolve();
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve();
    return supabase.from('contract_chat_messages').select('*').eq('contract_id', contractId).order('created_at', { ascending: true })
      .then(function (res) {
        contractChatCache[contractId] = (res.data || []).map(rowToUiContract);
        var list = contractChatCache[contractId] || [];
        var hasContractCreated = list.some(function (m) {
          var msg = (m.message || '').trim();
          return msg.indexOf('계약 생성') !== -1;
        });
        if (!hasContractCreated) addContractSystemMessage(contractId, '📢 계약 생성');
      });
  }

  /** Realtime 구독: 팀 채팅 INSERT */
  function subscribeTeamChatRealtime() {
    var supabase = getSupabase();
    if (!supabase || teamRealtimeSubscribed) return;
    teamRealtimeSubscribed = true;
    supabase.channel('team-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages'
        },
        function (payload) {
          var row = payload.new;
          if (!row || !row.channel) return;
          var ch = row.channel;
          if (!teamChatCache[ch]) teamChatCache[ch] = [];
          if (teamChatCache[ch].some(function (m) { return m.id === row.id; })) return;
          teamChatCache[ch].push(rowToUiTeam(row));
          // 현재 이 채널을 보고 있을 때만 메시지 목록 업데이트 (다른 채팅방 덮어쓰기 방지)
          var curRoom = typeof window.getSelectedChatRoom === 'function' ? window.getSelectedChatRoom() : null;
          if (typeof window.renderChatMessageList === 'function') {
            if (!curRoom || (curRoom.type === 'channel' && curRoom.id === ch)) {
              window.renderChatMessageList(ch);
            }
          }
          if (typeof window.updateChatTabBadges === 'function') window.updateChatTabBadges();
          if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
        }
      )
      .subscribe();
  }

  /** Realtime 구독: 계약 채팅 INSERT (contract_id 기준) */
  function subscribeContractChatRealtime() {
    var supabase = getSupabase();
    if (!supabase || contractRealtimeSubscribed) return;
    contractRealtimeSubscribed = true;
    supabase.channel('contract-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contract_chat_messages'
        },
        function (payload) {
          var row = payload.new;
          if (!row || !row.contract_id) return;
          var cid = row.contract_id;
          if (!contractChatCache[cid]) contractChatCache[cid] = [];
          if (contractChatCache[cid].some(function (m) { return m.id === row.id; })) return;
          contractChatCache[cid].push(rowToUiContract(row));
          // 현재 이 계약 채팅을 보고 있을 때만 메시지 목록 업데이트 (다른 채팅방 덮어쓰기 방지)
          var curRoom = typeof window.getSelectedChatRoom === 'function' ? window.getSelectedChatRoom() : null;
          if (typeof window.renderContractChat === 'function') {
            if (!curRoom || (curRoom.type === 'contract' && curRoom.id === cid)) {
              window.renderContractChat(cid, 'chat-message-list');
            }
            window.renderContractChat(cid, 'modal-contract-chat-message-list');
          }
          if (typeof window.renderChatRoomList === 'function') window.renderChatRoomList();
        }
      )
      .subscribe();
  }

  function initChatRealtime() {
    subscribeTeamChatRealtime();
    subscribeContractChatRealtime();
  }

  /* Attach to window */
  window.STORAGE_CHAT_LAST_READ = STORAGE_CHAT_LAST_READ;
  window.STORAGE_CONTRACT_CHAT_READ = STORAGE_CONTRACT_CHAT_READ;
  window.getChatStore = getChatStore;
  window.getChatLastRead = getChatLastRead;
  window.setChatLastRead = setChatLastRead;
  window.getChatUnreadCount = getChatUnreadCount;
  window.updateChatTabBadges = updateChatTabBadges;
  window.saveChatMessage = saveChatMessage;
  window.deleteChatMessage = deleteChatMessage;
  window.canPinChatMessage = canPinChatMessage;
  window.getPinnedMessages = getPinnedMessages;
  window.pinChatMessage = pinChatMessage;
  window.getContractChatStore = getContractChatStore;
  window.getContractChatMessages = getContractChatMessages;
  window.saveContractChatMessage = saveContractChatMessage;
  window.getContractChatReadStatus = getContractChatReadStatus;
  window.setContractChatReadStatus = setContractChatReadStatus;
  window.getContractChatUnreadCount = getContractChatUnreadCount;
  window.getContractPinnedMessages = getContractPinnedMessages;
  window.pinContractChatMessage = pinContractChatMessage;
  window.deleteContractChatMessage = deleteContractChatMessage;
  window.addContractSystemMessage = addContractSystemMessage;
  window.addContractInviteMessage = addContractInviteMessage;
  window.ensureContractChatRoom = ensureContractChatRoom;
  window.ensureContractChatSystemMessages = ensureContractChatSystemMessages;
  window.getCurrentChatUser = getCurrentChatUser;
  window.formatChatTime = formatChatTime;
  window.formatChatDate = formatChatDate;
  window.escapeChatText = escapeChatText;
  window.chatBodyWithMentions = chatBodyWithMentions;
  window.CHAT_CHANNELS = CHAT_CHANNELS;
  window.CHAT_CHANNEL_LABELS = CHAT_CHANNEL_LABELS;
  window.ADMIN_REQUEST_CHANNEL = ADMIN_REQUEST_CHANNEL;
  window.ADMIN_REQUEST_ADMIN_TEAM_MARKER = ADMIN_REQUEST_ADMIN_TEAM_MARKER;
  window.ADMIN_REQUEST_STATUS_RE = ADMIN_REQUEST_STATUS_RE;
  window.filterAdminRequestMessages = filterAdminRequestMessages;
  window.parseAdminReplyMarker = parseAdminReplyMarker;
  window.getContractChatRoomList = getContractChatRoomList;
  window.loadAllTeamChatMessages = loadAllTeamChatMessages;
  window.loadAllAccessibleContractChatMessages = loadAllAccessibleContractChatMessages;
  window.loadContractChatMessages = loadContractChatMessages;
  window.initChatRealtime = initChatRealtime;
})();
