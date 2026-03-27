(function () {
  'use strict';
  /* Chat UI and init. Uses window functions from chat.js (getChatStore, getContractChatStore, renderContractChat, getContractChatRoomList, etc.). */

  var CHAT_CHANNELS = window.CHAT_CHANNELS || ['all', 'headquarters', 'showroom1', 'showroom3', 'showroom4'];
  var CHAT_CHANNEL_LABELS = window.CHAT_CHANNEL_LABELS || { all: '전체 협업', headquarters: '본사 전시장', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };

  /** 현재 선택된 채팅방 (채널 또는 계약) */
  var selectedChatRoom = { type: 'channel', id: 'all' };
  /** 대화창 열림 여부 (같은 방 재클릭 시 닫기용) */
  var isChatOpen = false;
  /** 계약 채팅 전시장 필터 */
  var selectedContractShowroomFilter = 'all';

  function renderContractChat(contractId, listId) {
    var resolvedListId = listId || 'contract-chat-message-list';
    var listEl = document.getElementById(resolvedListId);
    if (!listEl) return;
    var messages = window.getContractChatMessages(contractId);
    var me = window.getCurrentChatUser();
    var canPin = typeof window.canPinChatMessage === 'function' && window.canPinChatMessage();
    var wrap = listEl.closest('.chat-messages-wrap') || listEl.closest('.contract-chat-messages-wrap') || listEl.closest('.design-contract-chat-messages-wrap');
    if (wrap && contractId) {
      var pinned = window.getContractPinnedMessages(contractId);
      var pinnedEl = wrap.querySelector('.chat-pinned-area');
      if (pinned.length > 0) {
        var pinTitle = '📌 고정 메시지 (' + pinned.length + ')';
        var pinItems = pinned.map(function (m) {
          var snippet = (m.message || '').slice(0, 40);
          if ((m.message || '').length > 40) snippet += '…';
          return '<button type="button" class="chat-pinned-item" data-contract-id="' + window.escapeChatText(contractId) + '" data-msg-id="' + window.escapeChatText(m.id) + '">' + window.escapeChatText(snippet || '(메시지)') + '</button>';
        }).join('');
        var pinHtml = '<div class="chat-pinned-area"><div class="chat-pinned-title">' + pinTitle + '</div><div class="chat-pinned-list">' + pinItems + '</div></div>';
        if (pinnedEl) {
          pinnedEl.innerHTML = pinHtml;
        } else {
          var div = document.createElement('div');
          div.className = 'chat-pinned-area';
          div.innerHTML = pinHtml;
          wrap.insertBefore(div, listEl);
        }
      } else {
        if (pinnedEl) pinnedEl.remove();
      }
    }
    var lastDate = '';
    var html = '';
    messages.forEach(function (msg) {
      var dateKey = window.formatChatDate(msg.created_at);
      if (dateKey && dateKey !== lastDate) {
        lastDate = dateKey;
        html += '<li class="chat-date-divider">' + window.escapeChatText(dateKey) + '</li>';
      }
      if (msg.type === 'system') {
        html += '<li class="chat-message system" data-sender="system">' + window.escapeChatText(msg.message || '') + '</li>';
        return;
      }
      var isMine = msg.sender_id === me.id;
      var canDelete = (isMine || (typeof window.isAdmin === 'function' && window.isAdmin()) || (typeof window.isMaster === 'function' && window.isMaster()));
      var deleted = !!msg.is_deleted;
      var author = window.escapeChatText(msg.sender_name || '알 수 없음');
      var body = deleted ? '삭제된 메시지입니다.' : window.escapeChatText(msg.message || '');
      var time = window.formatChatTime(msg.created_at);
      var menuHtml = '';
      if (!deleted && msg.id && (canDelete || canPin)) {
        var pinLabel = msg.is_pinned ? '고정 해제' : '📌 고정';
        var dropBtns = (canPin ? '<button type="button" class="chat-msg-pin-contract-btn" data-contract-id="' + window.escapeChatText(contractId) + '" data-msg-id="' + window.escapeChatText(msg.id) + '" data-list-id="' + window.escapeChatText(resolvedListId) + '">' + pinLabel + '</button>' : '') +
          (canDelete ? '<button type="button" class="chat-msg-delete-btn contract-chat-delete" data-contract-id="' + window.escapeChatText(contractId) + '" data-msg-id="' + window.escapeChatText(msg.id) + '" data-list-id="' + window.escapeChatText(resolvedListId) + '">삭제</button>' : '');
        menuHtml = '<div class="chat-message-actions">' +
          '<button type="button" class="chat-msg-menu-btn" aria-label="메뉴">⋯</button>' +
          '<div class="chat-msg-dropdown hidden">' + dropBtns + '</div></div>';
      }
      html += '<li class="chat-message-wrap ' + (isMine ? 'mine' : 'other') + (deleted ? ' is-deleted' : '') + (msg.is_pinned ? ' is-pinned' : '') + '">';
      html += '<div class="chat-message ' + (isMine ? 'mine' : 'other') + (deleted ? ' chat-message-deleted' : '') + '">' +
        (menuHtml ? menuHtml : '') +
        '<span class="chat-message-author">' + author + '</span>' +
        '<span class="chat-message-body">' + body + '</span>' +
        '<span class="chat-message-time">' + time + '</span>' +
        '</div></li>';
    });
    listEl.innerHTML = html;
    var wrapScroll = listEl.closest('.contract-chat-messages-wrap') || listEl.closest('.design-contract-chat-messages-wrap') || listEl.closest('.chat-messages-wrap');
    if (wrapScroll) wrapScroll.scrollTop = wrapScroll.scrollHeight;
  }

  function getContractChatParticipantNames(contractId) {
    var contracts = typeof window.getContracts === 'function' ? window.getContracts() : [];
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return [];
    var sales = (c.salesPerson || '').trim();
    var design = (c.designContactName || c.designPermitDesigner || '').trim();
    var construction = (c.constructionManager || '').trim();
    var names = [sales, design, construction].filter(function (s) { return s; });
    return names.filter(function (n, i) { return names.indexOf(n) === i; });
  }

  function openContractChatModal(contractId) {
    if (!contractId) return;
    var contracts = typeof window.getContracts === 'function' ? window.getContracts() : [];
    var c = contracts.find(function (x) { return x.id === contractId; });
    var titleEl = document.getElementById('modal-contract-chat-title');
    var hiddenEl = document.getElementById('modal-contract-chat-contract-id');
    var inputEl = document.getElementById('modal-contract-chat-input');
    var participantsEl = document.getElementById('modal-contract-chat-participants');
    if (titleEl) titleEl.textContent = (c ? (c.customerName || '-') + ' / ' + (c.contractModelName || c.contractModel || '-') : contractId);
    if (hiddenEl) hiddenEl.value = contractId;
    if (inputEl) inputEl.value = '';
    if (participantsEl) {
      var names = getContractChatParticipantNames(contractId);
      participantsEl.textContent = names.length ? '참여: ' + names.join(', ') : '';
      participantsEl.classList.toggle('hidden', !names.length);
    }

    function openModal() {
      if (typeof window.ensureContractChatRoom === 'function') window.ensureContractChatRoom(contractId);
      if (c && typeof window.ensureContractChatSystemMessages === 'function') window.ensureContractChatSystemMessages(contractId, c);
      renderContractChat(contractId, 'modal-contract-chat-message-list');
      var modal = document.getElementById('modal-contract-chat');
      if (modal) modal.classList.remove('hidden');
    }

    if (typeof window.loadContractChatMessages === 'function') {
      window.loadContractChatMessages(contractId).then(openModal);
    } else {
      openModal();
    }
  }

  /** 채팅방 목록 UI 렌더 (채널 + 계약). 전체 협업은 항상 표시, 전시장 채널은 본인 소속만 */
  function renderChatRoomList() {
    var channelsEl = document.getElementById('chat-room-channels');
    var contractsEl = document.getElementById('chat-room-contracts');
    if (!channelsEl) return;
    var searchVal = (document.getElementById('chat-room-search') && document.getElementById('chat-room-search').value || '').trim().toLowerCase();

    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var myShowroomId = cur && typeof window.resolveShowroomId === 'function' ? window.resolveShowroomId(cur) : (cur && (cur.showroomId || cur.showroom) || '');
    var isAdmin = typeof window.isAdmin === 'function' && window.isAdmin();
    var isMaster = typeof window.isMaster === 'function' && window.isMaster();
    var canSeeAllChannels = isAdmin || isMaster;

    var channelHtml = '';
    CHAT_CHANNELS.forEach(function (ch) {
      if (!canSeeAllChannels && ch !== 'all' && ch !== myShowroomId) return;
      var label = CHAT_CHANNEL_LABELS[ch] || ch;
      if (searchVal && label.toLowerCase().indexOf(searchVal) === -1) return;
      var unread = typeof window.getChatUnreadCount === 'function' ? window.getChatUnreadCount(ch) : 0;
      var active = isChatOpen && selectedChatRoom.type === 'channel' && selectedChatRoom.id === ch;
      channelHtml += '<button type="button" class="chat-room-item' + (active ? ' active' : '') + '" data-type="channel" data-id="' + window.escapeChatText(ch) + '">' +
        '<span class="chat-room-item-label">' + window.escapeChatText(label) + '</span>' +
        (unread > 0 ? '<span class="chat-room-item-unread" aria-live="polite">' + (unread > 99 ? '99+' : unread) + '</span>' : '') +
        '</button>';
    });
    channelsEl.innerHTML = channelHtml || '';

    if (contractsEl) {
      var contractList = typeof window.getContractChatRoomList === 'function' ? window.getContractChatRoomList() : [];

      // 전시장 필터 버튼 렌더
      var filterEl = document.getElementById('chat-contract-showroom-filter');
      if (filterEl) {
        var showroomIds = ['all'];
        var seen = {};
        contractList.forEach(function (r) { if (r.showroomId && !seen[r.showroomId]) { seen[r.showroomId] = true; showroomIds.push(r.showroomId); } });
        var filterLabels = { all: '전체', headquarters: '본사', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };
        var filterHtml = showroomIds.map(function (sid) {
          var flabel = filterLabels[sid] || sid;
          var isActive = selectedContractShowroomFilter === sid;
          return '<button type="button" class="chat-showroom-filter-btn' + (isActive ? ' active' : '') + '" data-showroom="' + window.escapeChatText(sid) + '">' + window.escapeChatText(flabel) + '</button>';
        }).join('');
        filterEl.innerHTML = filterHtml;
      }

      var contractHtml = '';
      contractList.forEach(function (room) {
        if (selectedContractShowroomFilter !== 'all' && room.showroomId !== selectedContractShowroomFilter) return;
        if (searchVal && room.label.toLowerCase().indexOf(searchVal) === -1) return;
        var active = isChatOpen && selectedChatRoom.type === 'contract' && selectedChatRoom.id === room.id;
        var unread = typeof window.getContractChatUnreadCount === 'function' ? window.getContractChatUnreadCount(room.id) : 0;
        var participantBadge = (room.participantCount != null && room.participantCount > 0) ? '<span class="chat-room-item-participants" aria-label="참여 ' + room.participantCount + '명">' + room.participantCount + '명</span>' : '';
        contractHtml += '<button type="button" class="chat-room-item' + (active ? ' active' : '') + '" data-type="contract" data-id="' + window.escapeChatText(room.id) + '">' +
          '<span class="chat-room-item-label">' + window.escapeChatText(room.label) + '</span>' +
          participantBadge +
          (unread > 0 ? '<span class="unread-badge" aria-live="polite">' + (unread > 99 ? '99+' : unread) + '</span>' : '') +
          '</button>';
      });
      contractsEl.innerHTML = contractHtml || '';
    }
  }

  /** 대화창 열기 (패널·body에 클래스 추가) */
  function openConversation() {
    isChatOpen = true;
    var panel = document.getElementById('chat-panel');
    if (panel && panel.classList.contains('chat-panel-two-col')) {
      panel.classList.add('chat-conversation-open');
      document.body.classList.add('chat-conversation-open');
    }
  }

  /** 대화창 닫기 (클래스 제거) */
  function closeConversation() {
    isChatOpen = false;
    var panel = document.getElementById('chat-panel');
    if (panel && panel.classList.contains('chat-panel-two-col')) {
      panel.classList.remove('chat-conversation-open');
      document.body.classList.remove('chat-conversation-open');
    }
    if (typeof renderChatRoomList === 'function') renderChatRoomList();
  }

  /** 채팅방 선택 시 대화 로드 */
  function selectChatRoom(type, id) {
    selectedChatRoom = { type: type, id: id };
    var channelInput = document.getElementById('chat-channel-input');
    var roomTypeInput = document.getElementById('chat-room-type-input');
    var contractIdInput = document.getElementById('chat-contract-id-input');
    if (channelInput) channelInput.value = type === 'channel' ? id : '';
    if (roomTypeInput) roomTypeInput.value = type;
    if (contractIdInput) contractIdInput.value = type === 'contract' ? id : '';

    var titleEl = document.getElementById('chat-conversation-title');
    var metaEl = document.getElementById('chat-conversation-meta');
    if (titleEl) titleEl.textContent = type === 'channel' ? (CHAT_CHANNEL_LABELS[id] || id) : (function () {
      var list = window.getContractChatRoomList();
      var r = list.find(function (x) { return x.id === id; });
      return r ? r.label : id;
    }());
    if (metaEl) {
      if (type === 'channel') {
        var data = window.getChatStore();
        var msgs = data[id] || [];
        var userIds = {};
        msgs.forEach(function (m) { if (m.userId) userIds[m.userId] = true; });
        metaEl.textContent = Object.keys(userIds).length + '명 참여';
      } else {
        var participantNames = getContractChatParticipantNames(id);
        metaEl.textContent = participantNames.length ? '참여: ' + participantNames.join(', ') : '계약 채팅';
      }
    }

    var gotoDesignBtn = document.getElementById('chat-goto-design-btn');
    if (gotoDesignBtn) {
      gotoDesignBtn.classList.toggle('hidden', type !== 'contract');
      gotoDesignBtn.setAttribute('data-contract-id', type === 'contract' ? id : '');
    }

    renderChatRoomList();

    if (type === 'channel') {
      ensureChatSamples(id);
      renderChatMessageList(id);
      var data = window.getChatStore();
      var msgs = data[id] || [];
      var last = msgs[msgs.length - 1];
      if (typeof window.setChatLastRead === 'function') window.setChatLastRead(id, last && last.at ? last.at : new Date().toISOString());
    } else {
      var c = (typeof window.getContracts === 'function' ? window.getContracts() : []).find(function (x) { return x.id === id; });
      function showContractChat() {
        if (typeof window.ensureContractChatRoom === 'function') window.ensureContractChatRoom(id);
        if (c && typeof window.ensureContractChatSystemMessages === 'function') window.ensureContractChatSystemMessages(id, c);
        renderContractChat(id, 'chat-message-list');
        var contractMsgs = typeof window.getContractChatMessages === 'function' ? window.getContractChatMessages(id) : [];
        var sorted = contractMsgs.slice().sort(function (a, b) {
          var ta = (a.created_at || '').toString();
          var tb = (b.created_at || '').toString();
          return ta.localeCompare(tb);
        });
        var lastMsg = sorted.length ? sorted[sorted.length - 1] : null;
        if (typeof window.setContractChatReadStatus === 'function') window.setContractChatReadStatus(id, lastMsg ? lastMsg.id : null);
        renderChatRoomList();
      }
      if (typeof window.loadContractChatMessages === 'function') {
        window.loadContractChatMessages(id).then(showContractChat);
      } else {
        showContractChat();
      }
    }
  }

  /** 이미지 파일 확장자 여부 (썸네일 미리보기용) */
  function isImageFileName(name) {
    if (!name || typeof name !== 'string') return false;
    return /\.(jpe?g|png|gif|webp|bmp)$/i.test(name);
  }

  /** 채팅 첨부파일을 Storage에 업로드. 반환: Promise<[{ name, url }]> */
  function uploadChatFiles(files, channel) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !files || !files.length) return Promise.resolve([]);
    var bucket = 'notice_files';
    var year = new Date().getFullYear();
    var results = [];

    function uploadOne(file) {
      var safeName = typeof window.sanitizeNoticeFileName === 'function' ? window.sanitizeNoticeFileName(file.name) : (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = 'chat/' + (channel || 'all') + '/' + year + '/' + Date.now() + '_' + safeName;
      return supabase.storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true })
        .then(function (res) {
          if (res && res.error) {
            console.error('chat file upload error', res.error);
            return null;
          }
          var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          return { name: file.name || safeName, url: publicUrl };
        })
        .catch(function (err) {
          console.error('chat file upload failed', err);
          return null;
        });
    }

    var chain = Promise.resolve();
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        chain = chain.then(function () { return uploadOne(file); }).then(function (r) {
          if (r) results.push(r);
        });
      })(files[i]);
    }
    return chain.then(function () { return results; });
  }

  function updateChatHeader(channel) {
    var el = document.getElementById('chat-header-subtitle');
    var activityEl = document.getElementById('chat-header-activity');
    if (!el) return;
    var label = CHAT_CHANNEL_LABELS[channel] || channel;
    var data = window.getChatStore();
    var messages = data[channel] || [];
    var userIds = {};
    messages.forEach(function (m) {
      if (m.userId) userIds[m.userId] = true;
    });
    var count = Object.keys(userIds).length || 1;
    el.textContent = label + ' 협업 · ' + count + '명 참여중';
    if (activityEl) {
      var last = messages[messages.length - 1];
      activityEl.textContent = last && last.at ? '최근 활동: ' + window.formatChatTime(last.at) : '';
    }
  }

  function ensureChatSamples(channel) {
    var data = window.getChatStore();
    var list = data[channel] || [];
    if (list.length > 0) return;
    /* Supabase 사용 시 빈 채널은 샘플 없이 유지 */
  }

  function renderChatMessageList(channel) {
    var list = document.getElementById('chat-message-list');
    if (!list) return;
    ensureChatSamples(channel);
    var data = window.getChatStore();
    var messages = data[channel] || [];
    var me = window.getCurrentChatUser();
    var pinned = typeof window.getPinnedMessages === 'function' ? window.getPinnedMessages(channel) : [];
    var canPin = typeof window.canPinChatMessage === 'function' && window.canPinChatMessage();

    var wrap = list.closest('.chat-messages-wrap');
    if (wrap) {
      var pinnedEl = wrap.querySelector('.chat-pinned-area');
      if (pinned.length > 0) {
        var pinTitle = '📌 고정 메시지 (' + pinned.length + ')';
        var pinItems = pinned.map(function (m) {
          var snippet;
          if (m.message_type === 'image') {
            snippet = '🖼 ' + (m.file_name || m.text || '이미지');
          } else {
            snippet = (m.text || '').replace(/\s*\[첨부:[^\]]*\]\s*$/, '').trim().slice(0, 40);
            if (snippet.length < (m.text || '').trim().length) snippet += '…';
          }
          return '<button type="button" class="chat-pinned-item" data-msg-id="' + window.escapeChatText(m.id) + '" data-channel="' + window.escapeChatText(channel) + '">' + window.escapeChatText(snippet || '(메시지)') + '</button>';
        }).join('');
        var pinHtml = '<div class="chat-pinned-area"><div class="chat-pinned-title">' + pinTitle + '</div><div class="chat-pinned-list">' + pinItems + '</div></div>';
        if (pinnedEl) {
          pinnedEl.innerHTML = pinHtml;
        } else {
          var div = document.createElement('div');
          div.className = 'chat-pinned-area';
          div.innerHTML = pinHtml;
          wrap.insertBefore(div, list);
        }
      } else {
        if (pinnedEl) pinnedEl.remove();
      }
    }

    var lastDate = '';
    var html = '';
    messages.forEach(function (msg) {
      var dateKey = window.formatChatDate(msg.at);
      if (dateKey && dateKey !== lastDate) {
        lastDate = dateKey;
        html += '<li class="chat-date-divider">' + dateKey + '</li>';
      }
      if (msg.type === 'system') {
        html += '<li class="chat-message system">' + window.escapeChatText(msg.text || '') + '</li>';
        return;
      }
      var isMine = msg.userId === me.id;
      var canDelete = (isMine || (typeof window.isAdmin === 'function' && window.isAdmin()) || (typeof window.isMaster === 'function' && window.isMaster()));
      var deleted = !!msg.is_deleted;
      var authorName = window.escapeChatText(msg.userName || '알 수 없음');
      var teamLabel = (msg.team === '영업' || msg.team === '설계' || msg.team === '시공') ? msg.team + '팀' : (msg.team ? window.escapeChatText(msg.team) : '');
      var author = authorName + (teamLabel ? ' · ' + teamLabel : '');
      var bodyText = (msg.text || '').replace(/\s*\[첨부:[^\]]*\]\s*$/, '').trim();
      var bodyHtml = deleted ? '삭제된 메시지입니다.' : window.chatBodyWithMentions(bodyText);
      var time = window.formatChatTime(msg.at);
      var contractHtml = '';
      if (msg.contractTag && (msg.contractTag.customerName || msg.contractTag.model || msg.contractTag.stage)) {
        var c = msg.contractTag;
        var parts = [c.customerName, c.model, c.stage].filter(Boolean);
        contractHtml = '<div class="chat-contract-tag">' + window.escapeChatText(parts.join(' / ')) + '</div>';
      }
      var readHtml = '';
      if (!deleted && msg.readBy && msg.readBy.length) {
        readHtml = '<div class="chat-read-receipt">읽음 ' + (msg.readCount || msg.readBy.length) + ' · ' + window.escapeChatText(msg.readBy.join(' · ')) + '</div>';
      } else if (!deleted && msg.readCount) {
        readHtml = '<div class="chat-read-receipt">읽음 ' + msg.readCount + '</div>';
      }
      var attachHtml = '';
      var isImageMsg = !deleted && msg.message_type === 'image' && msg.file_url;
      var isFileMsg = !deleted && (msg.message_type === 'file' || (!msg.message_type && msg.attachments && msg.attachments.length));
      if (isFileMsg && msg.attachments && msg.attachments.length) {
        attachHtml = '<div class="chat-attachments">' +
          '<div class="chat-attachment-label">📎 파일 첨부</div>' +
          msg.attachments.map(function (a) {
            var name = window.escapeChatText(a.name || '파일');
            var url = (a.url || '').replace(/"/g, '&quot;');
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="chat-attachment-link" download>' + name + '</a>';
          }).join('') +
          '</div>';
      }
      var imageBodyHtml = '';
      if (isImageMsg) {
        var imgUrl = (msg.file_url || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        var imgName = window.escapeChatText(msg.file_name || '이미지');
        var imgCaption = (msg.text || '').trim() || msg.file_name || '';
        imageBodyHtml = '<div class="chat-image-message">' +
          '<button type="button" class="chat-image-thumb-btn" data-file-url="' + imgUrl + '" data-file-name="' + imgName + '" aria-label="크게 보기">' +
          '<img src="' + imgUrl + '" alt="' + imgName + '" loading="lazy">' +
          '</button>' +
          (imgCaption ? '<span class="chat-image-caption">' + window.escapeChatText(imgCaption) + '</span>' : '') +
          '</div>';
      }
      var bodyOrImage = isImageMsg ? imageBodyHtml : ('<span class="chat-message-body">' + bodyHtml + '</span>');
      var menuHtml = '';
      if (!deleted && msg.id) {
        var pinLabel = msg.is_pinned ? '고정 해제' : '📌 메시지 고정';
        var dropBtns = (canPin ? '<button type="button" class="chat-msg-pin-btn" data-channel="' + window.escapeChatText(channel) + '" data-msg-id="' + window.escapeChatText(msg.id) + '">' + pinLabel + '</button>' : '') +
          (canDelete ? '<button type="button" class="chat-msg-delete-btn" data-channel="' + window.escapeChatText(channel) + '" data-msg-id="' + window.escapeChatText(msg.id) + '">삭제</button>' : '');
        if (dropBtns) {
          menuHtml = '<div class="chat-message-actions">' +
            '<button type="button" class="chat-msg-menu-btn" aria-label="메뉴">⋯</button>' +
            '<div class="chat-msg-dropdown hidden">' + dropBtns + '</div></div>';
        }
      }
      var wrapId = msg.id ? ' id="chat-msg-' + window.escapeChatText(msg.id) + '"' : '';
      html += '<li class="chat-message-wrap ' + (isMine ? 'mine' : 'other') + (deleted ? ' is-deleted' : '') + (msg.is_pinned ? ' is-pinned' : '') + (isImageMsg ? ' chat-message-wrap-image' : '') + '"' + wrapId + '>';
      if (contractHtml) html += contractHtml;
      html += '<div class="chat-message ' + (isMine ? 'mine' : 'other') + (deleted ? ' chat-message-deleted' : '') + (isImageMsg ? ' chat-message-has-image' : '') + '">' +
        (menuHtml ? menuHtml : '') +
        '<span class="chat-message-author">' + author + '</span>' +
        bodyOrImage +
        (attachHtml ? attachHtml : '') +
        '<span class="chat-message-time">' + time + '</span>' +
        (readHtml ? readHtml : '') +
        '</div></li>';
    });
    list.innerHTML = html;
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
    updateChatHeader(channel);
  }

  /** 채팅 탭: 전체는 모두 보이고, 전시장 채널은 본인 소속 전시장만 보이게 */
  function applyChatTabVisibility() {
    var panel = document.getElementById('chat-panel');
    if (!panel) return;
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var myShowroomId = cur && typeof window.resolveShowroomId === 'function' ? window.resolveShowroomId(cur) : (cur && (cur.showroomId || cur.showroom) || '');
    var isAdmin = typeof window.isAdmin === 'function' && window.isAdmin();
    var isMaster = typeof window.isMaster === 'function' && window.isMaster();
    var canSeeAllChannels = isAdmin || isMaster;
    panel.querySelectorAll('.chat-tab[data-channel]').forEach(function (btn) {
      var ch = btn.getAttribute('data-channel');
      var show = canSeeAllChannels || ch === 'all' || ch === myShowroomId;
      btn.classList.toggle('hidden', !show);
    });
    var activeTab = panel.querySelector('.chat-tab.active');
    if (activeTab && activeTab.classList.contains('hidden')) {
      activeTab.classList.remove('active');
      var firstVisible = panel.querySelector('.chat-tab:not(.hidden)');
      if (firstVisible) {
        firstVisible.classList.add('active');
        var ch = firstVisible.getAttribute('data-channel');
        var channelInput = document.getElementById('chat-channel-input');
        if (channelInput) channelInput.value = ch;
        if (ch) renderChatMessageList(ch);
      }
    }
  }

  function initChatPanel() {
    var panel = document.getElementById('chat-panel');
    var channelInput = document.getElementById('chat-channel-input');
    var form = document.getElementById('chat-form');
    var input = document.getElementById('chat-input');
    var fileInput = document.getElementById('chat-file-input');
    var plusBtn = document.getElementById('chat-plus-btn');
    var plusPanel = document.getElementById('chat-plus-panel');
    var emojiPopover = document.getElementById('chat-emoji-popover');
    if (!panel || !form || !input) return;

    if (typeof window.initChatRealtime === 'function') window.initChatRealtime();

    var chatPendingFiles = [];
    var currentChannel = 'all';

    if (panel.classList.contains('chat-panel-two-col')) {
      document.body.classList.add('chat-panel-two-col-open');
      renderChatRoomList();
      var searchEl = document.getElementById('chat-room-search');
      if (searchEl) searchEl.addEventListener('input', function () { renderChatRoomList(); });
      panel.addEventListener('click', function (e) {
        var filterBtn = e.target.closest('.chat-showroom-filter-btn');
        if (filterBtn) {
          selectedContractShowroomFilter = filterBtn.getAttribute('data-showroom') || 'all';
          renderChatRoomList();
          return;
        }
        var item = e.target.closest('.chat-room-item');
        if (!item) return;
        var type = item.getAttribute('data-type');
        var id = item.getAttribute('data-id');
        if (!type || !id) return;
        var sameRoom = selectedChatRoom.type === type && selectedChatRoom.id === id;
        if (sameRoom && isChatOpen) {
          closeConversation();
        } else {
          selectChatRoom(type, id);
          openConversation();
        }
      });
      var closeBtn = document.getElementById('chat-conversation-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function () { closeConversation(); });
      var gotoDesignBtn = document.getElementById('chat-goto-design-btn');
      if (gotoDesignBtn) {
        gotoDesignBtn.addEventListener('click', function () {
          var contractId = gotoDesignBtn.getAttribute('data-contract-id');
          if (!contractId) return;
          // 필터 초기화: 년/월 필터와 검색어를 비워 해당 계약이 테이블에 렌더링되도록
          var monthEl = document.getElementById('filter-month');
          var searchEl = document.getElementById('design-search-input');
          if (monthEl) monthEl.value = '';
          if (searchEl) searchEl.value = '';
          if (typeof window.showSection === 'function') window.showSection('design');
          setTimeout(function () {
            if (typeof window.renderDesign === 'function') window.renderDesign();
            setTimeout(function () {
              if (typeof window.showDesignDetailPanel === 'function') window.showDesignDetailPanel(contractId);
            }, 50);
          }, 100);
        });
      }
    } else {
      applyChatTabVisibility();
      var activeTab = panel.querySelector('.chat-tab.active');
      currentChannel = (activeTab && activeTab.getAttribute('data-channel')) || 'all';
      if (channelInput) channelInput.value = currentChannel;
    }

    if (typeof window.loadAllTeamChatMessages === 'function') {
      window.loadAllTeamChatMessages().then(function () {
        renderChatRoomList();
        // 계약 채팅이 열려있으면 채널 메시지로 덮어쓰지 않음
        if (!isChatOpen || selectedChatRoom.type === 'channel') {
          var chToRender = selectedChatRoom.type === 'channel' ? selectedChatRoom.id : currentChannel;
          renderChatMessageList(chToRender);
        }
        if (typeof window.updateChatTabBadges === 'function') window.updateChatTabBadges();
        if (typeof window.loadAllAccessibleContractChatMessages === 'function') {
          window.loadAllAccessibleContractChatMessages();
        }
      });
    }

    if (panel && !panel.classList.contains('chat-panel-two-col')) {
      panel.querySelectorAll('.chat-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var ch = btn.getAttribute('data-channel');
          if (!ch) return;
          currentChannel = ch;
          if (channelInput) channelInput.value = ch;
          document.querySelectorAll('.chat-tab').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          renderChatMessageList(ch);
          var data = window.getChatStore();
          var msgs = data[ch] || [];
          var last = msgs[msgs.length - 1];
          window.setChatLastRead(ch, last && last.at ? last.at : new Date().toISOString());
          window.updateChatTabBadges();
        });
      });
      renderChatMessageList(currentChannel);
      var data = window.getChatStore();
      var msgs = data[currentChannel] || [];
      var last = msgs[msgs.length - 1];
      window.setChatLastRead(currentChannel, last && last.at ? last.at : new Date().toISOString());
      window.updateChatTabBadges();
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) {
          for (var i = 0; i < fileInput.files.length; i++) chatPendingFiles.push(fileInput.files[i]);
          var names = [];
          for (var j = 0; j < fileInput.files.length; j++) names.push(fileInput.files[j].name);
          var text = (input.value || '').trim();
          input.value = (text ? text + '\n' : '') + '[첨부: ' + names.join(', ') + ']';
        }
        fileInput.value = '';
      });
    }

    if (plusBtn && plusPanel) {
      plusBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var open = plusPanel.classList.toggle('hidden');
        plusPanel.setAttribute('aria-hidden', open ? 'true' : 'false');
        if (!open && emojiPopover) emojiPopover.classList.add('hidden');
      });
      plusPanel.querySelectorAll('.chat-plus-action').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-action');
          if (action === 'attach') {
            if (fileInput) { fileInput.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp'; fileInput.click(); }
          } else if (action === 'mention') {
            var val = input.value || '';
            input.value = val + (val && !/^\s*$/.test(val) ? ' ' : '') + '@';
            input.focus();
          } else if (action === 'image') {
            if (fileInput) { fileInput.accept = 'image/*'; fileInput.click(); }
          } else if (action === 'doc') {
            if (fileInput) { fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.hwp'; fileInput.click(); }
          }
          plusPanel.classList.add('hidden');
          plusPanel.setAttribute('aria-hidden', 'true');
        });
      });
      document.addEventListener('click', function (e) {
        if (plusPanel.classList.contains('hidden')) return;
        if (!plusPanel.contains(e.target) && !plusBtn.contains(e.target)) {
          plusPanel.classList.add('hidden');
          plusPanel.setAttribute('aria-hidden', 'true');
        }
      });
    }

    var emojiBtn = document.getElementById('chat-emoji-btn');
    if (emojiBtn && emojiPopover) {
      emojiBtn.addEventListener('click', function (e) {
        e.preventDefault();
        emojiPopover.classList.toggle('hidden');
        if (plusPanel && !plusPanel.classList.contains('hidden')) { plusPanel.classList.add('hidden'); plusPanel.setAttribute('aria-hidden', 'true'); }
      });
      emojiPopover.querySelectorAll('.chat-emoji-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var emoji = el.getAttribute('data-emoji') || '';
          if (!emoji) return;
          var start = input.selectionStart;
          var end = input.selectionEnd;
          var val = input.value || '';
          input.value = val.slice(0, start) + emoji + val.slice(end);
          input.selectionStart = input.selectionEnd = start + emoji.length;
          input.focus();
          emojiPopover.classList.add('hidden');
        });
      });
      document.addEventListener('click', function (e) {
        if (emojiPopover.classList.contains('hidden')) return;
        if (!emojiPopover.contains(e.target) && !emojiBtn.contains(e.target)) {
          emojiPopover.classList.add('hidden');
        }
      });
    }

    function resizeChatInput() {
      input.style.height = 'auto';
      input.style.height = Math.min(Math.max(input.scrollHeight, 44), 120) + 'px';
    }
    input.addEventListener('input', resizeChatInput);
    input.addEventListener('focus', resizeChatInput);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    function doSendMessage(text, attachments) {
      var ch = (channelInput && channelInput.value) ? channelInput.value : currentChannel;
      currentChannel = ch;
      var me = window.getCurrentChatUser();
      var base = { channel: ch, type: 'user', userId: me.id, userName: me.name, team: me.team, at: new Date().toISOString() };

      if (!attachments || !attachments.length) {
        var msg = Object.assign({}, base, {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          message_type: 'text',
          text: text || ''
        });
        window.saveChatMessage(ch, msg);
        input.value = '';
        input.style.height = '44px';
        if (typeof window.renderChatMessageList === 'function') window.renderChatMessageList(ch);
        if (typeof window.setChatLastRead === 'function') window.setChatLastRead(ch, msg.at);
        if (typeof window.updateChatTabBadges === 'function') window.updateChatTabBadges();
        renderChatRoomList();
        return;
      }

      var imageAttachments = attachments.filter(function (a) { return isImageFileName(a.name); });
      var fileAttachments = attachments.filter(function (a) { return !isImageFileName(a.name); });
      var lastAt = base.at;

      imageAttachments.forEach(function (a, idx) {
        var msg = Object.assign({}, base, {
          id: 'msg_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2, 9),
          message_type: 'image',
          file_url: a.url || '',
          file_name: a.name || '이미지',
          text: (idx === 0 && text) ? text : ''
        });
        window.saveChatMessage(ch, msg);
        lastAt = msg.at;
      });
      if (fileAttachments.length) {
        var fileMsg = Object.assign({}, base, {
          id: 'msg_' + Date.now() + '_f_' + Math.random().toString(36).slice(2, 9),
          message_type: 'file',
          text: (!imageAttachments.length && text) ? text : '(파일 첨부)',
          attachments: fileAttachments
        });
        window.saveChatMessage(ch, fileMsg);
        lastAt = fileMsg.at;
      }

      input.value = '';
      input.style.height = '44px';
      chatPendingFiles = [];
      if (typeof window.renderChatMessageList === 'function') window.renderChatMessageList(ch);
      if (typeof window.setChatLastRead === 'function') window.setChatLastRead(ch, lastAt);
      if (typeof window.updateChatTabBadges === 'function') window.updateChatTabBadges();
      renderChatRoomList();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rawText = (input.value || '').trim();
      var text = rawText.replace(/\s*\[첨부:[^\]]*\]\s*$/, '').trim();
      var roomTypeInput = document.getElementById('chat-room-type-input');
      var contractIdInput = document.getElementById('chat-contract-id-input');
      var isContractRoom = roomTypeInput && roomTypeInput.value === 'contract' && contractIdInput && contractIdInput.value;

      if (isContractRoom) {
        if (!text) return;
        var cid = contractIdInput.value;
        var me = window.getCurrentChatUser();
        var msg = {
          id: 'cmsg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          sender_id: me.id,
          sender_name: me.name,
          message: text,
          created_at: new Date().toISOString()
        };
        window.saveContractChatMessage(cid, msg);
        input.value = '';
        input.style.height = '44px';
        renderContractChat(cid, 'chat-message-list');
        renderChatRoomList();
        return;
      }

      if (!text && !chatPendingFiles.length) return;

      if (chatPendingFiles.length) {
        var sendBtn = form.querySelector('.chat-send-btn');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '업로드 중...'; }
        var ch = (channelInput && channelInput.value) ? channelInput.value : currentChannel;
        uploadChatFiles(chatPendingFiles, ch).then(function (attachments) {
          if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '전송'; }
          doSendMessage(text, attachments);
        }).catch(function () {
          if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '전송'; }
          doSendMessage(text, []);
        });
      } else {
        doSendMessage(text, null);
      }
    });

    var chatImageModal = document.getElementById('chat-image-modal-overlay');
    var chatImageModalImg = document.getElementById('chat-image-modal-img');
    var chatImageModalDownload = document.getElementById('chat-image-modal-download');
    var chatImageModalClose = document.getElementById('chat-image-modal-close');
    function openChatImageModal(fileUrl, fileName) {
      if (!chatImageModalImg || !chatImageModal) return;
      chatImageModalImg.src = fileUrl;
      chatImageModalImg.alt = fileName || '이미지';
      if (chatImageModalDownload) {
        chatImageModalDownload.href = fileUrl;
        chatImageModalDownload.download = fileName || 'image';
      }
      chatImageModal.classList.remove('hidden');
      chatImageModal.setAttribute('aria-hidden', 'false');
    }
    function closeChatImageModal() {
      if (chatImageModal) {
        chatImageModal.classList.add('hidden');
        chatImageModal.setAttribute('aria-hidden', 'true');
      }
    }
    if (chatImageModalClose) chatImageModalClose.addEventListener('click', closeChatImageModal);
    if (chatImageModal) {
      chatImageModal.addEventListener('click', function (e) {
        if (e.target === chatImageModal) closeChatImageModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chatImageModal && !chatImageModal.classList.contains('hidden')) closeChatImageModal();
    });

    document.addEventListener('click', function (e) {
      var imageThumb = e.target.closest('.chat-image-thumb-btn');
      if (imageThumb) {
        e.preventDefault();
        var url = imageThumb.getAttribute('data-file-url');
        var name = imageThumb.getAttribute('data-file-name') || '이미지';
        if (url) openChatImageModal(url, name);
        return;
      }
      var pinBtn = e.target.closest('.chat-msg-pin-btn');
      if (pinBtn) {
        e.preventDefault();
        var ch = pinBtn.getAttribute('data-channel');
        var mid = pinBtn.getAttribute('data-msg-id');
        if (ch && mid && typeof window.pinChatMessage === 'function') {
          window.pinChatMessage(ch, mid);
          renderChatMessageList(ch);
        }
        document.querySelectorAll('.chat-msg-dropdown').forEach(function (d) { d.classList.add('hidden'); });
        return;
      }
      var pinContractBtn = e.target.closest('.chat-msg-pin-contract-btn');
      if (pinContractBtn) {
        e.preventDefault();
        var cid = pinContractBtn.getAttribute('data-contract-id');
        var mid = pinContractBtn.getAttribute('data-msg-id');
        var listId = pinContractBtn.getAttribute('data-list-id');
        if (cid && mid && typeof window.pinContractChatMessage === 'function') {
          window.pinContractChatMessage(cid, mid);
          renderContractChat(cid, listId);
        }
        document.querySelectorAll('.chat-msg-dropdown').forEach(function (d) { d.classList.add('hidden'); });
        return;
      }
      var pinnedItem = e.target.closest('.chat-pinned-item');
      if (pinnedItem) {
        e.preventDefault();
        var mid = pinnedItem.getAttribute('data-msg-id');
        if (mid) {
          var el = document.getElementById('chat-msg-' + mid);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      var delBtn = e.target.closest('.chat-msg-delete-btn');
      if (delBtn) {
        e.preventDefault();
        if (delBtn.classList.contains('contract-chat-delete')) {
          var cid = delBtn.getAttribute('data-contract-id');
          var mid = delBtn.getAttribute('data-msg-id');
          var lid = delBtn.getAttribute('data-list-id') || 'contract-chat-message-list';
          if (cid && mid && typeof window.deleteContractChatMessage === 'function') {
            window.deleteContractChatMessage(cid, mid);
            renderContractChat(cid, lid);
          }
        } else {
          var ch = delBtn.getAttribute('data-channel');
          var mid = delBtn.getAttribute('data-msg-id');
          if (ch && mid && typeof window.deleteChatMessage === 'function') {
            window.deleteChatMessage(ch, mid);
            renderChatMessageList(ch);
          }
        }
        document.querySelectorAll('.chat-msg-dropdown').forEach(function (d) { d.classList.add('hidden'); });
        return;
      }
      var menuBtn = e.target.closest('.chat-msg-menu-btn');
      if (menuBtn) {
        e.preventDefault();
        var drop = menuBtn.nextElementSibling;
        if (drop && drop.classList.contains('chat-msg-dropdown')) {
          drop.classList.toggle('hidden');
          document.querySelectorAll('.chat-msg-dropdown').forEach(function (d) { if (d !== drop) d.classList.add('hidden'); });
        }
        return;
      }
      if (!e.target.closest('.chat-message-actions')) {
        document.querySelectorAll('.chat-msg-dropdown').forEach(function (d) { d.classList.add('hidden'); });
      }
    });
  }

  /* Attach to window for app.js and others */
  window.renderContractChat = renderContractChat;
  window.openContractChatModal = openContractChatModal;
  window.renderChatRoomList = renderChatRoomList;
  window.selectChatRoom = selectChatRoom;
  window.openConversation = openConversation;
  window.closeConversation = closeConversation;
  window.initChatPanel = initChatPanel;
  window.applyChatTabVisibility = applyChatTabVisibility;
  window.updateChatHeader = updateChatHeader;
  window.renderChatMessageList = renderChatMessageList;
  window.isImageFileName = isImageFileName;
  window.uploadChatFiles = uploadChatFiles;
  window.getSelectedChatRoom = function () { return selectedChatRoom; };
  window.isChatPanelOpen = function () { return isChatOpen; };
})();
