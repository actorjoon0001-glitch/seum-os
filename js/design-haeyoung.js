(function () {
  'use strict';

  // ========================================================
  // 세움 OS - 해영 건축사(외부 협력) 도면 업로드 모듈
  // 부서별 업무 > 설계팀 > 해영 건축사
  // 업로드 시 설계팀 + 시공팀 전원에게 알림 발사
  // ========================================================

  var BUCKET = 'contract_files';
  var STORAGE_PREFIX = 'haeyoung_submissions';
  var realtimeSubscribed = false;
  var cachedRows = [];
  var listFetchInflight = null;
  var lastListError = null;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function sanitizeFileName(name) {
    // 기존 sanitizeNoticeFileName 과 동일한 규칙으로 정렬:
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
    var sel = $('hy-contract');
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
        console.error('[해영] 파일 업로드 실패:', res.error);
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
    return supabase.from('haeyoung_submissions').insert(row).select().single();
  }

  // --------------------------------------------------
  // 설계 + 시공팀 전원 알림
  // --------------------------------------------------
  function notifyTeams(opts) {
    if (!window.seumNotifications || typeof window.seumNotifications.send !== 'function') return;
    var title = '📐 해영 건축사 도면 도착';
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
    listFetchInflight = supabase.from('haeyoung_submissions')
      .select('*')
      .eq('is_deleted', false)
      .order('uploaded_at', { ascending: false })
      .limit(200)
      .then(function (res) {
        listFetchInflight = null;
        if (res.error) {
          lastListError = res.error.message || '알 수 없는 조회 오류';
          console.warn('[해영] 목록 조회 실패:', res.error.message);
          return [];
        }
        lastListError = null;
        cachedRows = res.data || [];
        return cachedRows;
      })
      .catch(function (err) {
        listFetchInflight = null;
        lastListError = (err && err.message) ? err.message : '알 수 없는 조회 예외';
        console.warn('[해영] 목록 조회 예외:', err);
        return [];
      });
    return listFetchInflight;
  }

  // --------------------------------------------------
  // 목록 렌더
  // --------------------------------------------------
  function renderList(rows) {
    var container = $('hy-list');
    if (!container) return;
    if (!rows || !rows.length) {
      if (lastListError) {
        // 조회 실패를 빈 목록("없음")으로 위장하지 않는다 — 사라짐과 로드 실패를 구분.
        container.innerHTML = '<div class="hy-empty hy-err">이력을 불러오지 못했습니다: ' +
          escapeHtml(lastListError) + ' · 새로고침 후 다시 시도해 주세요.</div>';
      } else {
        container.innerHTML = '<div class="hy-empty">아직 업로드된 도면이 없습니다.</div>';
      }
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
        actions += '<a class="btn btn-sm btn-primary" href="' + escapeAttr(r.file_url) + '" target="_blank" rel="noopener">열기</a>';
        actions += '<a class="btn btn-sm btn-secondary" href="' + escapeAttr(r.file_url) + '" download="' + escapeAttr(r.file_name || '') + '">다운로드</a>';
      }
      actions += '<button type="button" class="btn btn-sm btn-danger" data-act="hy-delete" data-id="' + escapeAttr(r.id) + '">삭제</button>';
      return '<div class="hy-item" data-id="' + escapeAttr(r.id) + '">' +
        '<div class="hy-item-icon">' + icon + '</div>' +
        '<div class="hy-item-body">' +
          '<div class="hy-item-title">' + escapeHtml(r.title || '제목 없음') + '</div>' +
          (r.description ? '<div class="hy-item-desc">' + escapeHtml(r.description) + '</div>' : '') +
          '<div class="hy-item-meta">' + metaParts.map(escapeHtml).join(' · ') + '</div>' +
        '</div>' +
        '<div class="hy-item-actions">' + actions + '</div>' +
      '</div>';
    }).join('');
  }

  function refreshAndRender() {
    return fetchList().then(renderList);
  }

  // --------------------------------------------------
  // 삭제 (soft delete)
  // --------------------------------------------------
  function deleteSubmission(id) {
    var supabase = getSupabase();
    if (!supabase || !id) return Promise.resolve();
    var emp = getCurrentEmployee();
    var byName = (emp && emp.name) ? emp.name : '알 수 없음';
    return supabase.from('haeyoung_submissions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_name: byName
      })
      .eq('id', id)
      .then(function (res) {
        if (res.error) {
          console.warn('[해영] 삭제 실패:', res.error.message);
          window.alert('삭제 실패: ' + res.error.message);
        }
        return refreshAll();
      });
  }

  // --------------------------------------------------
  // 삭제된 항목(휴지통) 조회 / 렌더 / 복구
  // --------------------------------------------------
  function fetchDeletedList() {
    var supabase = getSupabase();
    if (!supabase) return Promise.resolve([]);
    return supabase.from('haeyoung_submissions')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false })
      .limit(200)
      .then(function (res) {
        if (res.error) {
          console.warn('[해영] 삭제 목록 조회 실패:', res.error.message);
          return [];
        }
        return res.data || [];
      })
      .catch(function (err) {
        console.warn('[해영] 삭제 목록 조회 예외:', err);
        return [];
      });
  }

  function renderDeletedList(rows) {
    var container = $('hy-trash-list');
    if (!container) return;
    if (!rows || !rows.length) {
      container.innerHTML = '<div class="hy-empty">삭제된 항목이 없습니다.</div>';
      return;
    }
    container.innerHTML = rows.map(function (r) {
      var metaParts = [
        r.deleted_at ? '삭제: ' + formatDateTime(r.deleted_at) : '삭제 시각 미상',
        r.deleted_by_name ? '삭제자: ' + r.deleted_by_name : '삭제자 미상',
        r.uploaded_by_name ? '원업로드: ' + r.uploaded_by_name : '',
        '업로드일: ' + formatDateTime(r.uploaded_at)
      ].filter(Boolean);
      return '<div class="hy-item hy-item-deleted" data-id="' + escapeAttr(r.id) + '">' +
        '<div class="hy-item-icon">🗑</div>' +
        '<div class="hy-item-body">' +
          '<div class="hy-item-title">' + escapeHtml(r.title || '제목 없음') + '</div>' +
          '<div class="hy-item-meta">' + metaParts.map(escapeHtml).join(' · ') + '</div>' +
        '</div>' +
        '<div class="hy-item-actions">' +
          '<button type="button" class="btn btn-sm btn-primary" data-act="hy-restore" data-id="' + escapeAttr(r.id) + '">복구</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function isTrashOpen() {
    var box = $('hy-trash');
    return !!(box && box.style.display !== 'none');
  }

  function refreshTrash() {
    if (!isTrashOpen()) return Promise.resolve();
    return fetchDeletedList().then(renderDeletedList);
  }

  // 활성 목록 + (열려있으면) 휴지통 동시 갱신
  function refreshAll() {
    return Promise.all([refreshAndRender(), refreshTrash()]);
  }

  function restoreSubmission(id) {
    var supabase = getSupabase();
    if (!supabase || !id) return Promise.resolve();
    return supabase.from('haeyoung_submissions')
      .update({ is_deleted: false, deleted_at: null, deleted_by_name: null })
      .eq('id', id)
      .then(function (res) {
        if (res.error) {
          console.warn('[해영] 복구 실패:', res.error.message);
          window.alert('복구 실패: ' + res.error.message);
        }
        return refreshAll();
      });
  }

  // --------------------------------------------------
  // 폼 submit 핸들러
  // --------------------------------------------------
  function bindForm() {
    var form = $('hy-form');
    if (!form || form._hyBound) return;
    form._hyBound = true;

    var fileInput = $('hy-file');
    var fileInfo = $('hy-file-info');
    if (fileInput && fileInfo) {
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) { fileInfo.textContent = '선택된 파일 없음'; return; }
        fileInfo.textContent = f.name + ' (' + formatBytes(f.size) + ')';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgEl = $('hy-submit-msg');
      var submitBtn = $('hy-submit');
      var title = ($('hy-title').value || '').trim();
      var desc = ($('hy-desc').value || '').trim();
      var contractId = ($('hy-contract').value || '').trim() || null;
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
      var uploadedByName = (emp && emp.name) ? emp.name : '해영 건축사';

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
          $('hy-title').value = '';
          $('hy-desc').value = '';
          $('hy-contract').value = '';
          if (fileInput) fileInput.value = '';
          if (fileInfo) fileInfo.textContent = '선택된 파일 없음';
          return refreshAndRender();
        });
      }).catch(function (err) {
        console.error('[해영] 업로드 실패:', err);
        msgEl.className = 'hy-submit-msg hy-err';
        msgEl.textContent = '업로드 실패: ' + (err && err.message ? err.message : '알 수 없는 오류');
      }).then(function () {
        submitBtn.disabled = false;
      });
    });

    // 삭제 버튼 (위임)
    var list = $('hy-list');
    if (list && !list._hyBound) {
      list._hyBound = true;
      list.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-act="hy-delete"]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        if (!id) return;
        if (!window.confirm('이 도면 업로드 기록을 삭제할까요?\n(삭제해도 "삭제된 항목 보기"에서 복구할 수 있습니다.)')) return;
        deleteSubmission(id);
      });
    }

    // 휴지통(삭제된 항목) 토글
    var trashToggle = $('hy-trash-toggle');
    var trashBox = $('hy-trash');
    if (trashToggle && trashBox && !trashToggle._hyBound) {
      trashToggle._hyBound = true;
      trashToggle.addEventListener('click', function () {
        if (isTrashOpen()) {
          trashBox.style.display = 'none';
          trashToggle.textContent = '🗑 삭제된 항목 보기';
        } else {
          trashBox.style.display = '';
          trashToggle.textContent = '🗑 삭제된 항목 숨기기';
          refreshTrash();
        }
      });
    }

    // 복구 버튼 (위임)
    var trashList = $('hy-trash-list');
    if (trashList && !trashList._hyBound) {
      trashList._hyBound = true;
      trashList.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-act="hy-restore"]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        if (!id) return;
        restoreSubmission(id);
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
    supabase.channel('hy-submissions')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'haeyoung_submissions' },
          function () {
            if (document.getElementById('section-design-haeyoung')
                && document.getElementById('section-design-haeyoung').classList.contains('active')) {
              refreshAll();
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

  window.renderHaeyoungSubmissions = renderSection;

})();
