(function () {
  'use strict';

  /* ====================================================================
   * 세움OS 마케팅팀 업무 관리 모듈
   * - 월별 영상관리 (marketing_videos)
   * - 촬영 스케줄 (marketing_schedules)
   * - 파일 공유 (marketing_files / Supabase Storage)
   * - 영상 NAS 링크 (marketing_nas_links)
   * ==================================================================== */

  function supa() { return window.seumSupabase || null; }
  function curUser() { return window.seumAuth && window.seumAuth.currentEmployee; }

  function showToast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log('[마케팅]', msg);
  }

  function formatDate(str) {
    if (!str) return '-';
    return str.slice(0, 10);
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ====================================================================
  // 1. 월별 영상관리
  // ====================================================================

  var mvMonth = '';    // '2026-04'
  var mvVideos = [];
  var mvEditId = null;

  function mvDefaultMonth() {
    if (mvMonth) return mvMonth;
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function mvBuildMonthOptions() {
    var options = [];
    var now = new Date();
    for (var i = -3; i <= 9; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var label = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월';
      options.push({ val: val, label: label });
    }
    return options;
  }

  function mvStatusBadge(status) {
    var map = {
      '촬영예정': 'mv-badge-scheduled',
      '촬영완료': 'mv-badge-shot',
      '편집중': 'mv-badge-editing',
      '업로드완료': 'mv-badge-done'
    };
    var cls = map[status] || 'mv-badge-scheduled';
    return '<span class="mv-status-badge ' + cls + '">' + escHtml(status || '촬영예정') + '</span>';
  }

  function mvLoad(yearMonth) {
    var db = supa();
    if (!db) { mvVideos = []; mvRenderTable(); return; }
    db.from('marketing_videos')
      .select('*')
      .eq('year_month', yearMonth)
      .order('shoot_date', { ascending: true })
      .then(function (res) {
        if (res && res.error) { console.error('marketing_videos load', res.error); mvVideos = []; }
        else mvVideos = (res && res.data) || [];
        mvRenderTable();
      })
      .catch(function (e) { console.error('marketing_videos load', e); mvVideos = []; mvRenderTable(); });
  }

  function mvRenderTable() {
    var tbody = document.getElementById('tbody-mv');
    if (!tbody) return;
    if (!mvVideos.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:2rem">등록된 영상이 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = mvVideos.map(function (v) {
      var nasBtn = v.nas_link
        ? '<a href="' + escHtml(v.nas_link) + '" target="_blank" rel="noopener" class="btn btn-xs btn-secondary">NAS 이동</a> ' +
          '<button type="button" class="btn btn-xs btn-secondary" onclick="window.mvCopyNas(\'' + escHtml(v.id) + '\')">복사</button>'
        : '<span style="color:#9ca3af">-</span>';
      var checkIcon = v.status === '업로드완료'
        ? '<span class="mv-check-done" title="업로드 완료">✓</span>'
        : '<span style="color:#d1d5db">○</span>';
      return '<tr>' +
        '<td>' + escHtml(v.title) + '</td>' +
        '<td>' + formatDate(v.shoot_date) + '</td>' +
        '<td>' + escHtml(v.assignee || '-') + '</td>' +
        '<td>' + mvStatusBadge(v.status) + '</td>' +
        '<td>' + nasBtn + '</td>' +
        '<td style="text-align:center">' + checkIcon + '</td>' +
        '<td><button type="button" class="btn btn-xs btn-secondary" onclick="window.mvEdit(\'' + v.id + '\')">수정</button> ' +
        '<button type="button" class="btn btn-xs btn-danger" onclick="window.mvDelete(\'' + v.id + '\')">삭제</button></td>' +
        '</tr>';
    }).join('');
  }

  window.mvCopyNas = function (id) {
    var v = mvVideos.find(function (x) { return String(x.id) === String(id); });
    if (!v || !v.nas_link) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(v.nas_link).then(function () { showToast('링크를 복사했습니다.', 'success'); });
    } else {
      var tmp = document.createElement('input');
      tmp.value = v.nas_link;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      showToast('링크를 복사했습니다.', 'success');
    }
  };

  window.mvEdit = function (id) {
    var v = mvVideos.find(function (x) { return String(x.id) === String(id); });
    if (!v) return;
    mvEditId = id;
    document.getElementById('mv-title').value = v.title || '';
    document.getElementById('mv-shoot-date').value = v.shoot_date || '';
    document.getElementById('mv-assignee').value = v.assignee || '';
    document.getElementById('mv-status').value = v.status || '촬영예정';
    document.getElementById('mv-nas-link').value = v.nas_link || '';
    document.getElementById('mv-memo').value = v.memo || '';
    document.getElementById('mv-form-title').textContent = '영상 수정';
    document.getElementById('mv-form-wrap').classList.remove('hidden');
    document.getElementById('mv-form-wrap').scrollIntoView({ behavior: 'smooth' });
  };

  window.mvDelete = function (id) {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;
    var db = supa();
    if (!db) { showToast('Supabase 연결 오류', 'error'); return; }
    db.from('marketing_videos').delete().eq('id', id)
      .then(function (res) {
        if (res && res.error) { showToast('삭제 실패: ' + res.error.message, 'error'); return; }
        showToast('삭제되었습니다.', 'success');
        mvLoad(mvDefaultMonth());
      })
      .catch(function (e) { showToast('삭제 실패', 'error'); console.error(e); });
  };

  function mvSave(data) {
    var db = supa();
    if (!db) { showToast('Supabase 연결 오류', 'error'); return; }
    var cur = curUser();
    var promise;
    if (mvEditId) {
      promise = db.from('marketing_videos').update(data).eq('id', mvEditId);
    } else {
      data.year_month = mvDefaultMonth();
      data.created_by = cur && cur.authUserId ? cur.authUserId : null;
      data.created_by_name = cur && cur.name ? cur.name : null;
      promise = db.from('marketing_videos').insert(data);
    }
    promise.then(function (res) {
      if (res && res.error) { showToast('저장 실패: ' + res.error.message, 'error'); return; }
      showToast(mvEditId ? '수정되었습니다.' : '등록되었습니다.', 'success');
      mvEditId = null;
      document.getElementById('mv-form-wrap').classList.add('hidden');
      document.getElementById('form-mv').reset();
      mvLoad(mvDefaultMonth());
    }).catch(function (e) { showToast('저장 실패', 'error'); console.error(e); });
  }

  function renderMarketingVideos() {
    var sel = document.getElementById('mv-month-select');
    if (sel) {
      if (!sel.options.length) {
        mvBuildMonthOptions().forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o.val;
          opt.textContent = o.label;
          sel.appendChild(opt);
        });
      }
      if (!mvMonth) mvMonth = mvDefaultMonth();
      sel.value = mvMonth;
    }
    mvLoad(mvMonth || mvDefaultMonth());
  }

  function initMarketingVideos() {
    var sel = document.getElementById('mv-month-select');
    if (sel) {
      sel.addEventListener('change', function () {
        mvMonth = this.value;
        mvLoad(mvMonth);
      });
    }
    var btnAdd = document.getElementById('btn-mv-add');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        mvEditId = null;
        document.getElementById('form-mv').reset();
        document.getElementById('mv-form-title').textContent = '영상 추가';
        var wrap = document.getElementById('mv-form-wrap');
        wrap.classList.toggle('hidden');
        if (!wrap.classList.contains('hidden')) wrap.scrollIntoView({ behavior: 'smooth' });
      });
    }
    var btnCancel = document.getElementById('btn-mv-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        mvEditId = null;
        document.getElementById('form-mv').reset();
        document.getElementById('mv-form-wrap').classList.add('hidden');
      });
    }
    var form = document.getElementById('form-mv');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = document.getElementById('mv-title').value.trim();
        if (!title) { showToast('영상 제목을 입력하세요.', 'error'); return; }
        mvSave({
          title: title,
          shoot_date: document.getElementById('mv-shoot-date').value || null,
          assignee: document.getElementById('mv-assignee').value.trim() || null,
          status: document.getElementById('mv-status').value || '촬영예정',
          nas_link: document.getElementById('mv-nas-link').value.trim() || null,
          memo: document.getElementById('mv-memo').value.trim() || null
        });
      });
    }
  }

  // ====================================================================
  // 2. 촬영 스케줄
  // ====================================================================

  var msYear = 0;
  var msMonth = 0;
  var msSchedules = [];
  var msEditId = null;
  var msSelectedDate = null; // 선택된 날짜 (null이면 전체)

  // 상태별 색상
  var MS_STATUS_COLOR = {
    '촬영예정': { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    '촬영중':   { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
    '촬영완료': { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
    '편집중':   { bg: '#ede9fe', text: '#6d28d9', dot: '#8b5cf6' },
    '업로드완료':{ bg: '#f0fdf4', text: '#166534', dot: '#22c55e' }
  };

  // 우선순위별 색상
  var MS_PRIORITY_COLOR = {
    '긴급': { bg: '#fee2e2', text: '#b91c1c' },
    '일반': { bg: '#f3f4f6', text: '#374151' },
    '낮음': { bg: '#f0fdf4', text: '#166534' }
  };

  function msStatusBadge(status) {
    var c = MS_STATUS_COLOR[status] || { bg: '#f3f4f6', text: '#6b7280' };
    return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.75rem;font-weight:600;background:' + c.bg + ';color:' + c.text + '">' + escHtml(status || '촬영예정') + '</span>';
  }

  function msInit() {
    var now = new Date();
    msYear = now.getFullYear();
    msMonth = now.getMonth();
  }

  function msLoadAndRender() {
    var db = supa();
    if (!db) { msSchedules = []; msRenderCalendar(); return; }
    var firstDay = msYear + '-' + String(msMonth + 1).padStart(2, '0') + '-01';
    var lastDayDate = new Date(msYear, msMonth + 1, 0);
    var lastDayStr = msYear + '-' + String(msMonth + 1).padStart(2, '0') + '-' + String(lastDayDate.getDate()).padStart(2, '0');
    db.from('marketing_schedules')
      .select('*')
      .gte('shoot_date', firstDay)
      .lte('shoot_date', lastDayStr)
      .order('shoot_date', { ascending: true })
      .then(function (res) {
        if (res && res.error) { console.error('marketing_schedules', res.error); msSchedules = []; }
        else msSchedules = (res && res.data) || [];
        msRenderCalendar();
      })
      .catch(function (e) { console.error('marketing_schedules', e); msSchedules = []; msRenderCalendar(); });
  }

  function msRenderCalendar() {
    var header = document.getElementById('ms-cal-header');
    if (header) header.textContent = msYear + '년 ' + (msMonth + 1) + '월';

    var grid = document.getElementById('ms-cal-grid');
    if (!grid) return;

    var firstWeekday = new Date(msYear, msMonth, 1).getDay();
    var daysInMonth = new Date(msYear, msMonth + 1, 0).getDate();
    var today = new Date().toISOString().slice(0, 10);

    // 날짜별 일정 map
    var map = {};
    msSchedules.forEach(function (s) {
      var d = (s.shoot_date || '').slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });

    var G = 'display:grid;grid-template-columns:repeat(7,1fr);width:100%;';

    // 요일 헤더
    var html = '<div style="' + G + '">';
    ['일','월','화','수','목','금','토'].forEach(function (d, i) {
      var c = i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#6b7280';
      html += '<div style="text-align:center;padding:6px 2px;font-size:0.8rem;font-weight:600;color:' + c + ';background:#f9fafb;border:1px solid #e5e7eb;' + (i < 6 ? 'border-right:none' : '') + '">' + d + '</div>';
    });
    html += '</div>';

    // 날짜 셀
    html += '<div style="' + G + 'border-left:1px solid #e5e7eb;">';
    for (var i = 0; i < firstWeekday; i++) {
      html += '<div style="min-height:80px;background:#fafafa;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"></div>';
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = msYear + '-' + String(msMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var isToday = dateStr === today;
      var isSelected = dateStr === msSelectedDate;
      var events = map[dateStr] || [];
      var weekday = (firstWeekday + day - 1) % 7;
      var dayNumColor = weekday === 0 ? '#ef4444' : weekday === 6 ? '#3b82f6' : '#374151';
      var bg = isSelected ? '#f0fdf4' : isToday ? '#eff6ff' : '#fff';
      var border = isSelected ? '2px solid #10b981' : '1px solid #e5e7eb';

      // 날짜 숫자 스타일
      var dayNumEl = isToday
        ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#3b82f6;color:#fff;font-size:0.78rem;font-weight:700;">' + day + '</span>'
        : '<span style="font-size:0.78rem;font-weight:600;color:' + dayNumColor + '">' + day + '</span>';

      // 일정 제목 표시 (상태별 배경색)
      var dotsHtml = '';
      if (events.length) {
        var shown = events.slice(0, 2);
        dotsHtml = '<div style="display:flex;flex-direction:column;gap:2px;margin-top:3px;">';
        shown.forEach(function (s) {
          var c = MS_STATUS_COLOR[s.status] || MS_STATUS_COLOR['촬영예정'];
          var titleTrunc = (s.title || '').length > 8 ? s.title.slice(0, 8) + '…' : (s.title || '');
          dotsHtml += '<div style="background:' + c.dot + ';color:#fff;border-radius:3px;padding:1px 4px;font-size:0.68rem;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="' + escHtml(s.title) + '">' + escHtml(titleTrunc) + '</div>';
        });
        if (events.length > 2) {
          dotsHtml += '<div style="font-size:0.65rem;color:#6b7280;padding-left:2px;">+' + (events.length - 2) + '건 더보기</div>';
        }
        dotsHtml += '</div>';
      }

      html += '<div data-ms-date="' + dateStr + '" onclick="window.msSelectDate(\'' + dateStr + '\')" ' +
        'style="min-height:80px;background:' + bg + ';border-right:' + border + ';border-bottom:' + border + ';padding:5px 5px 4px;position:relative;cursor:pointer;transition:background 0.1s;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
        dayNumEl +
        '<button type="button" onclick="event.stopPropagation();window.msOpenAdd(\'' + dateStr + '\')" title="일정 추가" ' +
        'style="width:16px;height:16px;border-radius:50%;background:#e5e7eb;color:#6b7280;border:none;cursor:pointer;font-size:12px;line-height:1;padding:0;flex-shrink:0;">+</button>' +
        '</div>' +
        dotsHtml +
        '</div>';
    }
    html += '</div>';
    grid.innerHTML = html;

    msRenderList();
  }

  // 날짜 선택 토글
  window.msSelectDate = function (dateStr) {
    msSelectedDate = (msSelectedDate === dateStr) ? null : dateStr;
    msRenderCalendar();
    var listEl = document.getElementById('ms-schedule-list');
    if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function msRenderList() {
    var list = document.getElementById('ms-schedule-list');
    var titleEl = document.getElementById('ms-list-title');
    var showAllBtn = document.getElementById('btn-ms-show-all');
    if (!list) return;

    var data = msSelectedDate
      ? msSchedules.filter(function (s) { return (s.shoot_date || '').slice(0, 10) === msSelectedDate; })
      : msSchedules;

    if (titleEl) {
      titleEl.textContent = msSelectedDate
        ? msSelectedDate + ' 촬영 일정'
        : msYear + '년 ' + (msMonth + 1) + '월 전체 촬영 일정';
    }
    if (showAllBtn) showAllBtn.classList.toggle('hidden', !msSelectedDate);

    if (!data.length) {
      list.innerHTML = '<p style="color:#9ca3af;padding:1rem 0">' + (msSelectedDate ? '이 날 촬영 일정이 없습니다.' : '이번 달 촬영 일정이 없습니다.') + '</p>';
      return;
    }

    list.innerHTML = '<table class="data-table" style="min-width:700px"><thead><tr>' +
      '<th>촬영일</th><th>시간</th><th>촬영명</th><th>전시장</th><th>담당자</th><th>상태</th><th>우선순위</th><th>수정</th>' +
      '</tr></thead><tbody>' +
      data.map(function (s) {
        var timeStr = s.start_time ? (s.start_time.slice(0,5) + (s.end_time ? '~' + s.end_time.slice(0,5) : '')) : '-';
        var pc = MS_PRIORITY_COLOR[s.priority] || MS_PRIORITY_COLOR['일반'];
        var priorityBadge = s.priority && s.priority !== '일반'
          ? '<span style="display:inline-block;padding:2px 7px;border-radius:999px;font-size:0.7rem;font-weight:700;background:' + pc.bg + ';color:' + pc.text + '">' + escHtml(s.priority) + '</span>'
          : '<span style="color:#9ca3af;font-size:0.8rem">일반</span>';
        return '<tr style="cursor:pointer" onclick="window.msViewSchedule(\'' + s.id + '\')">' +
          '<td style="white-space:nowrap">' + formatDate(s.shoot_date) + '</td>' +
          '<td style="white-space:nowrap;font-size:0.82rem">' + escHtml(timeStr) + '</td>' +
          '<td><strong>' + escHtml(s.title) + '</strong></td>' +
          '<td style="font-size:0.82rem">' + escHtml(s.showroom || '-') + '</td>' +
          '<td style="font-size:0.82rem">' + escHtml(s.assignee || '-') + '</td>' +
          '<td>' + msStatusBadge(s.status || '촬영예정') + '</td>' +
          '<td>' + priorityBadge + '</td>' +
          '<td onclick="event.stopPropagation()">' +
          '<button type="button" class="btn btn-xs btn-secondary" onclick="window.msViewSchedule(\'' + s.id + '\')">수정</button></td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  // 담당자 다중선택 채우기 (전체 직원 목록)
  function msPopulateAssignees(selectedNames) {
    var sel = document.getElementById('ms-assignees');
    if (!sel) return;
    var employees = typeof window.getEmployees === 'function' ? window.getEmployees() : [];
    var selected = selectedNames ? selectedNames.split(',').map(function (n) { return n.trim(); }) : [];
    // 기존 옵션 제거 후 재생성
    while (sel.options.length) sel.remove(0);
    var mktEmployees = employees.filter(function (e) { return e.team === '마케팅' && e.name; });
    var others = employees.filter(function (e) { return e.team !== '마케팅' && e.name; });
    if (mktEmployees.length) {
      var grp1 = document.createElement('optgroup');
      grp1.label = '마케팅팀';
      mktEmployees.forEach(function (e) {
        var opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = e.name;
        if (selected.indexOf(e.name) !== -1) opt.selected = true;
        grp1.appendChild(opt);
      });
      sel.appendChild(grp1);
    }
    if (others.length) {
      var grp2 = document.createElement('optgroup');
      grp2.label = '기타 팀원';
      others.forEach(function (e) {
        var opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = e.name + ' (' + (e.team || '') + ')';
        if (selected.indexOf(e.name) !== -1) opt.selected = true;
        grp2.appendChild(opt);
      });
      sel.appendChild(grp2);
    }
    // 직원 목록이 없으면 saved names 그대로 옵션으로 추가
    if (!employees.length && selected.length) {
      selected.forEach(function (n) {
        if (!n) return;
        var opt = document.createElement('option');
        opt.value = n; opt.textContent = n; opt.selected = true;
        sel.appendChild(opt);
      });
    }
  }

  function msShowForm(title, showDelete) {
    document.getElementById('ms-form-title').textContent = title;
    var delBtn = document.getElementById('btn-ms-delete');
    if (delBtn) delBtn.classList.toggle('hidden', !showDelete);
    var wrap = document.getElementById('ms-form-wrap');
    wrap.classList.remove('hidden');
    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.msOpenAdd = function (dateStr) {
    msEditId = null;
    var form = document.getElementById('form-ms');
    if (form) form.reset();
    var d = document.getElementById('ms-shoot-date');
    if (d) d.value = dateStr || '';
    msPopulateAssignees('');
    msShowForm('촬영 일정 등록', false);
  };

  window.msViewSchedule = function (id) {
    var s = msSchedules.find(function (x) { return String(x.id) === String(id); });
    if (!s) return;
    msEditId = id;
    msPopulateAssignees(s.assignee || '');
    document.getElementById('ms-title').value = s.title || '';
    document.getElementById('ms-shoot-date').value = s.shoot_date || '';
    var stEl = document.getElementById('ms-start-time');
    if (stEl) stEl.value = s.start_time || '';
    var etEl = document.getElementById('ms-end-time');
    if (etEl) etEl.value = s.end_time || '';
    var srEl = document.getElementById('ms-showroom');
    if (srEl) srEl.value = s.showroom || '';
    document.getElementById('ms-location').value = s.location || '';
    document.getElementById('ms-status').value = s.status || '촬영예정';
    var prEl = document.getElementById('ms-priority');
    if (prEl) prEl.value = s.priority || '일반';
    document.getElementById('ms-content').value = s.content || '';
    var eqEl = document.getElementById('ms-equipment');
    if (eqEl) eqEl.value = s.equipment || '';
    msShowForm('촬영 일정 수정', true);
  };

  function renderMarketingSchedule() {
    if (!msYear) msInit();
    msSelectedDate = null;
    msLoadAndRender();
  }

  function initMarketingSchedule() {
    msInit();
    document.getElementById('ms-prev') && document.getElementById('ms-prev').addEventListener('click', function () {
      msMonth--; if (msMonth < 0) { msMonth = 11; msYear--; }
      msSelectedDate = null; msLoadAndRender();
    });
    document.getElementById('ms-next') && document.getElementById('ms-next').addEventListener('click', function () {
      msMonth++; if (msMonth > 11) { msMonth = 0; msYear++; }
      msSelectedDate = null; msLoadAndRender();
    });
    document.getElementById('btn-ms-add') && document.getElementById('btn-ms-add').addEventListener('click', function () {
      window.msOpenAdd('');
    });
    document.getElementById('btn-ms-show-all') && document.getElementById('btn-ms-show-all').addEventListener('click', function () {
      msSelectedDate = null; msRenderCalendar();
    });
    document.getElementById('btn-ms-form-close') && document.getElementById('btn-ms-form-close').addEventListener('click', function () {
      document.getElementById('ms-form-wrap').classList.add('hidden');
    });
    document.getElementById('btn-ms-cancel') && document.getElementById('btn-ms-cancel').addEventListener('click', function () {
      document.getElementById('ms-form-wrap').classList.add('hidden');
    });
    document.getElementById('btn-ms-delete') && document.getElementById('btn-ms-delete').addEventListener('click', function () {
      if (!msEditId) return;
      if (!confirm('이 일정을 삭제하시겠습니까?')) return;
      var db = supa();
      if (!db) return;
      db.from('marketing_schedules').delete().eq('id', msEditId)
        .then(function () {
          showToast('삭제되었습니다.', 'success');
          document.getElementById('ms-form-wrap').classList.add('hidden');
          msLoadAndRender();
        });
    });
    var form = document.getElementById('form-ms');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var db = supa();
        if (!db) { showToast('Supabase 연결 오류', 'error'); return; }
        var cur = curUser();
        var title = document.getElementById('ms-title').value.trim();
        if (!title) { showToast('촬영명을 입력하세요.', 'error'); return; }
        // 다중선택 담당자 → 콤마 구분 문자열
        var assignSel = document.getElementById('ms-assignees');
        var assigneeValue = null;
        if (assignSel) {
          var picked = [];
          for (var oi = 0; oi < assignSel.options.length; oi++) {
            if (assignSel.options[oi].selected) picked.push(assignSel.options[oi].value);
          }
          assigneeValue = picked.length ? picked.join(', ') : null;
        }
        var stEl = document.getElementById('ms-start-time');
        var etEl = document.getElementById('ms-end-time');
        var srEl = document.getElementById('ms-showroom');
        var prEl = document.getElementById('ms-priority');
        var eqEl = document.getElementById('ms-equipment');
        var data = {
          title: title,
          shoot_date: document.getElementById('ms-shoot-date').value || null,
          start_time: stEl ? (stEl.value || null) : null,
          end_time: etEl ? (etEl.value || null) : null,
          showroom: srEl ? (srEl.value || null) : null,
          location: document.getElementById('ms-location').value.trim() || null,
          assignee: assigneeValue,
          status: document.getElementById('ms-status').value || '촬영예정',
          priority: prEl ? (prEl.value || '일반') : '일반',
          content: document.getElementById('ms-content').value.trim() || null,
          equipment: eqEl ? (eqEl.value.trim() || null) : null
        };
        var promise = msEditId
          ? db.from('marketing_schedules').update(data).eq('id', msEditId)
          : db.from('marketing_schedules').insert(Object.assign({}, data, {
              created_by: cur && cur.authUserId ? cur.authUserId : null,
              created_by_name: cur && cur.name ? cur.name : null
            }));
        promise.then(function (res) {
          if (res && res.error) { showToast('저장 실패: ' + res.error.message, 'error'); return; }
          showToast(msEditId ? '수정되었습니다.' : '일정이 등록되었습니다.', 'success');
          document.getElementById('ms-form-wrap').classList.add('hidden');
          msLoadAndRender();
        }).catch(function (e) { showToast('저장 실패', 'error'); console.error(e); });
      });
    }
  }

  // ====================================================================
  // 3. 파일 공유
  // ====================================================================

  var mfProject = '';
  var mfFiles = [];

  function mfLoad(project) {
    var db = supa();
    if (!db) { mfFiles = []; mfRenderFiles(); return; }
    var q = db.from('marketing_files').select('*').order('created_at', { ascending: false });
    if (project) q = q.eq('project', project);
    q.then(function (res) {
      if (res && res.error) { console.error('marketing_files', res.error); mfFiles = []; }
      else mfFiles = (res && res.data) || [];
      mfRenderFiles();
    }).catch(function (e) { console.error('marketing_files', e); mfFiles = []; mfRenderFiles(); });
  }

  function mfRenderFiles() {
    var wrap = document.getElementById('mf-files-grid');
    if (!wrap) return;
    if (!mfFiles.length) {
      wrap.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:2rem">파일이 없습니다. 파일을 업로드해 보세요.</p>';
      return;
    }
    wrap.innerHTML = mfFiles.map(function (f) {
      var isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].indexOf((f.file_type || '').toLowerCase()) !== -1;
      var thumb = isImage && f.file_url
        ? '<img src="' + escHtml(f.file_url) + '" alt="' + escHtml(f.file_name) + '" class="mf-thumb">'
        : '<div class="mf-icon">' + mfFileIcon(f.file_type) + '</div>';
      var size = f.file_size ? (f.file_size > 1024 * 1024
        ? Math.round(f.file_size / 1024 / 1024 * 10) / 10 + 'MB'
        : Math.round(f.file_size / 1024) + 'KB') : '';
      return '<div class="mf-card">' +
        '<div class="mf-card-thumb">' + thumb + '</div>' +
        '<div class="mf-card-info">' +
        '<div class="mf-card-name" title="' + escHtml(f.file_name) + '">' + escHtml(f.file_name) + '</div>' +
        '<div class="mf-card-meta">' + escHtml(f.project || '-') + (size ? ' · ' + size : '') + '</div>' +
        '<div class="mf-card-meta">' + escHtml(f.uploaded_by_name || '-') + ' · ' + formatDate(f.created_at) + '</div>' +
        '</div>' +
        '<div class="mf-card-actions">' +
        (f.file_url ? '<a href="' + escHtml(f.file_url) + '" download="' + escHtml(f.file_name) + '" target="_blank" class="btn btn-xs btn-primary">다운로드</a> ' : '') +
        '<button type="button" class="btn btn-xs btn-danger" onclick="window.mfDelete(\'' + f.id + '\')">삭제</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function mfFileIcon(type) {
    var t = (type || '').toLowerCase();
    if (['pdf'].indexOf(t) !== -1) return '📄';
    if (['doc', 'docx', 'hwp'].indexOf(t) !== -1) return '📝';
    if (['xls', 'xlsx', 'csv'].indexOf(t) !== -1) return '📊';
    if (['ppt', 'pptx'].indexOf(t) !== -1) return '📊';
    if (['zip', 'rar', '7z'].indexOf(t) !== -1) return '🗜';
    if (['mp4', 'mov', 'avi', 'mkv'].indexOf(t) !== -1) return '🎬';
    return '📎';
  }

  window.mfDelete = function (id) {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;
    var db = supa();
    if (!db) return;
    var f = mfFiles.find(function (x) { return String(x.id) === String(id); });
    var deleteDb = db.from('marketing_files').delete().eq('id', id);
    // Also delete from storage if path exists
    var deleteStorage = (f && f.file_path)
      ? db.storage.from('marketing_files').remove([f.file_path])
      : Promise.resolve();
    Promise.all([deleteDb, deleteStorage]).then(function () {
      showToast('삭제되었습니다.', 'success');
      mfLoad(mfProject);
    }).catch(function (e) { showToast('삭제 실패', 'error'); console.error(e); });
  };

  function mfUploadFile(file, project) {
    var db = supa();
    if (!db) { showToast('Supabase 연결 오류', 'error'); return Promise.reject(); }
    var cur = curUser();
    var year = new Date().getFullYear();
    var ext = file.name.split('.').pop();
    var safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
    var path = year + '/' + (project || '공통') + '/' + Date.now() + '_' + safeName;
    return db.storage.from('marketing_files').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    }).then(function (res) {
      if (res && res.error) throw res.error;
      var publicUrl = db.storage.from('marketing_files').getPublicUrl(path).data.publicUrl;
      return db.from('marketing_files').insert({
        project: project || '공통',
        file_name: file.name,
        file_path: path,
        file_url: publicUrl,
        file_type: ext || null,
        file_size: file.size || null,
        uploaded_by: cur && cur.authUserId ? cur.authUserId : null,
        uploaded_by_name: cur && cur.name ? cur.name : null
      });
    });
  }

  function renderMarketingFiles() {
    var projSel = document.getElementById('mf-project-filter');
    if (projSel && !mfProject) mfProject = projSel.value || '';
    mfLoad(mfProject);
  }

  function initMarketingFiles() {
    var projSel = document.getElementById('mf-project-filter');
    if (projSel) {
      projSel.addEventListener('change', function () {
        mfProject = this.value;
        mfLoad(mfProject);
      });
    }

    // Drag & drop upload area
    var dropZone = document.getElementById('mf-drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.classList.add('mf-drag-over');
      });
      dropZone.addEventListener('dragleave', function () {
        dropZone.classList.remove('mf-drag-over');
      });
      dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.classList.remove('mf-drag-over');
        var files = e.dataTransfer.files;
        if (files.length) mfHandleFiles(files);
      });
      dropZone.addEventListener('click', function () {
        document.getElementById('mf-file-input').click();
      });
    }
    var fileInput = document.getElementById('mf-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (this.files.length) mfHandleFiles(this.files);
        this.value = '';
      });
    }
  }

  function mfHandleFiles(files) {
    var projInput = document.getElementById('mf-project-name');
    var project = projInput ? projInput.value.trim() : '';
    var arr = Array.prototype.slice.call(files);
    var chain = Promise.resolve();
    var count = 0;
    arr.forEach(function (f) {
      chain = chain.then(function () {
        return mfUploadFile(f, project).then(function () { count++; });
      });
    });
    chain.then(function () {
      showToast(count + '개 파일을 업로드했습니다.', 'success');
      mfLoad(mfProject);
    }).catch(function (e) {
      showToast('업로드 실패. Supabase 스토리지 버킷(marketing_files)을 확인하세요.', 'error');
      console.error('mf upload', e);
    });
  }

  // ====================================================================
  // 4. 영상 NAS 링크
  // ====================================================================

  var mnLinks = [];

  function mnLoad() {
    var db = supa();
    if (!db) { mnLinks = []; mnRenderLinks(); return; }
    db.from('marketing_nas_links').select('*').order('created_at', { ascending: false })
      .then(function (res) {
        if (res && res.error) { console.error('marketing_nas_links', res.error); mnLinks = []; }
        else mnLinks = (res && res.data) || [];
        mnRenderLinks();
      })
      .catch(function (e) { console.error('marketing_nas_links', e); mnLinks = []; mnRenderLinks(); });
  }

  function mnRenderLinks() {
    var tbody = document.getElementById('tbody-mn');
    if (!tbody) return;
    if (!mnLinks.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:2rem">등록된 NAS 링크가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = mnLinks.map(function (n) {
      return '<tr>' +
        '<td>' + escHtml(n.project || '-') + '</td>' +
        '<td>' + escHtml(n.title || '-') + '</td>' +
        '<td style="color:#6b7280;font-size:0.85em;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(n.nas_url || '-') + '</td>' +
        '<td>' +
        (n.nas_url ? '<a href="' + escHtml(n.nas_url) + '" target="_blank" rel="noopener" class="btn btn-xs btn-primary">NAS 이동</a> ' : '') +
        (n.nas_url ? '<button type="button" class="btn btn-xs btn-secondary" onclick="window.mnCopy(\'' + n.id + '\')">링크 복사</button> ' : '') +
        '</td>' +
        '<td><button type="button" class="btn btn-xs btn-danger" onclick="window.mnDelete(\'' + n.id + '\')">삭제</button></td>' +
        '</tr>';
    }).join('');
  }

  window.mnCopy = function (id) {
    var n = mnLinks.find(function (x) { return String(x.id) === String(id); });
    if (!n || !n.nas_url) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(n.nas_url).then(function () { showToast('링크를 복사했습니다.', 'success'); });
    } else {
      var tmp = document.createElement('input');
      tmp.value = n.nas_url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      showToast('링크를 복사했습니다.', 'success');
    }
  };

  window.mnDelete = function (id) {
    if (!confirm('이 NAS 링크를 삭제하시겠습니까?')) return;
    var db = supa();
    if (!db) return;
    db.from('marketing_nas_links').delete().eq('id', id)
      .then(function () { showToast('삭제되었습니다.', 'success'); mnLoad(); })
      .catch(function (e) { showToast('삭제 실패', 'error'); console.error(e); });
  };

  function renderMarketingNas() {
    mnLoad();
  }

  function initMarketingNas() {
    var btnAdd = document.getElementById('btn-mn-add');
    var formWrap = document.getElementById('mn-form-wrap');
    if (btnAdd && formWrap) {
      btnAdd.addEventListener('click', function () {
        formWrap.classList.toggle('hidden');
        if (!formWrap.classList.contains('hidden')) formWrap.scrollIntoView({ behavior: 'smooth' });
      });
    }
    var btnCancel = document.getElementById('btn-mn-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        document.getElementById('form-mn').reset();
        document.getElementById('mn-form-wrap').classList.add('hidden');
      });
    }
    var form = document.getElementById('form-mn');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var db = supa();
        if (!db) { showToast('Supabase 연결 오류', 'error'); return; }
        var cur = curUser();
        var url = document.getElementById('mn-url').value.trim();
        if (!url) { showToast('NAS 링크를 입력하세요.', 'error'); return; }
        db.from('marketing_nas_links').insert({
          project: document.getElementById('mn-project').value.trim() || null,
          title: document.getElementById('mn-title').value.trim() || null,
          nas_url: url,
          description: document.getElementById('mn-desc').value.trim() || null,
          created_by: cur && cur.authUserId ? cur.authUserId : null,
          created_by_name: cur && cur.name ? cur.name : null
        }).then(function (res) {
          if (res && res.error) { showToast('저장 실패: ' + res.error.message, 'error'); return; }
          showToast('등록되었습니다.', 'success');
          form.reset();
          document.getElementById('mn-form-wrap').classList.add('hidden');
          mnLoad();
        }).catch(function (e) { showToast('저장 실패', 'error'); console.error(e); });
      });
    }
  }

  // ====================================================================
  // 공개 API
  // ====================================================================

  window.renderMarketingVideos = renderMarketingVideos;
  window.renderMarketingSchedule = renderMarketingSchedule;
  window.renderMarketingFiles = renderMarketingFiles;
  window.renderMarketingNas = renderMarketingNas;

  window.initMarketing = function () {
    initMarketingVideos();
    initMarketingSchedule();
    initMarketingFiles();
    initMarketingNas();
  };

})();
