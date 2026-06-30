(function () {
  'use strict';

  // ========================================================
  // 세움 OS - 필건축사(외부 협력) 도면 업로드 모듈
  // 부서별 업무 > 설계팀 > 필건축사
  // 업로드 시 설계팀 + 시공팀 전원에게 알림 발사
  // (design-haeyoung.js 와 동일 구조 — 외부 협력 건축사별 분리 페이지/테이블)
  // ========================================================

  var BUCKET = 'contract_files';
  var STORAGE_PREFIX = 'pil_submissions';
  var realtimeSubscribed = false;
  var cachedRows = [];
  var listFetchInflight = null;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function sanitizeFileName(name) {
    // design-haeyoung.js 와 동일한 규칙:
    // ASCII 영숫자/._- 만 남기고 한글·괄호·공백·특수기호는 모두 '_' 로 치환.
    // Supabase Storage 가 일부 비-ASCII 경로(괄호·한글 포함)를 거부하는 사례 회피.
    var s = String(name || '').trim();
    if (!s) return 'drawing';
    var lastDot = s.lastIndexOf('.');
    var ext = lastDot >= 0 ? s.slice(lastDot + 1).toLowerCase() : '';
    var base = lastDot >= 0 ? s.slice(0, lastDot) : s;
    var safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'drawing';
    var safeExt = (ext || '').replace(/[^a-zA-Z0-9]/g, '');
    var combined = safeExt ? (safeBase.slice(0, 180) + '.' + safeExt) : safeBase.slice(0, 180);
    return combined.slice(0, 200);
  }
  function formatBytes(n) {
    if (!n || n < 0) return '';
    if (n < 1024) return n + 'B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB';
    return (n / 1024 / 1024).toFixed(2) + 'MB';
  }
  function formatDateTime(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function getSupabase() { return window.seumSupabase || null; }
  function getCurrentEmployee() {
    if (!window.seumAuth) return null;
    if (window.seumAuth.currentEmployee) return window.seumAuth.currentEmployee;
    if (typeof window.seumAuth.getCurrentEmployee === 'function') {
      return window.seumAuth.getCurrentEmployee();
    }
    return null;
  }

  // --------------------------------------------------
  // 계약 옵션 채우기 — 기존 localStorage 의 contracts 활용
  // --------------------------------------------------
  function isExternalArchitectUser() {
    var emp = getCurrentEmployee();
    if (!emp) return false;
    var p = String(emp.permission || '').toLowerCase();
    var r = String(emp.role || '').toLowerCase();
    return p === 'external_architect' || r === 'external_architect';
  }

  function loadContractOptions() {
    var sel = $('py-contract');
    if (!sel) return;
    // 외부 협력 건축사에게는 고객 계약명 노출 안 함 — 드롭다운 자체를 숨김 (계약 연결 옵션 제거)
    if (isExternalArchitectUser()) {
      var field = sel.closest('.hy-form-field');
      if (field) field.style.display = 'none';
      sel.innerHTML = '<option value="">선택 안 함</option>';
      return;
    }
    var contracts = [];
    try {
      var raw = localStorage.getItem('seum_contracts');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) contracts = parsed;
      }
    } catch (e) { /* ignore */ }
    // 최근 100건만 (계약 많은 경우 대비)
    contracts = contracts.filter(function (c) {
      return c && !c.isDeleted && (c.localId || c.local_id);
    }).slice(-100).reverse();
    var html = '<option value="">선택 안 함</option>';
    contracts.forEach(function (c) {
      var id = c.localId || c.local_id;
      var label = (c.customerName || c.customer_name || '고객명 미상');
      if (c.contractDate || c.contract_date) {
        label += ' (' + (c.contractDate || c.contract_date) + ')';
      }
      html += '<option value="' + escapeAttr(id) + '">' + escapeHtml(label) + '</option>';
    });
    sel.innerHTML = html;
  }

  // --------------------------------------------------
  // 파일 업로드 -> Supabase Storage
  // --------------------------------------------------
  function uploadFile(file) {
    var supabase = getSupabase();
    if (!supabase || !file) return Promise.resolve(null);
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    if (month < 10) month = '0' + month;
    var safe = sanitizeFileName(file.name);
    var path = STORAGE_PREFIX + '/' + year + '/' + month + '/' + Date.now() + '_' + safe;
    return supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    }).then(function (res) {
      if (res && res.error) {
        console.error('[필건축사] 파일 업로드 실패:', res.error);
        // 사용자 폼에 정확한 사유가 뜨도록 throw — uploadFile() 호출부 catch 가 메시지 표시
        throw new Error('파일 업로드 실패: ' + (res.error.message || res.error.statusCode || '알 수 없는 Storage 오류'));
      }
      var publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      return { url: publicUrl, path: path, name: file.name, size: file.size, type: file.type };
    });
  }

  // --------------------------------------------------
  // 메타데이터 insert
  // --------------------------------------------------
  function insertSubmission(row) {
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve({ error: new Error('Supabase 미연결') });
    return supabase.from('pil_submissions').insert(row).select().single();
  }

  // --------------------------------------------------
  // 설계 + 시공팀 전원 알림
  // --------------------------------------------------
  function notifyTeams(opts) {
    if (!window.seumNotifications || typeof window.seumNotifications.send !== 'function') return;
    var title = '📐 필건축사 도면 도착';
    var body = '제목: ' + (opts.title || '-') +
               (opts.uploadedBy ? ' · 업로드: ' + opts.uploadedBy : '');
    ['설계', '시공'].forEach(function (team) {
      window.seumNotifications.send({
        recipientTeam: team,
        title: title,
        body: body,
        contractId: opts.contractLocalId || null,
        customerName: null,
        salesPerson: opts.uploadedBy || null
      });
    });
  }

  // --------------------------------------------------
  // 목록 조회
  // --------------------------------------------------
  function fetchList() {
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve([]);
    if (listFetchInflight) return listFetchInflight;
    listFetchInflight = supabase.from('pil_submissions')
      .select('*')
      .eq('is_deleted', false)
      .order('uploaded_at', { ascending: false })
      .limit(200)
      .then(function (res) {
        listFetchInflight = null;
        if (res.error) {
          console.warn('[필건축사] 목록 조회 실패:', res.error.message);
          return [];
        }
        cachedRows = res.data || [];
        return cachedRows;
      })
      .catch(function (err) {
        listFetchInflight = null;
        console.warn('[필건축사] 목록 조회 예외:', err);
        return [];
      });
    return listFetchInflight;
  }

  // --------------------------------------------------
  // 도면 미리보기 모달 (PDF·이미지) — 페이지 공용, 1회만 생성
  // 해영/필 모듈이 동일하게 정의 → 먼저 로드된 쪽이 window.seumDrawingPreview 를 세팅
  // --------------------------------------------------
  function isPreviewable(name, type) {
    var ext = String(name || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return true;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].indexOf(ext) >= 0) return true;
    var t = String(type || '').toLowerCase();
    return t.indexOf('pdf') >= 0 || t.indexOf('image/') === 0;
  }
  function ensurePreview() {
    if (window.seumDrawingPreview) return window.seumDrawingPreview;
    var overlay = document.createElement('div');
    overlay.id = 'seum-preview-overlay';
    overlay.className = 'seum-preview-overlay';
    overlay.setAttribute('hidden', '');
    overlay.innerHTML =
      '<div class="seum-preview-box" role="dialog" aria-modal="true">' +
        '<div class="seum-preview-head">' +
          '<span class="seum-preview-title"></span>' +
          '<span class="seum-preview-actions">' +
            '<a class="btn btn-sm btn-secondary seum-preview-newtab" target="_blank" rel="noopener">새 탭</a>' +
            '<button type="button" class="btn btn-sm btn-secondary seum-preview-close">닫기 ✕</button>' +
          '</span>' +
        '</div>' +
        '<div class="seum-preview-body"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    var bodyEl = overlay.querySelector('.seum-preview-body');
    var titleEl = overlay.querySelector('.seum-preview-title');
    var newtabEl = overlay.querySelector('.seum-preview-newtab');
    function close() {
      overlay.setAttribute('hidden', '');
      bodyEl.innerHTML = '';   // iframe/img 비워 로딩 중단·메모리 해제
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || (e.target.closest && e.target.closest('.seum-preview-close'))) close();
    });
    function open(url, name, type) {
      if (!url) return;
      titleEl.textContent = name || '미리보기';
      newtabEl.href = url;
      bodyEl.innerHTML = '';
      var ext = String(name || '').split('.').pop().toLowerCase();
      var isPdf = ext === 'pdf' || String(type || '').toLowerCase().indexOf('pdf') >= 0;
      var node;
      if (isPdf) {
        node = document.createElement('iframe');
        node.className = 'seum-preview-frame';
        node.title = 'PDF 미리보기';
      } else {
        node = document.createElement('img');
        node.className = 'seum-preview-img';
        node.alt = name || '';
      }
      node.src = url;   // 속성이 아닌 property 로 설정 → 인젝션 안전
      bodyEl.appendChild(node);
      overlay.removeAttribute('hidden');
      document.addEventListener('keydown', onKey);
    }
    window.seumDrawingPreview = open;
    return open;
  }

  // --------------------------------------------------
  // 목록 렌더
  // --------------------------------------------------
  function renderList(rows) {
    var container = $('py-list');
    if (!container) return;
    if (!rows || !rows.length) {
      container.innerHTML = '<div class="hy-empty">아직 업로드된 도면이 없습니다.</div>';
      return;
    }
    container.innerHTML = rows.map(function (r) {
      var ext = (r.file_name || '').split('.').pop().toLowerCase();
      var icon = '📄';
      if (ext === 'pdf') icon = '📕';
      else if (ext === 'dwg' || ext === 'dxf') icon = '📐';
      else if (['png','jpg','jpeg','gif','webp'].indexOf(ext) >= 0) icon = '🖼';
      var sizeLabel = r.file_size ? formatBytes(r.file_size) : '';
      var metaParts = [
        formatDateTime(r.uploaded_at),
        r.uploaded_by_name ? '업로드: ' + r.uploaded_by_name : '',
        r.contract_local_id ? '계약: ' + r.contract_local_id : '',
        sizeLabel
      ].filter(Boolean);
      var actions = '';
      if (r.file_url) {
        if (isPreviewable(r.file_name, r.file_type)) {
          actions += '<button type="button" class="btn btn-sm btn-primary" data-act="py-preview" data-url="' + escapeAttr(r.file_url) + '" data-name="' + escapeAttr(r.file_name || '') + '" data-type="' + escapeAttr(r.file_type || '') + '">미리보기</button>';
        }
        actions += '<a class="btn btn-sm btn-secondary" href="' + escapeAttr(r.file_url) + '" target="_blank" rel="noopener">열기</a>';
        actions += '<a class="btn btn-sm btn-secondary" href="' + escapeAttr(r.file_url) + '" download="' + escapeAttr(r.file_name || '') + '">다운로드</a>';
      }
      // 삭제 버튼은 제거 — 실수/임의 삭제 방지를 위해 목록에서 삭제 기능을 노출하지 않는다.
      // 설계 담당자: 사내 팀원은 도면별로 입력·저장 가능, 외부 협력 건축사 본인에게는 읽기 전용 표시.
      var manager = r.design_manager || '';
      var managerHtml;
      if (isExternalArchitectUser()) {
        managerHtml = manager
          ? '<div class="hy-item-manager">설계 담당자: <strong>' + escapeHtml(manager) + '</strong></div>'
          : '';
      } else {
        var mid = escapeAttr(r.id);
        managerHtml =
          '<div class="hy-manager-row">' +
            '<label class="hy-manager-label">설계 담당자</label>' +
            '<input type="text" class="hy-manager-input" data-id="' + mid + '" value="' + escapeAttr(manager) + '" placeholder="담당자명 입력" maxlength="40">' +
            '<button type="button" class="btn btn-sm btn-primary" data-act="py-save-manager" data-id="' + mid + '">저장</button>' +
            '<span class="hy-manager-msg" data-id="' + mid + '"></span>' +
          '</div>';
      }
      return '<div class="hy-item" data-id="' + escapeAttr(r.id) + '">' +
        '<div class="hy-item-icon">' + icon + '</div>' +
        '<div class="hy-item-body">' +
          '<div class="hy-item-title">' + escapeHtml(r.title || '제목 없음') + '</div>' +
          (r.description ? '<div class="hy-item-desc">' + escapeHtml(r.description) + '</div>' : '') +
          '<div class="hy-item-meta">' + metaParts.map(escapeHtml).join(' · ') + '</div>' +
          managerHtml +
        '</div>' +
        '<div class="hy-item-actions">' + actions + '</div>' +
      '</div>';
    }).join('');
  }

  function refreshAndRender() {
    return fetchList().then(renderList);
  }

  // --------------------------------------------------
  // 설계 담당자 저장
  // (삭제 기능은 제거됨 — 목록에서 도면을 지울 수 없다)
  // --------------------------------------------------
  function saveManager(id, name) {
    var supabase = getSupabase();
    if (!supabase || !id) return Promise.resolve(false);
    return supabase.from('pil_submissions')
      .update({ design_manager: name || null })
      .eq('id', id)
      .then(function (res) {
        if (res.error) {
          console.warn('[필건축사] 담당자 저장 실패:', res.error.message);
          return false;
        }
        return true;
      })
      .catch(function (err) {
        console.warn('[필건축사] 담당자 저장 예외:', err);
        return false;
      });
  }

  // --------------------------------------------------
  // 폼 submit 핸들러
  // --------------------------------------------------
  function bindForm() {
    var form = $('py-form');
    if (!form || form._pyBound) return;
    form._pyBound = true;

    var fileInput = $('py-file');
    var fileInfo = $('py-file-info');
    if (fileInput && fileInfo) {
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) { fileInfo.textContent = '선택된 파일 없음'; return; }
        fileInfo.textContent = f.name + ' (' + formatBytes(f.size) + ')';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgEl = $('py-submit-msg');
      var submitBtn = $('py-submit');
      var title = ($('py-title').value || '').trim();
      var desc = ($('py-desc').value || '').trim();
      var contractId = ($('py-contract').value || '').trim() || null;
      var file = fileInput && fileInput.files && fileInput.files[0];

      if (!title) {
        msgEl.className = 'hy-submit-msg hy-err';
        msgEl.textContent = '제목을 입력하세요.';
        return;
      }
      if (!file) {
        msgEl.className = 'hy-submit-msg hy-err';
        msgEl.textContent = '도면 파일을 선택하세요.';
        return;
      }

      var emp = getCurrentEmployee();
      var uploadedByName = (emp && emp.name) ? emp.name : '필건축사';

      submitBtn.disabled = true;
      msgEl.className = 'hy-submit-msg';
      msgEl.textContent = '업로드 중…';

      uploadFile(file).then(function (uploaded) {
        if (!uploaded) throw new Error('파일 업로드 실패');
        return insertSubmission({
          title: title,
          description: desc || null,
          file_name: uploaded.name,
          file_url: uploaded.url,
          file_path: uploaded.path,
          file_size: uploaded.size || null,
          file_type: uploaded.type || null,
          contract_local_id: contractId,
          uploaded_by_name: uploadedByName
        }).then(function (res) {
          if (res.error) throw res.error;
          notifyTeams({
            title: title,
            uploadedBy: uploadedByName,
            contractLocalId: contractId
          });
          msgEl.className = 'hy-submit-msg hy-ok';
          msgEl.textContent = '업로드 완료 · 설계팀·시공팀에 알림이 발사되었습니다.';
          // 폼 리셋
          $('py-title').value = '';
          $('py-desc').value = '';
          $('py-contract').value = '';
          if (fileInput) fileInput.value = '';
          if (fileInfo) fileInfo.textContent = '선택된 파일 없음';
          return refreshAndRender();
        });
      }).catch(function (err) {
        console.error('[필건축사] 업로드 실패:', err);
        msgEl.className = 'hy-submit-msg hy-err';
        msgEl.textContent = '업로드 실패: ' + (err && err.message ? err.message : '알 수 없는 오류');
      }).then(function () {
        submitBtn.disabled = false;
      });
    });

    // 설계 담당자 저장 (위임) — 삭제 기능은 제거되어 더 이상 노출하지 않는다.
    var list = $('py-list');
    if (list && !list._pyBound) {
      list._pyBound = true;
      list.addEventListener('click', function (e) {
        var prevBtn = e.target.closest && e.target.closest('[data-act="py-preview"]');
        if (prevBtn) {
          ensurePreview()(prevBtn.getAttribute('data-url'), prevBtn.getAttribute('data-name'), prevBtn.getAttribute('data-type'));
          return;
        }
        var btn = e.target.closest && e.target.closest('[data-act="py-save-manager"]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        if (!id) return;
        var input = list.querySelector('.hy-manager-input[data-id="' + id + '"]');
        var msg = list.querySelector('.hy-manager-msg[data-id="' + id + '"]');
        var name = input ? (input.value || '').trim() : '';
        btn.disabled = true;
        if (msg) { msg.className = 'hy-manager-msg'; msg.textContent = '저장 중…'; }
        saveManager(id, name).then(function (ok) {
          if (msg) {
            msg.className = 'hy-manager-msg ' + (ok ? 'hy-ok' : 'hy-err');
            msg.textContent = ok ? '저장됨' : '저장 실패';
          }
          btn.disabled = false;
        });
      });
    }
  }

  // --------------------------------------------------
  // Realtime 구독 (다른 세션이 업로드해도 즉시 반영)
  // --------------------------------------------------
  function subscribeRealtime() {
    var supabase = getSupabase();
    if (!supabase || realtimeSubscribed) return;
    realtimeSubscribed = true;
    supabase.channel('py-submissions')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'pil_submissions' },
          function () {
            if (document.getElementById('section-design-pil')
                && document.getElementById('section-design-pil').classList.contains('active')) {
              refreshAndRender();
            } else {
              cachedRows = [];
            }
          })
      .subscribe();
  }

  // --------------------------------------------------
  // 외부 진입점 — app.js 가 섹션 전환 시 호출
  // --------------------------------------------------
  function renderSection() {
    bindForm();
    loadContractOptions();
    subscribeRealtime();
    refreshAndRender();
  }

  window.renderPilSubmissions = renderSection;

})();
