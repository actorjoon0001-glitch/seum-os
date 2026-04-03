(function () {
  'use strict';
  console.log('app.js loaded');

  function showToast(msg, type) {
    var el = document.getElementById('seum-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'seum-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg || '저장됐습니다.';
    el.style.background = (type === 'error') ? '#ef4444' : '#22c55e';
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }
  var STORAGE_VISITS = 'seum_visits';
  var STORAGE_CONTRACTS = 'seum_contracts';
  var STORAGE_EMPLOYEES = 'seum_employees';
  var STORAGE_LEAVES = 'seum_leaves';
  var STORAGE_TEAM_EVENTS = 'seum_team_events';
  var STORAGE_KPI_GOALS = 'seum_kpi_goals';
  var STORAGE_INCENTIVE_PERCENTS = 'seum_incentive_percents';
  var STORAGE_CUSTOMERS = 'seum_customers';
  var STORAGE_CEO_REPORTS = 'seum_ceo_reports';
  var STORAGE_DESIGN_WORKLOG = 'seum_design_worklog';
  var STORAGE_CONSTRUCTION_WORKLOG = 'seum_construction_worklog';
  var STORAGE_PROCUREMENT_MATERIALS = 'seum_procurement_materials';
  var STORAGE_PROCUREMENT_SITES = 'seum_procurement_sites';
  var STORAGE_PROCUREMENT_ORDER_ITEMS = 'seum_procurement_order_items';
  var STORAGE_PROCUREMENT_STD_QTY = 'seum_procurement_std_qty';

  var SHOWROOMS = [
    { id: 'headquarters', name: '본사 전시장' },
    { id: 'showroom1', name: '1전시장' },
    { id: 'showroom3', name: '3전시장' },
    { id: 'showroom4', name: '4전시장' },
  ];

  function getShowroomName(id) {
    var s = SHOWROOMS.find(function (x) { return x.id === id; });
    var raw = s ? s.name : (id || '-');
    if (raw === '본사' || raw === '본사 전시장') return '본사 전시장';
    return raw;
  }

  /** ?????????????? ??? id)??SHOWROOMS id????. ?????'' */
  function resolveShowroomId(employee) {
    if (!employee) return '';
    var raw = String(employee.showroomId || employee.showroom || '').trim();
    if (!raw) return '';
    var byId = SHOWROOMS.find(function (s) { return (s.id || '') === raw; });
    if (byId) return byId.id;
    var byName = SHOWROOMS.find(function (s) { return (s.name || '') === raw; });
    if (byName) return byName.id;
    return raw;
  }

  var SUPER_ADMIN_EMAIL = 'harold0001@naver.com';

  var TODAY_MESSAGES = [
    "오늘도 최선을 다하는 당신이 자랑스럽습니다.",
    "작은 노력이 쌓여 큰 결과를 만들어냅니다.",
    "매일 한 걸음씩 앞으로 나아가면 반드시 목표에 닿습니다.",
    "고객의 미소가 우리의 가장 큰 보람입니다.",
    "오늘의 도전이 내일의 성장을 만듭니다.",
    "팀원들과 함께라면 어떤 어려움도 이겨낼 수 있습니다.",
    "진심 어린 상담 한 번이 평생 고객을 만듭니다.",
    "꾸준함이 결국 최고의 성과를 만들어냅니다.",
    "오늘 하루도 긍정적인 에너지로 가득 채워보세요.",
    "고객에게 최고의 경험을 선물하는 것이 우리의 목표입니다.",
    "포기하지 않는 사람이 결국 성공합니다.",
    "매 상담을 최선을 다해 임하면 결과가 따라옵니다.",
    "당신의 노력은 반드시 빛을 발합니다.",
    "하루 1건의 계약이 10건의 경험을 만들어줍니다.",
    "작은 친절이 고객의 마음을 움직이는 첫걸음입니다.",
    "우리가 함께 만드는 집은 고객의 꿈입니다.",
    "성실함과 열정이 최고의 영업 무기입니다.",
    "오늘도 활기차게 하루를 시작해보세요.",
    "고객의 신뢰를 쌓는 것이 장기적인 성공의 비결입니다.",
    "처음 만나는 고객에게 '최고의 첫인상'을 남겨보세요.",
    "매달 목표를 달성하는 것이 성취감의 원천입니다.",
    "우리 팀의 협력이 더 나은 결과를 만들어냅니다.",
    "고객의 입장에서 생각하면 해답이 보입니다.",
    "열심히 일하는 오늘이 더 나은 내일을 만듭니다.",
    "오늘의 노력은 절대 배신하지 않습니다.",
    "한 명 한 명의 고객이 소중한 인연입니다.",
    "긍정적인 마음가짐이 좋은 결과를 이끌어냅니다.",
    "오늘도 당신의 최선을 믿어보세요.",
    "작은 것에도 감사하는 마음이 행복의 시작입니다.",
    "고객의 꿈을 현실로 만드는 일, 참 보람 있습니다.",
    "팀원을 믿고 함께 나아가는 오늘이 되길 바랍니다.",
    "지금 이 순간 최선을 다하면 결과는 따라옵니다.",
    "우리가 만드는 공간이 누군가의 행복한 보금자리입니다.",
    "어려운 상황에서도 웃으며 일하는 당신이 대단합니다.",
    "고객의 기대 이상을 전달하는 것이 우리의 목표입니다.",
    "오늘 하루도 활기차고 즐거운 업무 되세요.",
    "매일 조금씩 성장하는 것이 가장 강한 경쟁력입니다.",
    "좋은 에너지로 하루를 시작하면 좋은 일이 생깁니다.",
    "고객의 불편함을 먼저 헤아리는 센스가 차별점입니다.",
    "오늘 계획한 일을 하나씩 완성해 나가는 하루 되세요.",
    "우리 브랜드의 가치를 높이는 것은 바로 여러분입니다.",
    "팀의 성공이 곧 나의 성공임을 잊지 마세요.",
    "진심으로 임하는 상담이 최고의 결과를 낳습니다.",
    "오늘도 최고의 컨디션으로 고객을 만나보세요.",
    "좋은 하루의 시작은 좋은 첫인사에서 비롯됩니다.",
    "포기하지 않는 끈기가 성공의 열쇠입니다.",
    "고객의 고민을 해결해주는 것이 진정한 영업입니다.",
    "하루하루 쌓이는 경험이 여러분을 전문가로 만듭니다.",
    "오늘도 밝은 미소로 고객을 맞이해보세요.",
    "작은 목표부터 달성하다 보면 큰 꿈이 이루어집니다.",
    "최고의 서비스는 마음에서 우러나오는 것입니다.",
    "우리 팀의 열정이 모여 놀라운 성과를 만들어냅니다.",
    "매 순간 성실하게 임하면 반드시 인정받습니다.",
    "고객에게 정직하게 다가가는 것이 신뢰의 시작입니다.",
    "오늘 하루도 의미 있는 대화를 나눠보세요.",
    "노력은 언제나 결실을 맺습니다. 오늘도 화이팅!",
    "팀워크가 개인의 한계를 뛰어넘게 해줍니다.",
    "작은 성취에도 스스로를 칭찬해 주세요.",
    "오늘의 땀이 내일의 자신감이 됩니다.",
    "긍정적인 태도가 주변을 밝게 만듭니다.",
    "한 번의 친절이 평생의 고객을 만들 수 있습니다.",
    "어제보다 오늘 조금 더 성장한 당신을 응원합니다.",
    "우리가 파는 것은 집이 아니라 고객의 꿈입니다.",
    "오늘도 즐겁고 보람 있는 하루 만들어 가세요.",
    "성공은 작은 습관의 꾸준한 실천에서 나옵니다.",
    "팀이 함께할 때 가장 빛나는 결과가 나옵니다.",
    "오늘 새로운 도전에 두려움 없이 임해보세요.",
    "최선을 다한 후에는 편안한 마음으로 결과를 기다리세요.",
    "당신의 노력이 우리 회사를 빛나게 합니다.",
    "오늘 하루 고객에게 잊지 못할 경험을 선물해보세요.",
    "꿈꾸는 사람이 결국 꿈을 이루게 됩니다.",
    "매 순간 집중하면 기회는 반드시 찾아옵니다.",
    "긍정의 에너지가 넘치는 하루 보내세요.",
    "우리 모두의 노력이 세움을 더욱 성장시킵니다.",
    "오늘도 당신의 전문성을 마음껏 발휘해보세요.",
    "고객과의 인연은 오래도록 소중히 간직하세요.",
    "작은 배려가 큰 감동을 만듭니다."
  ];

  function pickTodaysMessage(messages) {
    if (!messages || !messages.length) return '';
    var today = new Date();
    var key = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    var index = hash % messages.length;
    return messages[index];
  }

  function renderTodayMessage() {
    var el = document.getElementById('today-message-text');
    if (!el) return;
    el.textContent = pickTodaysMessage(TODAY_MESSAGES) || '';
  }

  function isAdmin() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    if (role === 'admin' || permission === 'admin') return true;
    // Supabase RPC가 permission을 반환하지 않는 경우 localStorage에서 보완 조회
    try {
      var employees = JSON.parse(localStorage.getItem('seum_employees') || '[]');
      var myEmp = employees.find(function (e) { return (e.name || '') === (cur.name || ''); });
      if (myEmp && (myEmp.permission || '').toLowerCase() === 'admin') return true;
    } catch (e) {}
    return false;
  }

  function isMaster() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    return role === 'master' || permission === 'master';
  }

  function isManager() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    if (role === 'manager' || permission === 'manager') return true;
    // Supabase RPC가 permission을 반환하지 않는 경우 localStorage에서 보완 조회
    try {
      var employees = JSON.parse(localStorage.getItem('seum_employees') || '[]');
      var myEmp = employees.find(function (e) { return (e.name || '') === (cur.name || ''); });
      if (myEmp && ((myEmp.permission || '').toLowerCase() === 'manager' || (myEmp.role || '').toLowerCase() === 'manager')) return true;
    } catch (e) {}
    return false;
  }

  function isSuperAdmin() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur || !cur.email) return false;
    return String(cur.email).toLowerCase() === SUPER_ADMIN_EMAIL;
  }

  function canSeeManageSection() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    // ????????admin ??? (??? permission=admin)
    return role === 'admin' || permission === 'admin';
  }

  function isSalesReadonly() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    if (role === 'admin' || role === 'master' || permission === 'admin' || isSuperAdmin()) return false;
    var team = (cur.team || '').trim();
    return team === '마케팅';
  }

  function canAccessTeamSection(sectionId) {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return false;
    var role = (cur.role || '').toLowerCase();
    var permission = (cur.permission || '').toLowerCase();
    if (role === 'admin' || role === 'master' || permission === 'admin' || isSuperAdmin()) return true;
    var team = (cur.team || '').trim();
    if (!team) return false;
    // ?? ??: ???, ????? ???, ???, ???, ??
    var isSales = team === '영업';
    var isMarketing = team === '마케팅';
    var isDesign = team === '설계';
    var isConstruction = team === '시공';
    var isSettlement = team === '정산';

    // ???????: ?????+ ??? + ??? + ???
    if (sectionId === 'marketing') return isMarketing;

    // 방문예약 고객 / 고객관리: 영업팀 + master/admin만
    if (sectionId === 'sales-leads' || sectionId === 'sales-customers') {
      return isSales;
    }
    // 계약 목록: 영업/설계/시공/정산 등 전 팀
    if (sectionId === 'sales-contracts') {
      return isSales || isDesign || isMarketing || isConstruction || isSettlement;
    }

    // ??? ???: ???, ???, ???, ????? ???
    if (sectionId === 'design') {
      return isDesign || isSales || isConstruction || isMarketing || isSettlement;
    }

    // 설계업무일지: 설계팀 + master/admin만 접근
    if (sectionId === 'design-worklog') {
      return isDesign;
    }

    // 우선순위: 설계팀 + 영업팀 + master/admin 접근
    if (sectionId === 'design-priority') {
      return isDesign || isSales;
    }

    // ??? ???: ???, ???, ????? ??? + ????? ????(????? isSalesReadonly??? ?? ???)
    if (sectionId === 'construction') {
      return isConstruction || isDesign || isMarketing || isSettlement || isSales;
    }

    // 시공 업무일지: 시공팀 + 관리자만 접근
    if (sectionId === 'construction-worklog') {
      return isConstruction;
    }

    // 발주팀: 시공팀 + 관리자만 접근
    if (sectionId === 'procurement') {
      return isConstruction;
    }

    // ?????: ??? ?? + ???/???/??? ???? ????????
    if (sectionId === 'settlement-payment' || sectionId === 'settlement-incentive') {
      return isSettlement;
    }
    // ????????? ?? ??? ???
    return true;
  }

  function updateDesignWorklogNavVisibility() {
    var el = document.querySelector('[data-section="design-worklog"]');
    if (el) el.classList.toggle('hidden', !canAccessTeamSection('design-worklog'));
  }

  function updateConstructionRestrictedNavVisibility() {
    ['construction-worklog', 'procurement'].forEach(function (sec) {
      var el = document.querySelector('[data-section="' + sec + '"]');
      if (el) el.classList.toggle('hidden', !canAccessTeamSection(sec));
    });
  }

  function updateSalesRestrictedNavVisibility() {
    ['sales-leads', 'sales-customers'].forEach(function (sec) {
      var el = document.querySelector('[data-section="' + sec + '"]');
      if (el) el.classList.toggle('hidden', !canAccessTeamSection(sec));
    });
  }

  function updateAdminNavVisibility() {
    var section = document.getElementById('nav-section-admin');
    // ??? ????? admin/master/????????? ????? ???.
    if (section) section.classList.toggle('hidden', !isAdmin() && !isSuperAdmin());
  }

  function updateManageNavVisibility() {
    var section = document.getElementById('nav-section-manage');
    if (section) section.classList.toggle('hidden', !canSeeManageSection());
  }

  function canSeeCeoSection() {
    return isAdmin() || isMaster() || isSuperAdmin();
  }

  function updateCeoNavVisibility() {
    var section = document.getElementById('nav-section-ceo');
    if (section) section.classList.toggle('hidden', !canSeeCeoSection());
  }

  function getFilterShowroom() {
    var el = document.getElementById('filter-showroom');
    return el ? (el.value || '') : '';
  }

  function getFilterYear() {
    var el = document.getElementById('filter-year');
    return el ? (el.value || '') : '';
  }

  function getFilterMonth() {
    var el = document.getElementById('filter-month');
    return el ? (el.value || '') : '';
  }

  function filterByShowroom(list, showroomKey) {
    var filter = getFilterShowroom();
    if (!filter) return list;
    return list.filter(function (item) { return (item[showroomKey] || '') === filter; });
  }

  function filterByYearMonth(list, dateKey) {
    var y = getFilterYear();
    var m = getFilterMonth();
    if (!y && !m) return list;
    var mPad = m ? String(m).padStart(2, '0') : '';
    return list.filter(function (item) {
      var d = item[dateKey] || '';
      if (!d || d.length < 7) return false;
      var itemYear = d.slice(0, 4);
      var itemMonth = d.slice(5, 7);
      if (y && itemYear !== y) return false;
      if (m && itemMonth !== mPad) return false;
      return true;
    });
  }

  // ────────────────────────────────────────────────────────────
  //  계약 목록 검색 필터 헬퍼
  // ────────────────────────────────────────────────────────────

  /** 검색 입력창에서 키워드를 가져옴 */
  function getContractSearchKeyword() {
    var el = document.getElementById('contract-search-input');
    return el ? el.value.trim() : '';
  }

  /**
   * 계약 1건이 키워드에 매칭되는지 확인
   * 현재 검색 대상: 건축주명, 주소(siteAddress)
   * 향후 확장: 담당자(salesPerson), 상태 등 fields 배열에 추가
   */
  function matchesKeyword(contract, keyword) {
    if (!keyword) return true;
    var kw = keyword.toLowerCase();
    var fields = [
      contract.customerName || '',
      contract.siteAddress  || ''
    ];
    return fields.some(function (f) {
      return f.toLowerCase().indexOf(kw) !== -1;
    });
  }

  /**
   * 연/월/전시장 필터 이후에 키워드 필터를 추가로 적용
   * 향후 필드별 검색(건축주명 전용, 지역 전용 등)으로 쉽게 확장 가능
   */
  function getFilteredContracts(contracts) {
    var keyword = getContractSearchKeyword();
    if (!keyword) return contracts;
    return contracts.filter(function (c) {
      return matchesKeyword(c, keyword);
    });
  }

  /** 계약 검색 결과 요약 문구 업데이트 */
  function updateContractFilterResult(filteredContracts, allAfterBaseFilter) {
    var el = document.getElementById('contract-filter-result');
    if (!el) return;
    var keyword  = getContractSearchKeyword();
    var showroom = getFilterShowroom();
    var year     = getFilterYear();
    var month    = getFilterMonth();
    var parts    = [];
    if (showroom) {
      var names = { headquarters: '본사', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };
      parts.push(names[showroom] || showroom);
    }
    if (year)  parts.push(year + '년');
    if (month) parts.push(month + '월');
    if (keyword) parts.push('"' + keyword + '"');
    var count = filteredContracts.length;
    if (parts.length > 0) {
      el.textContent = parts.join(' / ') + ' · 총 ' + count + '건';
    } else {
      el.textContent = '총 ' + count + '건';
    }
    // X 버튼 표시 제어
    var clearBtn = document.getElementById('contract-search-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !keyword);
  }

  // ────────────────────────────────────────────────────────────
  //  설계팀 검색 필터 헬퍼
  // ────────────────────────────────────────────────────────────

  /** 설계팀 검색 입력창에서 키워드를 가져옴 */
  function getDesignSearchKeyword() {
    var el = document.getElementById('design-search-input');
    return el ? el.value.trim() : '';
  }

  /**
   * 설계팀 검색 대상 필드
   * 향후 확장: 아래 fieldsGetter 배열에 필드 추가
   */
  function matchesDesignKeyword(contract, keyword) {
    if (!keyword) return true;
    var kw = keyword.toLowerCase();
    var fields = [
      contract.customerName          || '',
      contract.siteAddress           || '',
      contract.contractModel         || '',
      contract.contractModelName     || '',
      contract.salesPerson           || '',
      contract.designPermitDesigner  || '',
      contract.designContactName     || ''
    ];
    return fields.some(function (f) { return f.toLowerCase().indexOf(kw) !== -1; });
  }

  /**
   * 연/월/전시장 필터 이후에 설계팀 키워드 필터 추가 적용
   * 향후 필드별 분리 검색으로 쉽게 확장 가능
   */
  function getFilteredDesignContracts(contracts) {
    var keyword = getDesignSearchKeyword();
    if (!keyword) return contracts;
    return contracts.filter(function (c) { return matchesDesignKeyword(c, keyword); });
  }

  /** 설계팀 검색 결과 요약 문구 업데이트 */
  function updateDesignFilterResult(filtered) {
    var el = document.getElementById('design-filter-result');
    if (!el) return;
    var keyword  = getDesignSearchKeyword();
    var showroom = getFilterShowroom();
    var year     = getFilterYear();
    var month    = getFilterMonth();
    var parts    = [];
    var names    = { headquarters: '본사', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };
    if (showroom) parts.push(names[showroom] || showroom);
    if (year)     parts.push(year + '년');
    if (month)    parts.push(month + '월');
    if (keyword)  parts.push('"' + keyword + '"');
    var count = filtered.length;
    el.textContent = (parts.length > 0 ? parts.join(' / ') + ' · ' : '') + '총 ' + count + '건';
    var clearBtn = document.getElementById('design-search-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !keyword);
  }

  // ────────────────────────────────────────────────────────────
  //  시공팀 검색 필터 헬퍼
  // ────────────────────────────────────────────────────────────

  /** 시공팀 검색 입력창에서 키워드를 가져옴 */
  function getConstructionSearchKeyword() {
    var el = document.getElementById('construction-search-input');
    return el ? el.value.trim() : '';
  }

  /**
   * 시공팀 검색 대상 필드
   * 향후 확장: 아래 fields 배열에 필드 추가
   */
  function matchesConstructionKeyword(contract, keyword) {
    if (!keyword) return true;
    var kw = keyword.toLowerCase();
    var fields = [
      contract.customerName          || '',
      contract.siteAddress           || '',
      contract.contractModel         || '',
      contract.contractModelName     || '',
      contract.salesPerson           || '',
      contract.designPermitDesigner  || '',
      contract.designContactName     || '',
      contract.constructionManager   || ''
    ];
    return fields.some(function (f) { return f.toLowerCase().indexOf(kw) !== -1; });
  }

  /**
   * 연/월/전시장 필터 이후에 시공팀 키워드 필터 추가 적용
   * 향후 필드별 분리 검색으로 쉽게 확장 가능
   */
  function getFilteredConstructionContracts(contracts) {
    var keyword = getConstructionSearchKeyword();
    if (!keyword) return contracts;
    return contracts.filter(function (c) { return matchesConstructionKeyword(c, keyword); });
  }

  /** 시공팀 검색 결과 요약 문구 업데이트 */
  function updateConstructionFilterResult(filtered) {
    var el = document.getElementById('construction-filter-result');
    if (!el) return;
    var keyword  = getConstructionSearchKeyword();
    var showroom = getFilterShowroom();
    var year     = getFilterYear();
    var month    = getFilterMonth();
    var parts    = [];
    var names    = { headquarters: '본사', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };
    if (showroom) parts.push(names[showroom] || showroom);
    if (year)     parts.push(year + '년');
    if (month)    parts.push(month + '월');
    if (keyword)  parts.push('"' + keyword + '"');
    var count = filtered.length;
    el.textContent = (parts.length > 0 ? parts.join(' / ') + ' · ' : '') + '총 ' + count + '건';
    var clearBtn = document.getElementById('construction-search-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !keyword);
  }

  function getVisits() {
    try {
      var raw = localStorage.getItem(STORAGE_VISITS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveVisits(data) {
    localStorage.setItem(STORAGE_VISITS, JSON.stringify(data));
  }

  function getContracts() {
    try {
      var raw = localStorage.getItem(STORAGE_CONTRACTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveContracts(data) {
    localStorage.setItem(STORAGE_CONTRACTS, JSON.stringify(data));
    // Supabase contracts ????? ?????(?? ID ???)
    try {
      var supa = typeof window !== 'undefined' && window.seumSupabase;
      if (!supa || !Array.isArray(data)) return;
      var rows = data.map(function (c) {
        return {
          local_id: c.id || null,
          showroom_id: c.showroomId || null,
          contract_date: c.contractDate || null,
          contract_amount: c.totalAmount != null && c.totalAmount !== '' ? Number(c.totalAmount) : null,
          sales_person: c.salesPerson || null,
          customer_name: c.customerName || null,
          model_name: c.contractModelName || null,
          payload: c
        };
      });
      supa.from('contracts').upsert(rows, { onConflict: 'local_id' })
        .then(function (res) {
          if (res && res.error) {
            // ????? ?????UI ????? ??? ???
            console.error('Supabase contracts sync error:', res.error);
          }
        })
        .catch(function (err) {
          console.error('Supabase contracts sync failed:', err);
        });
    } catch (e) {
      console.error('Supabase contracts sync exception:', e);
    }
  }

  /** ?? ???? (?? + Supabase contracts) */
  function deleteContractById(contractId) {
    if (!contractId) return;
    var contracts = getContracts();
    var beforeLen = contracts.length;
    contracts = contracts.filter(function (c) { return c.id !== contractId; });
    if (contracts.length === beforeLen) return;
    saveContracts(contracts);
    try {
      var supa = typeof window !== 'undefined' && window.seumSupabase;
      if (supa) {
        supa.from('contracts').delete().eq('local_id', contractId)
          .then(function (res) {
            if (res && res.error) {
              console.error('Supabase contracts delete error:', res.error);
            }
          })
          .catch(function (err) {
            console.error('Supabase contracts delete failed:', err);
          });
      }
    } catch (e) {
      console.error('deleteContractById exception', e);
    }
    // ?? ??/???/??? ??? UI ??
    if (typeof renderSales === 'function') renderSales();
    if (typeof renderConstruction === 'function') renderConstruction();
    if (typeof renderSettlement === 'function') renderSettlement();
  }

  // Supabase??????? contracts??localStorage???? (?????? ?????????
  function syncContractsFromSupabase() {
    try {
      var supa = typeof window !== 'undefined' && window.seumSupabase;
      if (!supa) return;
      supa
        .from('contracts')
        .select('local_id,payload')
        .then(function (res) {
          if (!res || res.error || !Array.isArray(res.data)) {
            if (res && res.error) {
              console.error('Supabase contracts load error:', res.error);
            }
            return;
          }
          var remote = res.data
            .map(function (row) {
              var c = row.payload || null;
              if (!c && row.local_id) {
                c = { id: row.local_id };
              }
              if (c && !c.id && row.local_id) {
                c.id = row.local_id;
              }
              return c;
            })
            .filter(function (c) { return c && c.id; });
          // Supabase ?????? ?? (??? PC ??/??? ????????)
          localStorage.setItem(STORAGE_CONTRACTS, JSON.stringify(remote));

          try {
            renderSales();
            renderDesign();
            renderSettlement();
          } catch (e) {
            console.error('Render after contracts sync failed:', e);
          }
        })
        .catch(function (err) {
          console.error('Supabase contracts load failed:', err);
        });
    } catch (e) {
      console.error('Supabase contracts sync exception:', e);
    }
  }

  function getEmployees() {
    try {
      var raw = localStorage.getItem(STORAGE_EMPLOYEES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveEmployees(data) {
    localStorage.setItem(STORAGE_EMPLOYEES, JSON.stringify(data));
  }

  function getLeaves() {
    try {
      var raw = localStorage.getItem(STORAGE_LEAVES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaves(data) {
    localStorage.setItem(STORAGE_LEAVES, JSON.stringify(data));
  }

  // ===== ??? ??? ?????? ??? =====

  function parseDrawingUrls(value) {
    if (!value) return [];
    // '|' 구분자 우선, '\n' 구분자는 이전 데이터 하위 호환
    var sep = String(value).indexOf('|') !== -1 ? '|' : '\n';
    return String(value).split(sep === '\n' ? /\r?\n/ : /\|/).map(function (s) { return s.trim(); }).filter(function (s) { return !!s; });
  }

  function serializeDrawingUrls(urls) {
    return urls.join('|');
  }

  function fileNameFromUrl(url) {
    if (!url) return '';
    try {
      var clean = String(url).split('?')[0].split('#')[0];
      var parts = clean.split('/');
      return parts[parts.length - 1] || url;
    } catch (e) {
      return url;
    }
  }

  function renderDrawingFileList(container, urls) {
    if (!container) return;
    if (!urls || !urls.length) {
      container.innerHTML = '<div class="drawing-file-empty">첨부된 파일이 없습니다.</div>';
      return;
    }
    var items = urls.map(function (url, idx) {
      var name = fileNameFromUrl(url);
      return '<li class="drawing-file-item" data-index="' + idx + '">' +
        '<span class="drawing-file-icon">📄</span>' +
        '<span class="drawing-file-name-text" title="' + escapeAttr(name) + '">' + escapeAttr(name) + '</span>' +
        '<button type="button" class="btn btn-xs btn-secondary drawing-file-open" data-url="' + escapeAttr(url) + '">열기</button>' +
        '<button type="button" class="btn btn-xs btn-secondary drawing-file-delete">삭제</button>' +
        '</li>';
    }).join('');
    container.innerHTML = '<ul class="drawing-file-list-inner">' + items + '</ul>';
  }

  function updateDrawingFileCount(listEl) {
    if (!listEl) return;
    var id = listEl.id || '';
    var countId = id === 'design-construction-drawing-list'
      ? 'design-drawing-count-construction'
      : id.replace('design-drawing-list-', 'design-drawing-count-');
    var countEl = document.getElementById(countId);
    if (!countEl) return;
    var items = listEl.querySelectorAll('.drawing-file-item');
    countEl.textContent = items.length > 0 ? '(' + items.length + '개)' : '';
  }

  function refreshDrawingFileListForInput(inputEl, listEl) {
    if (!inputEl || !listEl) return;
    var urls = parseDrawingUrls(inputEl.value || '');
    renderDrawingFileList(listEl, urls);
    updateDrawingFileCount(listEl);
  }

  function getTeamEvents() {
    try {
      var raw = localStorage.getItem(STORAGE_TEAM_EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTeamEvents(data) {
    localStorage.setItem(STORAGE_TEAM_EVENTS, JSON.stringify(data));
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase || !Array.isArray(data)) return;
      var rows = data.map(function (ev) {
        return {
          local_id: ev.id || null,
          title: ev.title || null,
          team: ev.team || ev.team_name || null,
          assignee_name: ev.assignee_name || ev.assignee || ev.manager || null,
          showroom: ev.showroom || ev.showroomId || null,
          event_type: ev.event_type || ev.eventType || ev.type || null,
          status: ev.status || null,
          priority: ev.priority || null,
          start_date: ev.start_date || ev.startDate || ev.event_date || ev.date || null,
          end_date: ev.end_date || ev.endDate || ev.start_date || ev.startDate || ev.event_date || ev.date || null,
          start_time: ev.start_time || ev.startTime || ev.time || null,
          end_time: ev.end_time || ev.endTime || null,
          is_all_day: ev.allDay != null ? !!ev.allDay : null,
          location: ev.location || null,
          description: ev.description || ev.content || null,
          repeat_type: ev.repeat_type || ev.repeat || null,
          reminder_type: ev.reminder_type || ev.reminder || null,
          is_private: ev.is_private != null ? !!ev.is_private : null,
          note: ev.note || null,
          payload: ev
        };
      });
      supabase
        .from('team_events')
        .upsert(rows, { onConflict: 'local_id' })
        .then(function (res) {
          if (res && res.error) {
            console.error('Supabase team_events sync error:', res.error);
          }
        })
        .catch(function (err) {
          console.error('Supabase team_events sync failed:', err);
        });
    } catch (e) {
      console.error('Supabase team_events sync exception:', e);
    }
  }

  function syncTeamEventsFromSupabase() {
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;
      supabase
        .from('team_events')
        .select('local_id,payload,title,team,assignee_name,showroom,event_type,status,priority,start_date,end_date,start_time,end_time,is_all_day,location,description,repeat_type,reminder_type,is_private,note')
        .then(function (res) {
          if (!res || res.error || !Array.isArray(res.data)) {
            if (res && res.error) {
              console.error('Supabase team_events load error:', res.error);
            }
            return;
          }
          var remote = res.data.map(function (row) {
            var ev = row.payload || {};
            if (!ev.id && row.local_id) ev.id = row.local_id;
            if (!ev.title && row.title) ev.title = row.title;
            if (!ev.team && row.team) ev.team = row.team;
            if (!ev.assignee_name && row.assignee_name) ev.assignee_name = row.assignee_name;
            if (row.showroom != null && row.showroom !== '') {
              ev.showroom = row.showroom;
              ev.showroomId = row.showroom;
            }
            if (row.event_type != null && row.event_type !== '') {
              ev.event_type = row.event_type;
              ev.eventType = row.event_type;
              ev.type = row.event_type;
            }
            if (!ev.status && row.status) ev.status = row.status;
            if (!ev.priority && row.priority) ev.priority = row.priority;
            if (!ev.startDate && row.start_date) ev.startDate = row.start_date;
            if (!ev.endDate && row.end_date) ev.endDate = row.end_date;
            if (!ev.startTime && row.start_time) ev.startTime = row.start_time;
            if (!ev.endTime && row.end_time) ev.endTime = row.end_time;
            if (ev.allDay == null && row.is_all_day != null) ev.allDay = row.is_all_day;
            if (!ev.location && row.location) ev.location = row.location;
            if (!ev.description && row.description) ev.description = row.description;
            if (!ev.repeat_type && row.repeat_type) ev.repeat_type = row.repeat_type;
            if (!ev.reminder_type && row.reminder_type) ev.reminder_type = row.reminder_type;
            if (ev.is_private == null && row.is_private != null) ev.is_private = row.is_private;
            if (!ev.note && row.note) ev.note = row.note;
            return ev;
          }).filter(function (ev) { return ev && ev.id; });
          if (remote.length === 0) return;
          var local = getTeamEvents();
          var byId = {};
          local.forEach(function (ev) {
            if (ev && ev.id) byId[ev.id] = ev;
          });
          remote.forEach(function (ev) {
            if (ev && ev.id) byId[ev.id] = ev;
          });
          var merged = [];
          for (var k in byId) {
            if (byId.hasOwnProperty(k)) merged.push(byId[k]);
          }
          localStorage.setItem(STORAGE_TEAM_EVENTS, JSON.stringify(merged));
        })
        .catch(function (err) {
          console.error('Supabase team_events sync load failed:', err);
        });
    } catch (e) {
      console.error('Supabase team_events sync exception:', e);
    }
  }

  function getKpiGoals() {
    try {
      var raw = localStorage.getItem(STORAGE_KPI_GOALS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveKpiGoals(data) {
    localStorage.setItem(STORAGE_KPI_GOALS, JSON.stringify(data));
  }

  function getIncentivePercents() {
    try {
      var raw = localStorage.getItem(STORAGE_INCENTIVE_PERCENTS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveIncentivePercents(data) {
    localStorage.setItem(STORAGE_INCENTIVE_PERCENTS, JSON.stringify(data));
  }

  function getCustomers() {
    try {
      var raw = localStorage.getItem(STORAGE_CUSTOMERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomers(data) {
    localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(data));
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // ??? ?????? ????? ??????? ???
  function ensureSamples() {
    // intentionally left blank
  }

  function ensureEmployeesAndKpi() {
    // ????? ??/?? ???????????? ???,
    // KPI ???????? ??? ???????
    var goals = getKpiGoals();
    var monthPrefix = thisMonth();
    if (!goals[monthPrefix]) {
      goals[monthPrefix] = { goalContracts: 10, goalSales: 5 };
      saveKpiGoals(goals);
    }
  }

  function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function formatMoney(n) {
    if (n == null || n === '') return '-';
    return Number(n).toLocaleString();
  }

  /** ?? ???????"??, "??, "," ??? ??????????. ??? ??0 */
  function parseMoney(val) {
    if (val == null || val === '') return 0;
    var s = String(val).replace(/,/g, '').trim();
    if (s === '') return 0;
    var n = Number(s);
    return isNaN(n) ? 0 : Math.max(0, n);
  }

  /** ?????? ?????????????????? ?????*/
  function getConfirmedReceivedTotal(c) {
    if (!c) return 0;
    var sum = 0;
    if (c.depositConfirmed) sum += parseMoney(c.depositAmount);
    if (c.progress1Confirmed) sum += parseMoney(c.progress1Amount);
    if (c.progress2Confirmed) sum += parseMoney(c.progress2Amount);
    if (c.progress3Confirmed) sum += parseMoney(c.progress3Amount);
    if (c.balanceConfirmed) sum += parseMoney(c.balanceAmount);
    return Math.max(0, sum);
  }

  /** ?????? ??: { total, received, remaining, receivedPct, remainingPct } ?????? ??? */
  function getPaymentSummaryNumbers(c) {
    var total = parseMoney(c && c.totalAmount);
    if (total <= 0) {
      return { total: 0, received: 0, remaining: 0, receivedPct: 0, remainingPct: 0 };
    }
    var received = getConfirmedReceivedTotal(c);
    var remaining = Math.max(0, total - received);
    var receivedPct = Math.round((received / total) * 100);
    var remainingPct = Math.round((remaining / total) * 100);
    return { total: total, received: received, remaining: remaining, receivedPct: receivedPct, remainingPct: remainingPct };
  }

  function formatDate(s) {
    if (!s) return '-';
    return s;
  }

  function thisMonth() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    return y + '-' + m;
  }

  function getStatsByShowroom() {
    var contracts = filterByShowroom(getContracts(), 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    var myShowroomId = getMyShowroomId();
    var showroomsToUse = SHOWROOMS;
    // admin, master, superAdmin은 전체 전시장 차트 표시
    if (myShowroomId && !isAdmin() && !isMaster() && !isSuperAdmin()) {
      showroomsToUse = SHOWROOMS.filter(function (s) { return (s.id || '') === myShowroomId; });
    }
    var labels = showroomsToUse.map(function (s) { return s.name; });
    var contractCounts = showroomsToUse.map(function (s) {
      return contracts.filter(function (c) { return (c.showroomId || '') === s.id; }).length;
    });
    var totalSales = showroomsToUse.map(function (s) {
      var sum = contracts
        .filter(function (c) { return (c.showroomId || '') === s.id; })
        .reduce(function (acc, c) { return acc + (Number(c.totalAmount) || 0); }, 0);
      return sum / 10000; // ?? ????? (??)
    });
    return { labels: labels, contractCounts: contractCounts, totalSales: totalSales };
  }

  var chartContracts = null;
  var chartSales = null;

  function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    var stats = getStatsByShowroom();
    var opts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.8,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
    var canvasContracts = document.getElementById('chart-contracts');
    var canvasSales = document.getElementById('chart-sales');
    if (canvasContracts) {
      if (chartContracts) chartContracts.destroy();
      chartContracts = new Chart(canvasContracts, {
        type: 'bar',
        data: {
          labels: stats.labels,
          datasets: [{
            label: '계약',
            data: stats.contractCounts,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        },
        options: opts
      });
    }
    if (canvasSales) {
      if (chartSales) chartSales.destroy();
      chartSales = new Chart(canvasSales, {
        type: 'bar',
        data: {
          labels: stats.labels,
          datasets: [{
            label: '매출(만원)',
            data: stats.totalSales,
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          }]
        },
        options: opts
      });
    }
  }

  function renderDashboard() {
    var _dashIsPrivileged = (typeof isAdmin === 'function' && isAdmin()) || (typeof isMaster === 'function' && isMaster()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
    var _dashMyShowroom = getMyShowroomId();
    var _allContracts = getContracts();
    var _allVisits = getVisits();
    if (!_dashIsPrivileged && _dashMyShowroom) {
      _allContracts = _allContracts.filter(function (c) { return (c.showroomId || '') === _dashMyShowroom; });
      _allVisits = _allVisits.filter(function (v) { return (v.showroomId || '') === _dashMyShowroom; });
    }
    var contracts = filterByShowroom(_allContracts, 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    var visits = filterByShowroom(_allVisits, 'showroomId');
    visits = filterByYearMonth(visits, 'visitDate');
    var monthContracts = (getFilterYear() || getFilterMonth())
      ? contracts
      : contracts.filter(function (c) { return c.contractDate && c.contractDate.slice(0, 7) === thisMonth(); });
    function toManwon(c, field) {
      var v = Number(c[field]) || 0;
      return c.amountUnit === 'manwon' ? v : Math.round(v / 10000);
    }
    var totalAmount = monthContracts.reduce(function (sum, c) {
      return sum + toManwon(c, 'totalAmount');
    }, 0);
    var totalDeposit = contracts.reduce(function (sum, c) {
      return sum + toManwon(c, 'depositAmount');
    }, 0);

    var elCount = document.getElementById('kpi-contract-count');
    var elAmount = document.getElementById('kpi-total-amount');
    var elDeposit = document.getElementById('kpi-deposit-received');
    if (elCount) elCount.textContent = monthContracts.length;
    if (elAmount) elAmount.textContent = totalAmount.toLocaleString();
    if (elDeposit) elDeposit.textContent = totalDeposit.toLocaleString();
    renderDashboardCharts();

    var leadsWaiting = visits.filter(function (v) { return v.status !== '영업배정'; }).length;
    var designPending = contracts.filter(function (c) {
      return c.depositReceivedAt && (c.designStatus || 'none') !== 'done';
    }).length;
    var constructionActive = contracts.filter(function (c) {
      var p = c.constructionProgress || '착공전';
      return p === '착공' || p === '진행중';
    }).length;
    var paymentUnconfirmed = contracts.filter(function (c) {
      var hasDeposit = !!(c.depositAmount || c.depositReceivedAt);
      var hasP1 = !!c.progress1Amount; var hasP2 = !!c.progress2Amount; var hasP3 = !!c.progress3Amount; var hasBal = !!c.balanceAmount;
      if (!hasDeposit && !hasP1 && !hasP2 && !hasP3 && !hasBal) return false;
      return (hasDeposit && !c.depositConfirmed) || (hasP1 && !c.progress1Confirmed) || (hasP2 && !c.progress2Confirmed) || (hasP3 && !c.progress3Confirmed) || (hasBal && !c.balanceConfirmed);
    }).length;

    setEl('dashboard-leads-waiting', leadsWaiting);
    setEl('dashboard-contracts-total', contracts.length);
    setEl('dashboard-design-pending', designPending);
    setEl('dashboard-construction-active', constructionActive);
    setEl('dashboard-payment-unconfirmed', paymentUnconfirmed);

    var today = todayStr();
    var todayVisits = visits.filter(function (v) { return (v.visitDate || '') === today; });
    var todayEl = document.getElementById('dashboard-today-visits');
    if (todayEl) {
      todayEl.innerHTML = todayVisits.length === 0
        ? '오늘 방문이 없습니다'
        : todayVisits.map(function (v) {
            return '<div class="widget-item">' + (v.visitTime || '') + ' ' + (v.name || '-') + ' ' + (v.interestType || '') + '</div>';
          }).join('');
    }

    var recent = contracts.slice().sort(function (a, b) {
      return (b.contractDate || '').localeCompare(a.contractDate || '');
    }).slice(0, 5);
    var recentEl = document.getElementById('dashboard-recent-contracts');
    if (recentEl) {
      recentEl.innerHTML = recent.length === 0
        ? '계약 없음'
        : recent.map(function (c) {
            return '<div class="widget-item">' + formatDate(c.contractDate) + ' ' + (c.customerName || '-') + ' ' + formatMoney(c.totalAmount) + '</div>';
          }).join('');
    }

    var stages = { '착공전': 0, '착공': 0, '진행중': 0, '완료': 0 };
    contracts.forEach(function (c) {
      var p = c.constructionProgress || '착공전';
      if (stages[p] !== undefined) stages[p]++;
    });
    var stagesEl = document.getElementById('dashboard-construction-stages');
    if (stagesEl) {
      stagesEl.innerHTML = ['착공전', '착공', '진행중', '완료'].map(function (key) {
        return '<div class="widget-item">' + key + ' <strong>' + stages[key] + '</strong></div>';
      }).join('');
    }

    renderTodayShowroomStats();
    renderDashboardAnnouncementBanner();
    renderDashboardAnnouncements();
    renderSalesPerformance();
    renderActivityLogs();
  }

  /**
   * ??? ?????? ??? ?????(?? Supabase ??? getVisits/getContracts ?? ????? ??)
   * @returns {Array<{ showroom: string, showroomName: string, visitCount: number, consultCount: number, contractCount: number }>}
   */
  function getTodayShowroomStats() {
    var today = todayStr();
    var visits = getVisits().filter(function (v) { return (v.visitDate || '') === today; });
    var contracts = getContracts().filter(function (c) { return (c.contractDate || '') === today; });
    return SHOWROOMS.map(function (s) {
      var visitCount = visits.filter(function (v) { return (v.showroomId || '') === s.id; }).length;
      var consultCount = visits.filter(function (v) {
        return (v.showroomId || '') === s.id && (v.status || '') === '영업배정';
      }).length;
      var contractCount = contracts.filter(function (c) { return (c.showroomId || '') === s.id; }).length;
      return {
        showroom: s.id,
        showroomName: s.name,
        visitCount: visitCount,
        consultCount: consultCount,
        contractCount: contractCount
      };
    });
  }

  /** ??? ???????? ?????id (id ??? ?????? ????? ?????) */
  function getMyShowroomId() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return '';
    var sid = resolveShowroomId(cur);
    if (sid) return sid;
    // currentEmployee에 showroom이 없으면 localStorage 직원 목록에서 보완
    try {
      var employees = JSON.parse(localStorage.getItem('seum_employees') || '[]');
      var myEmp = employees.find(function (e) { return (e.name || '') === (cur.name || '') || (e.id && e.id === cur.id); });
      if (myEmp) return resolveShowroomId(myEmp);
    } catch (e) {}
    return '';
  }

  /** ??? ???????? ??? ???. ?? ??? ?????? ???(??? ??????? ???? */
  function renderTodayShowroomStats() {
    var grid = document.getElementById('today-showroom-stats-grid');
    if (!grid) return;
    var todayStats = getTodayShowroomStats();
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var userTeam = (cur && (cur.team || '').trim()) || '';
    var isConstructionTeam = (userTeam === '시공' || userTeam === '시공팀');
    var myShowroomId = getMyShowroomId();
    // admin, master, superAdmin은 전체 전시장 현황 표시
    if (!isAdmin() && !isMaster() && !isSuperAdmin()) {
      if (userTeam === '마케팅' || myShowroomId) {
        if (myShowroomId) {
          todayStats = todayStats.filter(function (row) { return (row.showroom || '') === myShowroomId; });
        } else {
          todayStats = [];
        }
      }
    }
    grid.innerHTML = todayStats.map(function (row) {
      return '<div class="card today-showroom-card">' +
        '<h4 class="today-showroom-name">' + escapeHtml(row.showroomName) + '</h4>' +
        '<dl class="today-showroom-dl">' +
          '<div class="today-showroom-row"><dt>방문 건수</dt><dd>' + row.visitCount + '</dd></div>' +
          '<div class="today-showroom-row"><dt>상담</dt><dd>' + row.consultCount + '</dd></div>' +
          '<div class="today-showroom-row"><dt>계약</dt><dd>' + row.contractCount + '</dd></div>' +
        '</dl></div>';
    }).join('');
  }

  /** ?? ??? ?? (Supabase activity_logs?? ????? */
  var activityLogs = [];

  /**
   * ??? ?? ?????(Supabase activity_logs insert + ????????????????)
   * @param {Object} payload - { actionType, targetType, targetId?, targetName?, description? }
   */
  function logActivity(payload) {
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
      if (!supabase || !cur) return;
      var showroomName = (cur.showroom && typeof getShowroomName === 'function') ? getShowroomName(cur.showroom) : (cur.showroom || '');
      var row = {
        user_id: cur.authUserId || null,
        user_name: (cur.name || '').trim() || null,
        department: (cur.team || '').trim() || null,
        showroom: (showroomName || '').trim() || null,
        action_type: payload.actionType || '',
        target_type: payload.targetType || '',
        target_id: payload.targetId || null,
        target_name: (payload.targetName || '').trim() || null,
        description: (payload.description || '').trim() || null
      };
      supabase.from('activity_logs').insert(row).catch(function (err) { console.error('activity_logs insert failed', err); });
      var nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      activityLogs.unshift({
        user: row.user_name || '',
        action: (row.action_type || '') + ' ' + (row.target_type || ''),
        target: row.target_name || '',
        time: nowStr
      });
      if (activityLogs.length > 50) activityLogs.length = 50;
      renderActivityLogs();
    } catch (e) {
      console.error('logActivity exception', e);
    }
  }

  /** Supabase??? ?? ??? ?? ???? ??????????????? activityLogs ?? */
  function syncActivityLogsFromSupabase() {
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;
      supabase.from('activity_logs').select('user_name,action_type,target_type,target_name,created_at').order('created_at', { ascending: false }).limit(50)
        .then(function (res) {
          if (res && res.error) return;
          activityLogs = (res.data || []).map(function (row) {
            return {
              user: row.user_name || '',
              action: (row.action_type || '') + ' ' + (row.target_type || ''),
              target: row.target_name || '',
              time: row.created_at ? String(row.created_at).replace('T', ' ').slice(0, 16) : ''
            };
          });
          renderActivityLogs();
        })
        .catch(function () {});
    } catch (e) {}
  }

  /** ?? ??? ?? ?????????? (?? 10?? */
  function renderActivityLogs() {
    var list = document.getElementById('activity-logs-list');
    if (!list) return;
    var items = activityLogs.slice(0, 10);
    list.innerHTML = items.length === 0
      ? '<li class="activity-logs-empty">활동 내역이 없습니다.</li>'
      : items.map(function (log) {
          var targetText = log.target ? ' ' + escapeHtml(log.target) : '';
          return '<li class="activity-logs-item">' +
            '<span class="activity-logs-dot" aria-hidden="true"></span>' +
            '<div class="activity-logs-content">' +
              '<span class="activity-logs-user">' + escapeHtml(log.user) + '</span> ' +
              '<span class="activity-logs-action">' + escapeHtml(log.action) + '</span>' +
              (targetText ? '<span class="activity-logs-target">' + targetText + '</span>' : '') +
              '<time class="activity-logs-time">' + escapeHtml(log.time) + '</time>' +
            '</div></li>';
        }).join('');
  }

  function setEl(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /** ?????? ?????????? (Supabase announcements ????? ????? ????? ???) */
  /** ??? ??: ?????isNew ????????. ?? ????readBy ??? unreadCount ???????? ???*/
  var announcementsData = [];

  function getAnnouncements() {
    return announcementsData.slice();
  }

  var currentAnnouncementId = null;
  var selectedNoticeFiles = [];
  var ALLOWED_NOTICE_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'xlsx', 'docx', 'hwp', 'zip'];

  /** Supabase??? ???????????? ?? ????? UI????. ?? announcements ???????? */
  function syncAnnouncementsFromSupabase() {
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;
      function applyRows(data) {
        announcementsData = (data || []).map(function (row) {
          return {
            id: String(row.id),
            title: row.title || '',
            content: row.content || '',
            createdAt: (row.created_at || '').slice(0, 10),
            important: !!row.important,
            isNew: row.is_new == null ? false : !!row.is_new,
            authorUserId: row.created_by_id != null ? String(row.created_by_id) : null,
            authorName: row.created_by_name || '',
            authorDepartment: row.created_by_team || '',
            showroom: row.showroom || '',
            fileCount: 0
          };
        });
        renderAnnouncementsPage();
        renderDashboardAnnouncementBanner();
        renderDashboardAnnouncements();
        renderSidebarAnnouncementBadge();
        syncAnnouncementFileCounts();
      }
      supabase
        .from('announcements')
        .select('id,title,content,created_at,important,is_new,created_by_id,created_by_name,created_by_team,showroom')
        .order('created_at', { ascending: false })
        .then(function (res) {
          if (res && res.error) {
            return supabase.from('announcements').select('id,title,content,created_at,important,is_new').order('created_at', { ascending: false });
          }
          if (!res || !Array.isArray(res.data)) return;
          applyRows(res.data);
        })
        .then(function (res2) {
          if (!res2 || res2.error || !Array.isArray(res2.data)) return;
          applyRows(res2.data);
        })
        .catch(function (err) {
          console.error('Supabase announcements load failed:', err);
        });
    } catch (e) {
      console.error('Supabase announcements sync exception:', e);
    }
  }

  /** ???????? ?? ??? (????? ??? ?? + ???? ??? 5??. ?? Supabase ??? ?????????????*/
  function getRecentAnnouncements() {
    return getAnnouncementsSorted().slice(0, 5);
  }

  /** ??????????? ?? ?????(notice_files ???) */
  function syncAnnouncementFileCounts() {
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase || !announcementsData || announcementsData.length === 0) return;
      var ids = announcementsData.map(function (a) { return a.id; }).filter(Boolean);
      if (ids.length === 0) return;
      supabase.from('notice_files')
        .select('notice_id')
        .in('notice_id', ids)
        .then(function (res) {
          if (res && res.error) {
            console.error('notice_files count load error', res.error);
            return;
          }
          var counts = {};
          (res.data || []).forEach(function (row) {
            var nid = String(row.notice_id);
            counts[nid] = (counts[nid] || 0) + 1;
          });
          announcementsData.forEach(function (a) {
            a.fileCount = counts[a.id] || 0;
          });
          renderAnnouncementsPage();
          renderDashboardAnnouncements();
        })
        .catch(function (err) {
          console.error('notice_files count load failed', err);
        });
    } catch (e) {
      console.error('syncAnnouncementFileCounts exception', e);
    }
  }

  /** ??????? ??(?????isNew ??. ?? ??????? ???? ?????????????) */
  function getUnreadAnnouncementCount() {
    return getAnnouncements().filter(function (a) { return a.isNew === true; }).length;
  }

  /** ????????? ?? ???? (?????? ???? */
  function hasImportantUnread() {
    return getAnnouncements().some(function (a) { return a.isNew === true && a.important === true; });
  }

  /** ??? ??? ?? (?? ??????? ??????Supabase ???) */
  function markAnnouncementRead(id) {
    var a = announcementsData.find(function (x) { return x.id === id; });
    if (a) a.isNew = false;
    renderSidebarAnnouncementBadge();
  }

  /**
   * ??? ??? (Supabase insert + ?????? ?????
   * @param {Object} announcement - { title, content, important }
   * @param {File[]} [fileList] - ??? ??? ??
   * @returns {Promise<void>}
   */
  function addAnnouncement(announcement, fileList) {
    var title = (announcement.title || '').trim();
    if (!title) return Promise.resolve();
    var maxId = 0;
    announcementsData.forEach(function (a) {
      var n = parseInt(a.id, 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    });
    var newId = String(maxId + 1);
    var today = new Date();
    var createdAt = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var authorUserId = cur && cur.authUserId != null ? String(cur.authUserId) : (cur && cur.id != null ? String(cur.id) : null);
    var authorName = cur && cur.name ? String(cur.name).trim() : '';
    var authorDepartment = cur && cur.team ? String(cur.team).trim() : '';
    var showroomCode = cur && cur.showroom ? String(cur.showroom).trim() : '';
    var showroomLabel = showroomCode ? getShowroomName(showroomCode) : '';
    var item = {
      id: newId,
      title: title,
      content: (announcement.content || '').trim(),
      createdAt: createdAt,
      important: !!announcement.important,
      isNew: true,
      authorUserId: authorUserId,
      authorName: authorName,
      authorDepartment: authorDepartment,
      showroom: showroomLabel,
      fileCount: (fileList && fileList.length) ? fileList.length : 0
    };
    announcementsData.unshift(item);
    var row = {
      id: item.id,
      title: item.title,
      content: item.content,
      created_at: item.createdAt,
      important: item.important,
      is_new: item.isNew,
      created_by_id: item.authorUserId,
      created_by_name: item.authorName,
      created_by_team: item.authorDepartment,
      showroom: item.showroom || null
    };
    var files = (fileList && fileList.length) ? fileList : [];
    function finish() {
      if (typeof logActivity === 'function') {
        logActivity({ actionType: 'create', targetType: 'notice', targetId: item.id, targetName: item.title, description: '공지 등록' });
      }
      renderAnnouncementsPage();
      renderDashboardAnnouncementBanner();
      renderDashboardAnnouncements();
      renderSidebarAnnouncementBadge();
    }
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      finish();
      return Promise.resolve();
    }
    return supabase.from('announcements').upsert(row)
      .then(function (res) {
        if (res && res.error) {
          console.error('Supabase announcements upsert error:', res.error);
        }
        if (files.length === 0) {
          finish();
          return;
        }
        return uploadNoticeFiles(item.id, files).then(function (uploaded) {
          if (uploaded && uploaded.length) {
            item.fileCount = uploaded.length;
          }
          finish();
        }).catch(function (err) {
          console.error('uploadNoticeFiles failed', err);
          finish();
        });
      })
      .catch(function (err) {
        console.error('Supabase announcements upsert failed:', err);
        finish();
      });
  }

  /** ?????? ???: ????? ???, ??? ????*/
  function getAnnouncementsSorted() {
    return getAnnouncements().slice().sort(function (a, b) {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  /** ?????? 3????????? (createdAt: YYYY-MM-DD) */
  function isAnnouncementWithin3Days(createdAt) {
    if (!createdAt) return false;
    var created = new Date(createdAt);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    created.setHours(0, 0, 0, 0);
    var diffMs = today - created;
    var diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return diffDays >= 0 && diffDays <= 3;
  }

  /** ??? ??? HTML (NEW 3?????, ??) */
  function getAnnouncementBadgesHtml(a) {
    var parts = [];
    if (isAnnouncementWithin3Days(a.createdAt)) parts.push('<span class="announcement-badge new">NEW</span>');
    if (a.important) parts.push('<span class="announcement-badge important">중요</span>');
    return parts.join('');
  }

  /** ??? ???? (????+ Storage ??? + Supabase announcements, CASCADE??notice_files ????) */
  function deleteAnnouncement(id) {
    var target = announcementsData.find(function (a) { return a.id === id; });
    var title = target && target.title;
    announcementsData = announcementsData.filter(function (a) { return a.id !== id; });
    try {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (supabase) {
        supabase.from('notice_files').select('file_path').eq('notice_id', id)
          .then(function (res) {
            var paths = (res && res.data) ? res.data.map(function (r) { return r.file_path; }).filter(Boolean) : [];
            if (paths.length > 0) {
              return supabase.storage.from('notice_files').remove(paths).then(function () {
                return supabase.from('announcements').delete().eq('id', id);
              }).catch(function (err) {
                console.error('notice_files storage remove failed', err);
                return supabase.from('announcements').delete().eq('id', id);
              });
            }
            return supabase.from('announcements').delete().eq('id', id);
          })
          .then(function (res) {
            if (res && res.error) console.error('Supabase announcements delete error:', res.error);
          })
          .catch(function (err) { console.error('Supabase announcements delete failed:', err); });
      }
    } catch (e) {
      console.error('Supabase announcements delete exception:', e);
    }
    if (typeof logActivity === 'function') {
      logActivity({ actionType: 'delete', targetType: 'notice', targetId: id, targetName: title || '(제목 없음)', description: '공지 삭제' });
    }
    renderAnnouncementsPage();
    renderDashboardAnnouncementBanner();
    renderDashboardAnnouncements();
    renderSidebarAnnouncementBadge();
  }

  /** ??? ??? ????????? */
  function isAllowedNoticeFile(name) {
    var ext = (name || '').split('.').pop().toLowerCase();
    return ALLOWED_NOTICE_EXT.indexOf(ext) !== -1;
  }

  /** Storage ????????? ??? ??????? (????/????? ???). DB??????????? ????? file.name ???? */
  function sanitizeNoticeFileName(name) {
    var s = (name || '').trim();
    var lastDot = s.lastIndexOf('.');
    var ext = lastDot >= 0 ? s.slice(lastDot + 1).toLowerCase() : '';
    var base = lastDot >= 0 ? s.slice(0, lastDot) : s;
    var safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'file';
    var safe = ext ? (safeBase.slice(0, 180) + '.' + ext) : safeBase.slice(0, 180);
    return safe.slice(0, 200);
  }

  /** ??? ??? ?? ??? ??? ?? */
  function handleNoticeFileSelect(e) {
    var input = e && e.target;
    var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
    files.forEach(function (file) {
      if (isAllowedNoticeFile(file.name)) {
        selectedNoticeFiles.push(file);
      }
    });
    if (input) input.value = '';
    renderSelectedNoticeFiles();
  }

  /** ??? ??? ?? ??? ??? ??? */
  function removeSelectedNoticeFile(index) {
    selectedNoticeFiles.splice(index, 1);
    renderSelectedNoticeFiles();
  }

  /** ??? ??? ?? ???????? ?? UI */
  function renderSelectedNoticeFiles() {
    var el = document.getElementById('noticeSelectedFileList');
    if (!el) return;
    if (selectedNoticeFiles.length === 0) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = '<p class="notice-file-list-label">선택된 파일:</p>' + selectedNoticeFiles.map(function (f, i) {
      return '<div class="notice-file-item">' +
        '<span class="notice-file-name">' + escapeHtml(f.name) + '</span> ' +
        '<button type="button" class="notice-file-remove" data-index="' + i + '" aria-label="삭제">&times;</button>' +
        '</div>';
    }).join('');
    el.querySelectorAll('.notice-file-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) removeSelectedNoticeFile(idx);
      });
    });
  }

  /** Storage????? ??? ???????notice_files ????? insert */
  function uploadNoticeFiles(noticeId, files) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!supabase || !noticeId || !files || files.length === 0) return Promise.resolve([]);
    var year = new Date().getFullYear();
    var uploadedBy = cur && cur.authUserId ? cur.authUserId : null;
    var uploadedByName = (cur && cur.name ? String(cur.name).trim() : '') || null;
    var bucket = 'notice_files';
    var results = [];

    function uploadOne(file) {
      var baseName = sanitizeNoticeFileName(file.name);
      var path = year + '/' + noticeId + '/' + Date.now() + '_' + baseName;
      return supabase.storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true })
        .then(function (res) {
          if (res && res.error) {
            console.error('notice_files upload error', res.error);
            return null;
          }
          var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          return {
            notice_id: noticeId,
            file_name: file.name,
            file_path: path,
            file_url: publicUrl,
            file_type: (file.type || '').split('/').pop() || null,
            file_size: file.size != null ? file.size : null,
            uploaded_by: uploadedBy,
            uploaded_by_name: uploadedByName
          };
        })
        .catch(function (err) {
          console.error('notice_files upload failed', err);
          return null;
        });
    }

    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () { return uploadOne(file); }).then(function (r) {
        if (r) results.push(r);
      });
    });
    return chain.then(function () {
      if (results.length === 0) return [];
      return supabase.from('notice_files').insert(results).then(function (res) {
        if (res && res.error) console.error('notice_files insert error', res.error);
        return results;
      }).catch(function (err) {
        console.error('notice_files insert failed', err);
        return results;
      });
    });
  }

  /** ??? ?????? ?? ?? */
  function loadNoticeFiles(noticeId) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !noticeId) return Promise.resolve([]);
    return supabase.from('notice_files').select('*').eq('notice_id', noticeId).order('created_at', { ascending: true })
      .then(function (res) {
        if (res && res.error) {
          console.error('notice_files load error', res.error);
          return [];
        }
        return res.data || [];
      })
      .catch(function (err) {
        console.error('notice_files load failed', err);
        return [];
      });
  }

  /** ??? ??? ??: ?????? ?? ??? (??/?????) */
  function renderNoticeFiles(files) {
    var section = document.getElementById('noticeDetailFileSection');
    var listEl = document.getElementById('noticeDetailFileList');
    if (!section || !listEl) return;
    section.classList.remove('hidden');
    section.style.cssText = 'background:#232323!important;border:1px solid #343434!important;border-radius:14px!important;padding:18px!important;box-sizing:border-box!important;margin-bottom:1.25rem!important;';
    if (!files || files.length === 0) {
      listEl.innerHTML = '<p class="notice-file-empty">첨부 파일 없음</p>';
      return;
    }
    var ext = function (name) {
      return (name || '').split('.').pop().toLowerCase();
    };
    listEl.innerHTML = files.map(function (f) {
      var name = escapeHtml(f.file_name || '');
      var fileExt = ext(f.file_name);
      var isImage = ['jpg', 'jpeg', 'png'].indexOf(fileExt) !== -1;
      var canPreview = ['pdf', 'jpg', 'jpeg', 'png'].indexOf(fileExt) !== -1;
      var previewBtn = canPreview
        ? '<button type="button" class="notice-file-preview btn-pill">미리보기</button>'
        : '';
      var imgPreview = isImage
        ? '<div class="notice-file-img-wrap"><img src="' + escapeHtml(f.file_url || '') + '" alt="' + name + '" class="notice-file-img-thumb" loading="lazy"></div>'
        : '';
      return '<div class="notice-file-item">' +
        '<div class="notice-file-item-header">' +
        '<span class="notice-file-name">' + name + '</span>' +
        '<div class="notice-file-actions">' +
        previewBtn +
        '<a href="' + escapeHtml(f.file_url || '') + '" target="_blank" rel="noopener" download="' + escapeHtml(f.file_name || '') + '" class="notice-file-download btn-pill">다운로드</a>' +
        '</div></div>' +
        imgPreview +
        '</div>';
    }).join('');
    listEl.querySelectorAll('.notice-file-preview').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.notice-file-item');
        var link = item && item.querySelector('.notice-file-download');
        if (link && link.href) window.open(link.href, '_blank');
      });
    });
  }

  /** ?????????? ?????(contract_files ??) */
  function uploadContractAttachment(contractId, file) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !contractId || !file) return Promise.resolve(null);
    var year = new Date().getFullYear();
    var safeName = sanitizeNoticeFileName(file.name || 'contract');
    var bucket = 'contract_files';
    var path = 'contracts/' + year + '/' + contractId + '/' + Date.now() + '_' + safeName;
    return supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    }).then(function (res) {
      if (res && res.error) {
        console.error('contract_files upload error', res.error);
        return null;
      }
      var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return {
        url: publicUrl,
        path: path,
        name: file.name || safeName
      };
    }).catch(function (err) {
      console.error('contract_files upload failed', err);
      return null;
    });
  }

  function uploadContractExtraFile(contractId, file) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !contractId || !file) return Promise.resolve(null);
    var year = new Date().getFullYear();
    var safeName = sanitizeNoticeFileName(file.name || 'extra');
    var bucket = 'contract_files';
    var path = 'contracts/' + year + '/' + contractId + '/extras/' + Date.now() + '_' + safeName;
    return supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    }).then(function (res) {
      if (res && res.error) {
        console.error('contract_files extra upload error', res.error);
        return null;
      }
      var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return {
        url: publicUrl,
        path: path,
        name: file.name || safeName
      };
    }).catch(function (err) {
      console.error('contract_files extra upload failed', err);
      return null;
    });
  }

  /** ??? ?????? ??? ?????(contract_files ??, design_drawings ??) */
  function uploadDesignDrawingAttachment(contractId, file) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !contractId || !file) return Promise.resolve(null);
    var year = new Date().getFullYear();
    var safeName = sanitizeNoticeFileName(file.name || 'drawing');
    var bucket = 'contract_files';
    var path = 'design_drawings/' + year + '/' + contractId + '/' + Date.now() + '_' + safeName;
    return supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    }).then(function (res) {
      if (res && res.error) {
        console.error('contract_files design_drawings upload error', res.error);
        return null;
      }
      var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return { url: publicUrl, path: path, name: file.name || safeName };
    }).catch(function (err) {
      console.error('contract_files design_drawings upload failed', err);
      return null;
    });
  }

  /** ??? ?????? ??? ?????(contract_files ??, construction_drawings ??) */
  function uploadConstructionDrawingAttachment(contractId, file) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !contractId || !file) return Promise.resolve(null);
    var year = new Date().getFullYear();
    var safeName = sanitizeNoticeFileName(file.name || 'construction');
    var bucket = 'contract_files';
    var path = 'construction_drawings/' + year + '/' + contractId + '/' + Date.now() + '_' + safeName;
    return supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    }).then(function (res) {
      if (res && res.error) {
        console.error('contract_files construction_drawings upload error', res.error);
        return null;
      }
      var publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return { url: publicUrl, path: path, name: file.name || safeName };
    }).catch(function (err) {
      console.error('contract_files construction_drawings upload failed', err);
      return null;
    });
  }

  /** ??? ???? ?????(notice_comments ??, ??????????) */
  function renderNoticeComments(comments) {
    var listEl = document.getElementById('noticeCommentsList');
    var countEl = document.getElementById('noticeCommentsCount');
    console.log('noticeCommentsList element', listEl);
    console.log('render comments count', comments && comments.length);
    if (!listEl) return;
    if (!comments || comments.length === 0) {
      listEl.innerHTML = '<div class="notice-empty-comments">댓글이 없습니다. 첫 댓글을 남겨보세요.</div>';
      if (countEl) countEl.textContent = '0';
      console.log('rendered html (empty)', listEl.innerHTML);
      return;
    }
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var curUserId = cur && cur.authUserId ? String(cur.authUserId) : null;
    var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
    if (countEl) countEl.textContent = String(comments.length);

    listEl.innerHTML = '';
    comments.forEach(function (c) {
      var name = c.author_name || '-';
      var dept = c.author_department || '-';
      var showroom = c.showroom || '-';
      var date = c.created_at ? String(c.created_at).replace('T', ' ').slice(0, 16) : '';
      var canDelete = false;
      if (curUserId && c.author_user_id && String(c.author_user_id) === curUserId) {
        canDelete = true;
      }
      if (isAdminRole) canDelete = true;
      var safeContent = escapeHtml(c.content || '');
      var html =
        '<div class="notice-comment-card" data-comment-id="' + c.id + '">' +
          '<div class="notice-comment-head">' +
            '<div class="notice-comment-author-wrap">' +
              '<div class="notice-comment-author">' + escapeHtml(name) + '</div>' +
              '<div class="notice-comment-meta">' +
                escapeHtml(dept) + ' | ' + escapeHtml(showroom) + (date ? ' | ' + escapeHtml(date) : '') +
              '</div>' +
            '</div>' +
            (canDelete
              ? '<button type="button" class="notice-comment-delete" data-comment-id="' + c.id + '">삭제</button>'
              : '') +
          '</div>' +
          '<div class="notice-comment-body">' + safeContent + '</div>' +
        '</div>';
      listEl.insertAdjacentHTML('beforeend', html);
    });
    console.log('rendered html', listEl.innerHTML);
  }

  /** Supabase??? ??? ????????? ?? (notice_comments) */
  function loadNoticeComments(noticeId) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !noticeId) return;
    console.log('[notice_comments] loadNoticeComments noticeId =', noticeId);
    supabase.from('notice_comments')
      .select('id, notice_id, content, author_user_id, author_name, author_department, showroom, created_at')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res && res.error) {
          console.error('Supabase notice_comments load error:', res.error);
          return;
        }
        console.log('[notice_comments] loadNoticeComments result =', res.data);
        renderNoticeComments(res.data || []);
      })
      .catch(function (err) {
        console.error('Supabase notice_comments load failed:', err);
      });
  }

  /** ???? ??? (notice_comments) */
  function submitNoticeComment(noticeId) {
    var input = document.getElementById('noticeCommentInput');
    if (!input) return;
    var content = input.value || '';
    if (!noticeId || !content.trim()) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) return;
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur) return;
    var showroomName = (cur.showroom && typeof getShowroomName === 'function') ? getShowroomName(cur.showroom) : (cur.showroom || '');
    var payload = {
      notice_id: noticeId,
      content: content.trim(),
      author_user_id: cur.authUserId || null,
      author_name: (cur.name || '').trim() || null,
      author_department: (cur.team || '').trim() || null,
      showroom: (showroomName || '').trim() || null
    };
    console.log('[notice_comments] submitNoticeComment payload =', payload);
    supabase.from('notice_comments').insert(payload)
      .then(function (res) {
        if (res && res.error) {
          console.error('Supabase notice_comments insert error:', res.error);
          return;
        }
        console.log('[notice_comments] insert result =', res.data);
        input.value = '';
        loadNoticeComments(noticeId);
      })
      .catch(function (err) {
        console.error('Supabase notice_comments insert failed:', err);
      });
  }

  /** ???? ???? (notice_comments) */
  function deleteNoticeComment(commentId) {
    if (!commentId) return;
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) return;
    console.log('[notice_comments] deleteNoticeComment id =', commentId);
    supabase.from('notice_comments').delete().eq('id', commentId)
      .then(function (res) {
        if (res && res.error) {
          console.error('Supabase notice_comments delete error:', res.error);
          return;
        }
        console.log('[notice_comments] delete result =', res.data);
        if (typeof loadNoticeComments === 'function' && typeof currentAnnouncementId !== 'undefined' && currentAnnouncementId) {
          loadNoticeComments(currentAnnouncementId);
        }
      })
      .catch(function (err) {
        console.error('Supabase notice_comments delete failed:', err);
      });
  }

  /** ??? ??? ?? ????(notice_reads upsert) */
  function recordNoticeRead(noticeId) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!supabase || !cur || !noticeId) return Promise.resolve();
    var showroomName = (cur.showroom && typeof getShowroomName === 'function') ? getShowroomName(cur.showroom) : (cur.showroom || '');
    var row = {
      notice_id: noticeId,
      user_id: cur.authUserId || null,
      user_name: (cur.name || '').trim() || null,
      department: (cur.team || '').trim() || null,
      showroom: (showroomName || '').trim() || null
    };
    return supabase.from('notice_reads').upsert(row, { onConflict: 'notice_id,user_id' })
      .then(function () {})
      .catch(function (err) {
        console.error('notice_reads upsert failed', err);
      });
  }

  /** ??? ???? ??? ?? ?? */
  function fetchNoticeReads(noticeId) {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase || !noticeId) return Promise.resolve([]);
    return supabase.from('notice_reads')
      .select('*')
      .eq('notice_id', noticeId)
      .order('read_at', { ascending: true })
      .then(function (res) {
        if (res && res.error) {
          console.error('notice_reads load error:', res.error);
          return [];
        }
        return res.data || [];
      })
      .catch(function (err) {
        console.error('notice_reads fetch failed', err);
        return [];
      });
  }

  /** ???? ??? ?? UI ??? */
  function renderNoticeReads(readers) {
    var list = document.getElementById('noticeReadList');
    var count = document.getElementById('noticeReadCount');
    if (!list || !count) return;
    count.textContent = (readers && readers.length) ? readers.length : 0;
    list.innerHTML = (readers && readers.length)
      ? readers.map(function (r) {
          var name = (r.user_name || '').trim() || '-';
          var dept = (r.department || '').trim() || '-';
          var room = (r.showroom || '').trim() || '-';
          return '<div class="notice-read-user">' + escapeHtml(name) + ' (' + escapeHtml(dept) + ' | ' + escapeHtml(room) + ')</div>';
        }).join('')
      : '';
  }

  // ?? ??? ????? ???????? ???
  function renderAnnouncementComments(comments) {
    renderNoticeComments(comments);
  }

  function loadAnnouncementComments(announcementId) {
    loadNoticeComments(announcementId);
  }

  /** ??? ?? ?? (??? ???? ???, ????????. ?? Supabase ??? ????) */
  function getMonthContracts() {
    var contracts = getContracts();
    var y = getFilterYear();
    var m = getFilterMonth();
    var ym = (y && m) ? (y + '-' + String(m).padStart(2, '0')) : thisMonth();
    return contracts.filter(function (c) {
      return (c.contractDate || '').slice(0, 7) === ym;
    });
  }

  /** ??????????? ?????(?? ??? ???, ??????? ??? ????? */
  function getShowroomForSalesPerson(name) {
    var emp = (getEmployees() || []).find(function (e) { return (e.name || '') === name; });
    if (emp && emp.showroomId) return emp.showroomId;
    var contracts = getMonthContracts().filter(function (c) { return (c.salesPerson || '') === name; });
    if (contracts.length === 0) return '';
    var byShowroom = {};
    contracts.forEach(function (c) {
      var sid = c.showroomId || '';
      byShowroom[sid] = (byShowroom[sid] || 0) + 1;
    });
    var max = 0;
    var out = '';
    Object.keys(byShowroom).forEach(function (sid) {
      if (byShowroom[sid] > max) { max = byShowroom[sid]; out = sid; }
    });
    return out;
  }

  /**
   * ??? ??? TOP 3 (1??? ?? ??, 2??? ??????, ??? ???? ???? ??
   * ?? Supabase ??? API?????????
   */
  function getOverallTopSales() {
    var monthContracts = getMonthContracts();
    if (monthContracts.length === 0) return [];
    var byPerson = {};
    monthContracts.forEach(function (c) {
      var name = c.salesPerson || '-';
      if (!byPerson[name]) byPerson[name] = { count: 0, amount: 0 };
      byPerson[name].count += 1;
      var amt = Number(c.totalAmount) || 0;
      byPerson[name].amount += c.amountUnit === 'manwon' ? amt : Math.round(amt / 10000);
    });
    var list = Object.keys(byPerson).map(function (name) {
      var row = byPerson[name];
      return {
        name: name,
        showroomId: getShowroomForSalesPerson(name),
        count: row.count,
        amount: row.amount
      };
    });
    list.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return b.amount - a.amount;
    });
    return list.slice(0, 3).map(function (item, i) {
      return {
        rank: i + 1,
        name: item.name,
        showroomId: item.showroomId,
        showroomName: getShowroomName(item.showroomId),
        count: item.count,
        amount: item.amount
      };
    });
  }

  /**
   * ?????? ??? TOP 3 (??? ??? ???). ?? Supabase ??? ????
   */
  function getShowroomTopSales(showroomId) {
    var monthContracts = getMonthContracts().filter(function (c) {
      return (c.showroomId || '') === showroomId;
    });
    if (monthContracts.length === 0) return [];
    var byPerson = {};
    monthContracts.forEach(function (c) {
      var name = c.salesPerson || '-';
      if (!byPerson[name]) byPerson[name] = { count: 0, amount: 0 };
      byPerson[name].count += 1;
      var amt = Number(c.totalAmount) || 0;
      byPerson[name].amount += c.amountUnit === 'manwon' ? amt : Math.round(amt / 10000);
    });
    var list = Object.keys(byPerson).map(function (name) {
      var row = byPerson[name];
      return { name: name, count: row.count, amount: row.amount };
    });
    list.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return b.amount - a.amount;
    });
    return list.slice(0, 3).map(function (item, i) {
      return {
        rank: i + 1,
        name: item.name,
        count: item.count,
        amount: item.amount
      };
    });
  }

  /** ??? TOP 3 (getOverallTopSales?? ??? ????? API ??? ???) */
  function getOverallTop3() {
    return getOverallTopSales();
  }

  /** ?????? 1??? ??. ?? Supabase ??? ???? */
  function getTopPerShowroom() {
    return SHOWROOMS.map(function (s) {
      var top3 = getShowroomTopSales(s.id);
      var top = top3.length > 0 ? top3[0] : null;
      return {
        showroomId: s.id,
        showroomName: s.name,
        top: top ? { name: top.name, count: top.count, amount: top.amount } : null
      };
    });
  }

  /** ??? ??? ??? ??? ??? (???????????? ??, Supabase ??? ?????????) */
  function renderSalesPerformance() {
    var overallEl = document.getElementById('sales-performance-overall');
    var showroomsEl = document.getElementById('sales-performance-showrooms');
    if (!overallEl || !showroomsEl) return;

    var _isPrivileged = (typeof isAdmin === 'function' && isAdmin()) || (typeof isMaster === 'function' && isMaster()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
    var _myShowroomId = getMyShowroomId();

    // 전체 top3: 비관리자는 본인 전시장 계약만 기준
    var top3Source = getOverallTopSales();
    if (!_isPrivileged && _myShowroomId) {
      top3Source = top3Source.filter(function (r) { return (r.showroomId || '') === _myShowroomId; });
    }
    var top3 = top3Source.slice(0, 3).map(function (r, i) { return Object.assign({}, r, { rank: i + 1 }); });

    if (top3.length === 0) {
      overallEl.innerHTML = '<p class="sales-performance-empty">이번 달 계약 데이터가 없습니다.</p>';
    } else {
      var first = top3[0];
      var firstHtml = '<div class="sales-performance-first">' +
        '<span class="sales-performance-medal" aria-hidden="true">🥇</span>' +
        '<div class="sales-performance-first-body">' +
          '<span class="sales-performance-name">' + escapeHtml(first.name || '-') + '</span>' +
          '<span class="sales-performance-count">' + first.count + '건</span>' +
          '<span class="sales-performance-amount">' + formatMoney(first.amount) + '만원</span>' +
          '<span class="sales-performance-showroom">' + escapeHtml(first.showroomName || '-') + '</span>' +
        '</div></div>';
      var subList = top3.slice(1).map(function (row) {
        var icon = row.rank === 2 ? '🥈' : '🥉';
        return '<li class="sales-performance-sub-item">' +
          '<span class="sales-performance-sub-medal" aria-hidden="true">' + icon + '</span>' +
          '<span class="sales-performance-sub-name">' + escapeHtml(row.name || '-') + '</span>' +
          '<span class="sales-performance-sub-stats">' + row.count + '건 | ' + formatMoney(row.amount) + '만원</span>' +
          '</li>';
      }).join('');
      overallEl.innerHTML = firstHtml + '<ul class="sales-performance-sub-list">' + subList + '</ul>';
    }

    // 전시장별 카드: 비관리자는 본인 전시장만
    var perShowroom = getTopPerShowroom();
    if (!_isPrivileged && _myShowroomId) {
      perShowroom = perShowroom.filter(function (item) { return (item.showroomId || '') === _myShowroomId; });
    }
    showroomsEl.innerHTML = perShowroom.map(function (item) {
      if (!item.top) {
        return '<div class="card sales-performance-showroom-card">' +
          '<span class="sales-performance-showroom-label">' + escapeHtml(item.showroomName) + '</span>' +
          '<p class="sales-performance-empty-inline">데이터 없음</p></div>';
      }
      var t = item.top;
      return '<div class="card sales-performance-showroom-card">' +
        '<span class="sales-performance-showroom-label">' + escapeHtml(item.showroomName) + '</span>' +
        '<span class="sales-performance-showroom-name">' + escapeHtml(t.name) + '</span>' +
        '<span class="sales-performance-showroom-count">' + t.count + '건</span>' +
        '<span class="sales-performance-showroom-amount">' + formatMoney(t.amount) + '만원</span>' +
        '</div>';
    }).join('');
  }

  /** ?????????? ?? ??? 1???? ?? */
  function renderDashboardAnnouncementBanner() {
    var wrap = document.getElementById('dashboard-announcement-banner');
    if (!wrap) return;
    var sorted = getAnnouncementsSorted();
    var a = sorted[0];
    if (!a) {
      wrap.innerHTML = '';
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    var badges = getAnnouncementBadgesHtml(a);
    var preview = (a.content || '').slice(0, 120);
    if ((a.content || '').length > 120) preview += '…';
    wrap.innerHTML = '<button type="button" class="dashboard-announcement-banner" data-announcement-id="' + (a.id || '') + '">' +
      '<div class="dashboard-announcement-banner-badges">' + badges + '</div>' +
      '<h4 class="dashboard-announcement-banner-title">' + escapeHtml(a.title || '') + '</h4>' +
      '<p class="dashboard-announcement-banner-meta">' + (a.createdAt || '') + '</p>' +
      '<p class="dashboard-announcement-banner-preview">' + escapeHtml(preview) + '</p>' +
      '<span class="dashboard-announcement-banner-cta">자세히 보기</span>' +
      '</button>';
  }

  /** ??????????: ?? 5?????, ????? ??? ?? (getRecentAnnouncements ???) */
  function renderDashboardAnnouncements() {
    var listEl = document.getElementById('dashboard-announcements-list');
    if (!listEl) return;
    var items = getRecentAnnouncements();
    listEl.innerHTML = items.length === 0
      ? '<li class="announcement-item"><span class="announcement-item-preview">공지사항이 없습니다.</span></li>'
      : items.map(function (a) {
          var preview = (a.content || '').slice(0, 80);
          if ((a.content || '').length > 80) preview += '…';
          var badges = getAnnouncementBadgesHtml(a);
          var attach = a.fileCount && a.fileCount > 0
            ? '<span class="announcement-attach-badge">첨부 ' + a.fileCount + '</span>'
            : '';
          return '<li class="announcement-item">' +
            '<div class="announcement-item-title">' + badges + escapeHtml(a.title || '') + (attach ? ' ' + attach : '') + '</div>' +
            '<div class="announcement-item-date">' + (a.createdAt || '') + '</div>' +
            '<div class="announcement-item-preview">' + escapeHtml(preview) + '</div>' +
            '</li>';
        }).join('');
  }

  /** ?????? ?????? ?? ??? ??? (????? ????? ?? ??????) */
  function renderSidebarAnnouncementBadge() {
    var badgeEl = document.getElementById('sidebar-announcement-badge');
    if (!badgeEl) return;
    var count = getUnreadAnnouncementCount();
    var importantUnread = hasImportantUnread();
    badgeEl.classList.remove('hidden', 'nav-item-badge-important');
    if (count <= 0) {
      badgeEl.classList.add('hidden');
      badgeEl.textContent = '';
      badgeEl.setAttribute('aria-label', '');
      return;
    }
    badgeEl.textContent = count;
    badgeEl.setAttribute('aria-label', '안 읽은 공지 ' + count + '건');
    if (importantUnread) badgeEl.classList.add('nav-item-badge-important');
  }

  /** ?????? ??? ???? ??????? (????? ??? ??, ???? NEW/?? ???) */
  function renderAnnouncementsPage() {
    var listEl = document.getElementById('announcements-page-list');
    if (!listEl) return;
    var items = getAnnouncementsSorted();
    listEl.innerHTML = items.length === 0
      ? '<p class="announcements-page-empty">공지사항이 없습니다.</p>'
      : items.map(function (a) {
          var badges = getAnnouncementBadgesHtml(a);
          var attach = a.fileCount && a.fileCount > 0
            ? '<span class="announcement-attach-badge">첨부 ' + a.fileCount + '</span>'
            : '';
          return '<article class="announcement-page-card" role="button" tabindex="0" data-announcement-id="' + (a.id || '') + '">' +
            '<div class="announcement-page-card-head">' +
              '<h4 class="announcement-page-card-title">' + badges + escapeHtml(a.title || '') + (attach ? ' ' + attach : '') + '</h4>' +
              '<div class="announcement-page-card-meta-line">' +
                '<time class="announcement-page-card-date">' + (a.createdAt || '') + '</time>' +
                (a.authorName || a.authorDepartment || a.showroom
                  ? '<span class="announcement-page-card-author"> · 작성자: ' + escapeHtml(a.authorName || '-') +
                    ' | 부서: ' + escapeHtml(a.authorDepartment || '-') +
                    ' | 전시장: ' + escapeHtml(a.showroom || '-') +
                    '</span>'
                  : '') +
              '</div>' +
            '</div>' +
            '<p class="announcement-page-card-preview">' + escapeHtml((a.content || '').slice(0, 100)) + ((a.content || '').length > 100 ? '…' : '') + '</p>' +
            '</article>';
        }).join('');
  }

  /** ??? ??? ?? ??? */
  function openAnnouncementDetail(id) {
    var list = getAnnouncements();
    var a = list.find(function (x) { return x.id === id; });
    if (!a) return;
    currentAnnouncementId = id;
    var modal = document.getElementById('modal-announcement-detail');
    if (!modal) return;
    setEl('modal-announcement-title', a.title || '');
    var meta = '등록일: ' + (a.createdAt || '');
    if (a.authorName || a.authorDepartment || a.showroom) {
      var parts = [];
      if (a.authorName) parts.push('작성자: ' + a.authorName);
      if (a.authorDepartment) parts.push('부서: ' + a.authorDepartment);
      if (a.showroom) parts.push('전시장: ' + a.showroom);
      meta += ' · ' + parts.join(' | ');
    }
    setEl('modal-announcement-meta', meta);
    var bodyEl = document.getElementById('modal-announcement-body');
    if (bodyEl) bodyEl.innerHTML = escapeHtml(a.content || '').replace(/\n/g, '<br>');
    // ???? ??
    if (typeof loadNoticeComments === 'function') {
      loadNoticeComments(id);
    } else {
      loadAnnouncementComments(id);
    }
    // ???? ?? ?? ???: ?? ??? ??? ?????
    var btnDelete = document.getElementById('btn-announcement-delete');
    if (btnDelete) {
      var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
      var isOwner = cur && a.authorUserId && cur.authUserId && String(cur.authUserId) === String(a.authorUserId);
      var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
      if (isOwner || isAdminRole) {
        btnDelete.classList.remove('hidden');
      } else {
        btnDelete.classList.add('hidden');
      }
    }
    modal.classList.remove('hidden');
    markAnnouncementRead(id);
    // ??? ?? ?????????? ??? ?? ???
    recordNoticeRead(id).then(function () {
      return fetchNoticeReads(id);
    }).then(function (readers) {
      renderNoticeReads(readers || []);
    });
    loadNoticeFiles(id).then(renderNoticeFiles);
  }

  function initAnnouncementDetailModal() {
    var modal = document.getElementById('modal-announcement-detail');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-announcement-detail"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
    document.getElementById('announcements-page-list').addEventListener('click', function (e) {
      var card = e.target.closest('.announcement-page-card');
      if (!card) return;
      var id = card.getAttribute('data-announcement-id');
      if (id) openAnnouncementDetail(id);
    });
    document.getElementById('announcements-page-list').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.announcement-page-card');
      if (!card) return;
      e.preventDefault();
      var id = card.getAttribute('data-announcement-id');
      if (id) openAnnouncementDetail(id);
    });
    // ???? ?? (?? ??? ??? ???)
    var btnDelete = document.getElementById('btn-announcement-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', function () {
        if (!currentAnnouncementId) return;
        if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return;
        deleteAnnouncement(currentAnnouncementId);
        modal.classList.add('hidden');
      });
    }

    // ???? ???
    var commentBtn = document.getElementById('noticeCommentSubmitBtn');
    var commentInput = document.getElementById('noticeCommentInput');
    if (commentBtn && commentInput) {
      commentBtn.addEventListener('click', function () {
        if (!currentAnnouncementId) return;
        submitNoticeComment(currentAnnouncementId);
      });
    }

    // ???? ???? (???)
    var commentsList = document.getElementById('noticeCommentsList');
    if (commentsList) {
      commentsList.addEventListener('click', function (e) {
        var btn = e.target.closest('.notice-comment-delete');
        if (!btn) return;
        var cid = btn.getAttribute('data-comment-id');
        deleteNoticeComment(cid);
      });
    }
  }

  function openAnnouncementFormModal() {
    var modal = document.getElementById('modal-announcement-form');
    if (!modal) return;
    var titleEl = document.getElementById('announcement-form-title');
    var contentEl = document.getElementById('announcement-form-content');
    var importantEl = document.getElementById('announcement-form-important');
    var authorEl = document.getElementById('announcement-form-author-info');
    if (titleEl) titleEl.value = '';
    if (contentEl) contentEl.value = '';
    if (importantEl) importantEl.checked = false;
    if (authorEl) {
      var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
      var name = cur && cur.name ? String(cur.name).trim() : '';
      var team = cur && cur.team ? String(cur.team).trim() : '';
      var showroomId = cur && cur.showroom ? String(cur.showroom).trim() : '';
      var showroomName = showroomId ? getShowroomName(showroomId) : '';
      var parts = [];
      if (name) parts.push('작성자: ' + name);
      if (team) parts.push('부서: ' + team);
      if (showroomName) parts.push('전시장: ' + showroomName);
      authorEl.textContent = parts.length ? parts.join(' | ') : '작성자 정보를 불러올 수 없습니다.';
    }
    selectedNoticeFiles.length = 0;
    if (typeof renderSelectedNoticeFiles === 'function') renderSelectedNoticeFiles();
    modal.classList.remove('hidden');
    if (titleEl) titleEl.focus();
  }

  function initAnnouncementFormModal() {
    var modal = document.getElementById('modal-announcement-form');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-announcement-form"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
    var btnAdd = document.getElementById('btn-announcement-add');
    if (btnAdd) btnAdd.addEventListener('click', openAnnouncementFormModal);
    var form = document.getElementById('form-announcement-add');
    if (form) {
      // ?? ??? ??? ????
      var toggleFinalBadge = function (checkboxId, badgeId) {
        var cb = document.getElementById(checkboxId);
        var badge = document.getElementById(badgeId);
        if (!cb || !badge) return;
        badge.style.display = cb.checked ? 'inline-block' : 'none';
        cb.addEventListener('change', function () {
          badge.style.display = cb.checked ? 'inline-block' : 'none';
        });
      };
      toggleFinalBadge('design-drawing-1-final', 'design-drawing-1-final-badge');
      toggleFinalBadge('design-drawing-2-final', 'design-drawing-2-final-badge');
      toggleFinalBadge('design-drawing-3-final', 'design-drawing-3-final-badge');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = (document.getElementById('announcement-form-title') || {}).value || '';
        var content = (document.getElementById('announcement-form-content') || {}).value || '';
        var important = (document.getElementById('announcement-form-important') || {}).checked || false;
        if (!title.trim()) {
          alert('제목을 입력해주세요.');
          return;
        }
        var fileList = selectedNoticeFiles.slice();
        addAnnouncement({ title: title, content: content, important: important }, fileList).then(function () {
          modal.classList.add('hidden');
          form.reset();
          selectedNoticeFiles.length = 0;
          renderSelectedNoticeFiles();
        });
      });
    }
    var fileInput = document.getElementById('announcement-form-files');
    var btnFileSelect = document.getElementById('btn-notice-file-select');
    if (btnFileSelect && fileInput) {
      btnFileSelect.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', handleNoticeFileSelect);
    }
    var fileDropZone = form && form.querySelector('.notice-file-section');
    if (fileDropZone) {
      fileDropZone.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); fileDropZone.classList.add('notice-file-dragover'); });
      fileDropZone.addEventListener('dragleave', function (e) { e.preventDefault(); fileDropZone.classList.remove('notice-file-dragover'); });
      fileDropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        fileDropZone.classList.remove('notice-file-dragover');
        var files = e.dataTransfer && e.dataTransfer.files ? Array.prototype.slice.call(e.dataTransfer.files) : [];
        files.forEach(function (file) {
          if (isAllowedNoticeFile(file.name)) selectedNoticeFiles.push(file);
        });
        renderSelectedNoticeFiles();
      });
    }
  }

  function renderSalesKing() {
    var wrap = document.getElementById('dashboard-sales-king');
    if (!wrap) return;
    var king = getSalesKingOfMonth();
    if (!king) {
      wrap.innerHTML = '<p class="sales-king-empty">이달 계약 데이터가 없습니다.</p>';
      return;
    }
    wrap.innerHTML =
      '<div class="sales-king-name">' + escapeHtml(king.name) + '</div>' +
      '<div class="sales-king-team">' + escapeHtml(king.team || '') + '</div>' +
      '<div class="sales-king-stats">' +
      '<div class="sales-king-stat"><span class="sales-king-stat-label">계약 건수</span><span class="sales-king-stat-value">' + king.contractCount + '건</span></div>' +
      '<div class="sales-king-stat"><span class="sales-king-stat-label">계약금액</span><span class="sales-king-stat-value">' + formatMoney(king.totalAmount) + '원</span></div>' +
      '</div>';
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var TEAM_LABELS = {
    sales: '영업팀',
    design: '설계팀',
    construction: '시공팀',
    marketing: '마케팅팀',
    settlement: '정산팀',
    management: '경영팀'
  };

  function getCurrentTeamCode() {
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    if (!cur || !cur.team) return null;
    var t = String(cur.team).trim();
    if (t === '영업') return 'sales';
    if (t === '설계') return 'design';
    if (t === '시공') return 'construction';
    if (t === '마케팅') return 'marketing';
    if (t === '정산') return 'settlement';
    if (t === '경영') return 'management';
    return null;
  }

  var teamCalendarYear = null;
  var teamCalendarMonth = null; // 0 ??
  var teamCalendarView = 'month'; // month | week | list

  function ensureTeamCalendarMonth() {
    if (teamCalendarYear === null || teamCalendarMonth === null) {
      var now = new Date();
      teamCalendarYear = now.getFullYear();
      teamCalendarMonth = now.getMonth();
    }
  }

  function setTeamCalendarMonth(year, month) {
    teamCalendarYear = year;
    teamCalendarMonth = month;
  }

  function getTeamCalendarMonthLabel() {
    ensureTeamCalendarMonth();
    return teamCalendarYear + '년 ' + String(teamCalendarMonth + 1) + '월';
  }

  function getTeamCalendarMonthPrefix() {
    ensureTeamCalendarMonth();
    return teamCalendarYear + '-' + String(teamCalendarMonth + 1).padStart(2, '0');
  }

  function getTeamCalendarFilters() {
    var ySel = document.getElementById('team-calendar-filter-year');
    var mSel = document.getElementById('team-calendar-filter-month');
    var showroomSel = document.getElementById('team-calendar-filter-showroom');
    var teamSel = document.getElementById('team-calendar-filter-team');
    var assigneeInput = document.getElementById('team-calendar-filter-assignee');
    var statusSel = document.getElementById('team-calendar-filter-status');
    var typeSel = document.getElementById('team-calendar-filter-type');
    return {
      year: ySel && ySel.value ? Number(ySel.value) : null,
      month: mSel && mSel.value ? Number(mSel.value) : null,
      showroomId: showroomSel && showroomSel.value || '',
      team: teamSel && teamSel.value || '',
      assignee: assigneeInput && assigneeInput.value.trim() || '',
      status: statusSel && statusSel.value || '',
      type: typeSel && typeSel.value || ''
    };
  }

  function filterTeamEvents(events) {
    var filters = getTeamCalendarFilters();
    return events.filter(function (ev) {
      if (!ev) return false;
      var startStr = ev.startDate || ev.date || '';
      if (filters.year && (!startStr || String(startStr).slice(0, 4) !== String(filters.year))) return false;
      if (filters.month && (!startStr || Number(String(startStr).slice(5, 7)) !== filters.month)) return false;
      if (filters.showroomId && (ev.showroomId || '') !== filters.showroomId) return false;
      if (filters.team && (ev.team || '') !== filters.team) return false;
      if (filters.assignee) {
        var assignee = (ev.assigneeName || ev.assignee || '').toLowerCase();
        if (!assignee || assignee.indexOf(filters.assignee.toLowerCase()) === -1) return false;
      }
      if (filters.status && (ev.status || '') !== filters.status) return false;
      if (filters.type && (ev.eventType || '') !== filters.type) return false;
      return true;
    });
  }

  function groupEventsByDate(events, monthPrefix) {
    var byDate = {};
    events.forEach(function (ev) {
      var startStr = ev.startDate || ev.start_date || ev.event_date || ev.date;
      if (!startStr) return;
      var endStr = ev.endDate || ev.end_date || startStr;
      var start = new Date(startStr);
      var end = new Date(endStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      if (end < start) {
        var tmp = start;
        start = end;
        end = tmp;
      }
      var d = new Date(start.getTime());
      while (d.getTime() <= end.getTime()) {
        var dStr = d.toISOString().slice(0, 10);
        if (dStr.slice(0, 7) === monthPrefix) {
          if (!byDate[dStr]) byDate[dStr] = [];
          byDate[dStr].push(ev);
        }
        d.setDate(d.getDate() + 1);
      }
    });
    Object.keys(byDate).forEach(function (d) {
      byDate[d].sort(function (a, b) {
        var ta = a.time || '';
        var tb = b.time || '';
        if (ta === tb) return (a.title || '').localeCompare(b.title || '');
        return ta.localeCompare(tb);
      });
    });
    return byDate;
  }

  function renderTeamCalendarMonth() {
    var grid = document.getElementById('team-calendar-grid-month');
    var label = document.getElementById('team-calendar-current-label');
    if (!grid || !label) return;
    ensureTeamCalendarMonth();
    var year = teamCalendarYear;
    var month = teamCalendarMonth;
    label.textContent = getTeamCalendarMonthLabel();
    var first = new Date(year, month, 1);
    var startDay = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
    var events = filterTeamEvents(getTeamEvents());
    var monthPrefix = getTeamCalendarMonthPrefix();
    var byDate = groupEventsByDate(events, monthPrefix);
    var todayStr = new Date().toISOString().slice(0, 10);
    var html = [];
    for (var w = 0; w < 7; w++) {
      var cls = 'team-calendar-weekday';
      if (w === 0) cls += ' sunday';
      if (w === 6) cls += ' saturday';
      html.push('<div class="' + cls + '">' + weekdayNames[w] + '</div>');
    }
    for (var i = 0; i < startDay; i++) {
      html.push('<div class="team-calendar-cell team-calendar-cell-empty"></div>');
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var dayEvents = byDate[dateStr] || [];
      var eventsHtml = dayEvents.map(function (ev) {
        var cls = 'team-calendar-event';
        if (ev.team && TEAM_LABELS[ev.team]) {
          cls += ' team-calendar-event-' + ev.team;
        }
        var title = ev.title || '(제목 없음)';
        var timeText = ev.startTime || ev.time || '';
        var timePrefix = timeText ? timeText + ' ' : '';
        var creator = ev.createdByName || ev.createdBy || '';
        return '<button type="button" class="' + cls + '" data-team-event-id="' + ev.id + '">' +
          '<span class="team-calendar-event-title">' + escapeHtml(timePrefix + title) + '</span>' +
          (creator ? '<span class="team-calendar-event-meta">' + escapeHtml(creator) + '</span>' : '') +
          '</button>';
      }).join('');
      html.push(
        '<div class="team-calendar-cell' + (dateStr === todayStr ? ' today' : '') + '" data-calendar-date="' + dateStr + '">' +
        '<div class="team-calendar-date">' + day + '</div>' +
        '<div class="team-calendar-events">' + eventsHtml + '</div>' +
        '</div>'
      );
    }
    grid.innerHTML = html.join('');
  }

  function renderTeamCalendarWeek() {
    var grid = document.getElementById('team-calendar-grid-week');
    var label = document.getElementById('team-calendar-current-label');
    if (!grid || !label) return;
    ensureTeamCalendarMonth();
    var year = teamCalendarYear;
    var month = teamCalendarMonth;
    var weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
    var today = new Date();
    var base = new Date(year, month, today.getDate());
    if (base.getMonth() !== month) base = new Date(year, month, 1);
    var dayOfWeek = base.getDay();
    var start = new Date(base);
    start.setDate(base.getDate() - dayOfWeek);
    var events = filterTeamEvents(getTeamEvents());
    var monthPrefix = getTeamCalendarMonthPrefix();
    var byDate = groupEventsByDate(events, monthPrefix);
    var todayStr = today.toISOString().slice(0, 10);
    label.textContent = getTeamCalendarMonthLabel() + ' 이번 주';
    var html = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var dateStr = d.toISOString().slice(0, 10);
      var isToday = dateStr === todayStr;
      var dow = d.getDay();
      var cls = 'team-calendar-week-day';
      if (isToday) cls += ' today';
      if (dow === 0) cls += ' sunday';
      if (dow === 6) cls += ' saturday';
      var dayEvents = (byDate[dateStr] || []).slice().sort(function (a, b) {
        var ta = a.startTime || a.time || '';
        var tb = b.startTime || b.time || '';
        return ta.localeCompare(tb);
      });
      var eventsHtml = dayEvents.map(function (ev) {
        var clsEv = 'team-calendar-event';
        if (ev.team && TEAM_LABELS[ev.team]) clsEv += ' team-calendar-event-' + ev.team;
        var timeText = ev.startTime || ev.time || '';
        var timePrefix = timeText ? timeText + ' ' : '';
        var title = ev.title || '(제목 없음)';
        return '<button type="button" class="' + clsEv + '" data-team-event-id="' + ev.id + '">' +
          '<span class="team-calendar-event-title">' + escapeHtml(timePrefix + title) + '</span>' +
          '</button>';
      }).join('');
      if (!eventsHtml) {
        eventsHtml = '<div class="team-calendar-week-empty">일정 없음</div>';
      }
      html.push(
        '<div class="' + cls + '" data-calendar-date="' + dateStr + '">' +
        '<div class="team-calendar-week-day-header">' +
        '<span class="team-calendar-week-day-name">' + weekdayNames[dow] + '</span>' +
        '<span class="team-calendar-week-day-date">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span>' +
        '</div>' +
        '<div class="team-calendar-week-events">' + eventsHtml + '</div>' +
        '</div>'
      );
    }
    grid.innerHTML = html.join('');
  }

  function renderTeamCalendarList() {
    var tbody = document.getElementById('team-calendar-tbody-list');
    var label = document.getElementById('team-calendar-current-label');
    if (!tbody || !label) return;
    ensureTeamCalendarMonth();
    label.textContent = getTeamCalendarMonthLabel() + ' ? ???';
    // ???????????????? ?? ??????????????????? ?????
    var events = getTeamEvents().slice();
    if (events.length > 0 && console && console.log) {
      // ?????: ??????? ?? ???
      console.log('[TeamCalendar] sample event for list view:', events[0]);
    }
    events.sort(function (a, b) {
      var ad = (a.startDate || a.event_date || a.date || '');
      var bd = (b.startDate || b.event_date || b.date || '');
      if (ad === bd) {
        var at = a.startTime || a.start_time || a.time || '';
        var bt = b.startTime || b.start_time || b.time || '';
        return at.localeCompare(bt);
      }
      return ad.localeCompare(bd);
    });
    if (events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10">일정 데이터가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = events.map(function (ev) {
      var dateStr = ev.event_date || ev.startDate || ev.start_date || ev.date || '';
      var startTime = ev.start_time || ev.startTime || ev.time || '';
      var endTime = ev.end_time || ev.endTime || '';
      var isAllDay = !!(ev.is_all_day || ev.allDay);
      var teamCode = ev.team || ev.team_name || '';
      var teamLabel = TEAM_LABELS[teamCode] || (teamCode || '');
      var assignee = ev.assignee_name || ev.assignee || ev.manager || '-';
      var showroomId = ev.showroom || ev.showroom_name || ev.showroomId || '';
      var showroomName = showroomId ? getShowroomName(showroomId) : '-';
      var statusLabel = getTeamEventStatusLabel(ev.status) || '-';
      var typeRaw = ev.event_type || ev.eventType || ev.type || '';
      var typeLabel = getTeamEventTypeLabel(typeRaw) || '-';

      var startDisplay = '';
      var endDisplay = '';
      if (isAllDay) {
        startDisplay = '종일';
        endDisplay = '-';
      } else {
        startDisplay = startTime || '시작 시간 없음';
        endDisplay = endTime || '-';
      }
      return '<tr data-team-event-id="' + ev.id + '">' +
        '<td>' + escapeHtml(dateStr) + '</td>' +
        '<td>' + escapeHtml(startDisplay) + '</td>' +
        '<td>' + escapeHtml(endDisplay) + '</td>' +
        '<td>' + escapeHtml(teamLabel) + '</td>' +
        '<td>' + escapeHtml(assignee) + '</td>' +
        '<td>' + escapeHtml(showroomName) + '</td>' +
        '<td>' + escapeHtml(ev.title || '') + '</td>' +
        '<td>' + escapeHtml(typeLabel) + '</td>' +
        '<td>' + escapeHtml(statusLabel) + '</td>' +
        '<td>' + getPriorityBadgeHtml(ev.priority) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderTeamCalendarStats() {
    var wrap = document.getElementById('team-calendar-stats-grid');
    if (!wrap) return;
    var events = filterTeamEvents(getTeamEvents());
    var todayStr = new Date().toISOString().slice(0, 10);
    var todayCount = events.filter(function (ev) {
      var s = ev.startDate || ev.date || '';
      return s === todayStr;
    }).length;
    var total = events.length;
    var planned = events.filter(function (ev) { return ev.status === 'planned'; }).length;
    var done = events.filter(function (ev) { return ev.status === 'done'; }).length;
    var consulting = events.filter(function (ev) { return ev.eventType === 'consulting'; }).length;
    wrap.innerHTML =
      '<div class="team-calendar-stat"><div class="team-calendar-stat-label">이번 달 일정</div><div class="team-calendar-stat-value">' + total + '</div></div>' +
      '<div class="team-calendar-stat"><div class="team-calendar-stat-label">오늘 일정</div><div class="team-calendar-stat-value">' + todayCount + '</div></div>' +
      '<div class="team-calendar-stat"><div class="team-calendar-stat-label">예정</div><div class="team-calendar-stat-value">' + planned + '</div></div>' +
      '<div class="team-calendar-stat"><div class="team-calendar-stat-label">완료</div><div class="team-calendar-stat-value">' + done + '</div></div>' +
      '<div class="team-calendar-stat"><div class="team-calendar-stat-label">상담 일정</div><div class="team-calendar-stat-value">' + consulting + '</div></div>';
  }

  function renderTeamCalendar() {
    if (teamCalendarView === 'week') {
      renderTeamCalendarWeek();
    } else if (teamCalendarView === 'list') {
      renderTeamCalendarList();
    } else {
      renderTeamCalendarMonth();
    }
    renderTeamCalendarStats();
  }

  function ensureTeamCalendarTimeOptions() {
    var startSelect = document.getElementById('team-calendar-time-start');
    var endSelect = document.getElementById('team-calendar-time-end');
    function fill(select) {
      if (!select || select.options.length > 0) return;
      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '--:--';
      select.appendChild(emptyOpt);
      for (var h = 0; h < 24; h++) {
        for (var m = 0; m < 60; m += 30) {
          var hh = String(h).padStart(2, '0');
          var mm = String(m).padStart(2, '0');
          var value = hh + ':' + mm;
          var opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
        }
      }
    }
    fill(startSelect);
    fill(endSelect);
  }

  function openTeamEventModal(eventIdOrDate) {
    var modal = document.getElementById('modal-team-calendar');
    var form = document.getElementById('team-calendar-form');
    var deleteBtn = document.getElementById('btn-team-calendar-delete');
    if (!modal || !form) return;
    ensureTeamCalendarTimeOptions();
    var idInput = document.getElementById('team-calendar-id');
    var titleInput = document.getElementById('team-calendar-title');
    var teamSelect = document.getElementById('team-calendar-team');
    var assigneeInput = document.getElementById('assignee_name');
    var showroomSelect = document.getElementById('team-calendar-showroom');
    var typeSelect = document.getElementById('team-calendar-type');
    var statusSelect = document.getElementById('team-calendar-status');
    var prioritySelect = document.getElementById('team-calendar-priority');
    var dateStartInput = document.getElementById('team-calendar-date-start');
    var dateEndInput = document.getElementById('team-calendar-date-end');
    var timeStartInput = document.getElementById('team-calendar-time-start');
    var timeEndInput = document.getElementById('team-calendar-time-end');
    var allDayInput = document.getElementById('team-calendar-all-day');
    var locationInput = document.getElementById('team-calendar-location');
    var contentInput = document.getElementById('team-calendar-content');
    var events = getTeamEvents();
    var ev = events.find(function (x) { return x.id === eventIdOrDate; });
    if (ev) {
      idInput.value = ev.id;
      titleInput.value = ev.title || '';
      teamSelect.value = ev.team || '';
      if (assigneeInput) assigneeInput.value = ev.assignee_name || ev.assignee || ev.manager || '';
      showroomSelect.value = ev.showroomId || '';
      if (typeSelect) typeSelect.value = ev.eventType || '';
      if (statusSelect) statusSelect.value = ev.status || 'planned';
      if (prioritySelect) prioritySelect.value = ev.priority || 'normal';
      var startStr = ev.startDate || ev.date || '';
      var endStr = ev.endDate || startStr;
      dateStartInput.value = startStr;
      dateEndInput.value = endStr;
      timeStartInput.value = ev.startTime || ev.time || '';
      timeEndInput.value = ev.endTime || '';
      if (allDayInput) allDayInput.checked = !!ev.allDay;
      if (locationInput) locationInput.value = ev.location || '';
      contentInput.value = ev.content || '';
      if (deleteBtn) deleteBtn.classList.remove('hidden');
    } else {
      idInput.value = '';
      titleInput.value = '';
      var curTeamCode = getCurrentTeamCode();
      teamSelect.value = curTeamCode || '';
      if (assigneeInput) assigneeInput.value = '';
      showroomSelect.value = '';
      if (typeSelect) typeSelect.value = '';
      if (statusSelect) statusSelect.value = 'planned';
      if (prioritySelect) prioritySelect.value = 'normal';
      var baseDate = eventIdOrDate && eventIdOrDate.indexOf('-') > -1 ? eventIdOrDate : '';
      dateStartInput.value = baseDate;
      dateEndInput.value = baseDate;
      timeStartInput.value = '';
      timeEndInput.value = '';
      if (allDayInput) allDayInput.checked = false;
      if (locationInput) locationInput.value = '';
      contentInput.value = '';
      if (deleteBtn) deleteBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
  }

  var SOURCE_LABELS = { youtube: '유튜브', instagram: '인스타그램', naver: '네이버', referral: '지인소개', etc: '기타' };

  function getAssignShowroomSelect(visitId, currentShowroomId) {
    var opts = SHOWROOMS.map(function (s) {
      var sel = (currentShowroomId || '') === s.id ? ' selected' : '';
      return '<option value="' + s.id + '"' + sel + '>' + s.name + '</option>';
    }).join('');
    return '<select class="visit-assign-showroom" data-visit-id="' + visitId + '" title="????? ??? ?????????????????">' + opts + '</select>';
  }

  function getAssignShowroomValue(visitId) {
    var el = document.querySelector('.visit-assign-showroom[data-visit-id="' + visitId + '"]');
    return el ? el.value : '';
  }

  function renderMarketing() {
    var visits = filterByShowroom(getVisits(), 'showroomId');
    visits = filterByYearMonth(visits, 'visitDate');
    var tbody = document.getElementById('tbody-visits');
    if (!tbody) return;
    tbody.innerHTML = visits.map(function (v) {
      var statusClass = v.status === '영업배정' ? 'badge-done' : 'badge-new';
      var statusText = v.status || '신규';
      var dateTime = formatDate(v.visitDate) + (v.visitTime ? ' ' + v.visitTime : '');
      var canAssign = v.status !== '영업배정';
      var checkCell = canAssign ? '<td class="col-check"><input type="checkbox" class="visit-row-check" value="' + v.id + '"></td>' : '<td class="col-check"></td>';
      var assignShowroomCell = canAssign ? '<td class="col-assign-showroom">' + getAssignShowroomSelect(v.id, v.showroomId) + '</td>' : '<td class="col-assign-showroom">' + getShowroomName(v.showroomId) + '</td>';
      var assignBtn = canAssign ? '<button type="button" class="btn btn-sm btn-primary" data-assign-visit="' + v.id + '">영업팀 전달</button>' : '';
      var detailBtn = '<button type="button" class="btn btn-sm btn-secondary" data-visit-detail="' + v.id + '">상세</button>';
      return '<tr>' + checkCell + '<td>' + getShowroomName(v.showroomId) + '</td>' + assignShowroomCell + '<td>' + formatDate(v.createdAt) + '</td><td>' + (v.name || '-') + '</td><td>' + (v.phone || '-') + '</td><td>' + dateTime + '</td><td>' + (v.interestType || '-') + '</td><td>' + (v.desiredPyeong ? v.desiredPyeong + '평' : '-') + '</td><td>' + (v.budgetRange || '-') + '</td><td>' + (v.hasLand === 'Y' ? 'O' : v.hasLand === 'N' ? 'X' : '-') + '</td><td><span class="badge ' + statusClass + '">' + statusText + '</span></td><td>' + detailBtn + ' ' + assignBtn + '</td></tr>';
    }).join('') || '<tr><td colspan="13">방문 데이터가 없습니다.</td></tr>';
  }

  function openVisitDetail(visitId) {
    var visits = getVisits();
    var v = visits.find(function (x) { return x.id === visitId; });
    if (!v) return;
    var html = '<table class="detail-table"><tbody>' +
      '<tr><th>전시장</th><td>' + getShowroomName(v.showroomId) + '</td></tr>' +
      '<tr><th>이름</th><td>' + (v.name || '-') + '</td></tr>' +
      '<tr><th>연락처</th><td>' + (v.phone || '-') + '</td></tr>' +
      '<tr><th>방문일</th><td>' + formatDate(v.visitDate) + '</td></tr>' +
      '<tr><th>방문 시간</th><td>' + (v.visitTime || '-') + '</td></tr>' +
      '<tr><th>방문 횟수</th><td>' + (v.visitCount ? v.visitCount + '회' : '-') + '</td></tr>' +
      '<tr><th>유입 경로</th><td>' + (SOURCE_LABELS[v.source] || v.source || '-') + '</td></tr>' +
      '<tr><th>관심 주택/시공 유형</th><td>' + (v.interestType || '-') + '</td></tr>' +
      '<tr><th>희망 평수</th><td>' + (v.desiredPyeong ? v.desiredPyeong + '평' : '-') + '</td></tr>' +
      '<tr><th>예산 범위</th><td>' + (v.budgetRange || '-') + '</td></tr>' +
      '<tr><th>토지 보유 여부</th><td>' + (v.hasLand === 'Y' ? '있음' : v.hasLand === 'N' ? '없음' : '-') + '</td></tr>' +
      '<tr><th>토지 주소</th><td>' + (v.landAddress || '-') + '</td></tr>' +
      '<tr><th>LG 행사 참여</th><td>' + (v.lgEvent ? 'Y' : '-') + '</td></tr>' +
      '<tr><th>3D 상담</th><td>' + (v.need3d ? 'Y' : '-') + '</td></tr>' +
      '<tr><th>메모</th><td>' + (v.memo || '-') + '</td></tr>' +
      '<tr><th>상태</th><td>' + (v.status || '-') + '</td></tr>' +
      '</tbody></table>';
    var el = document.getElementById('visit-detail-body');
    if (el) el.innerHTML = html;
    document.getElementById('modal-visit-detail').classList.remove('hidden');
  }

  function renderSales() {
    var visitsAll = getVisits().filter(function (v) { return v.status === '영업배정'; });
    var contractsAll = getContracts();
    if (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
      var cur = window.seumAuth.currentEmployee;
      var team = (cur.team || '').trim();
      var myShowroomId = resolveShowroomId(cur);
      // master/admin이 아닌 모든 사용자는 소속 전시장만 노출 (단, 본사 소속은 전체 전시장 노출)
      var _isAdminHere = (typeof isAdmin === 'function' && isAdmin()) || (typeof isMaster === 'function' && isMaster()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
      var _isHeadquartersSales = (myShowroomId === 'headquarters');
      if (myShowroomId && !_isAdminHere && !_isHeadquartersSales) {
        visitsAll = visitsAll.filter(function (v) { return (v.showroomId || '') === myShowroomId; });
        contractsAll = contractsAll.filter(function (c) { return (c.showroomId || '') === myShowroomId; });
      }
    }
    var visits = filterByShowroom(visitsAll, 'showroomId');
    visits = filterByYearMonth(visits, 'visitDate');
    var contracts = filterByShowroom(contractsAll, 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    contracts = getFilteredContracts(contracts);
    // 기본 정렬: 계약일 오래된 순 (오름차순)
    contracts.sort(function (a, b) {
      var dA = a.contractDate || '';
      var dB = b.contractDate || '';
      return dA < dB ? -1 : dA > dB ? 1 : 0;
    });
    var tbodyLeads = document.getElementById('tbody-leads');
    var tbodyContracts = document.getElementById('tbody-contracts');
    if (tbodyLeads) {
      var allContracts = contractsAll;
      var alreadyContract = {};
      allContracts.forEach(function (c) { if (c.visitId) alreadyContract[c.visitId] = true; });
      var leads = visits.filter(function (v) { return !alreadyContract[v.id]; });
      tbodyLeads.innerHTML = leads.map(function (v) {
        return '<tr><td>' + getShowroomName(v.showroomId) + '</td><td>' + formatDate(v.assignedToSalesAt) + '</td><td>' + (v.name || '-') + '</td><td>' + (v.phone || '-') + '</td><td>' + formatDate(v.visitDate) + '</td><td><button type="button" class="btn btn-sm btn-primary" data-create-contract="' + v.id + '">계약 작성</button></td></tr>';
      }).join('') || '<tr><td colspan="6">리드 데이터가 없습니다.</td></tr>';
    }
    if (tbodyContracts) {
      var curUser = (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) ? window.seumAuth.currentEmployee : null;
      var userTeam = (curUser && curUser.team) ? String(curUser.team).trim() : '';
      var userName = (curUser && curUser.name) ? String(curUser.name).trim() : '';
      var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isMaster === 'function' && isMaster()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
      // master/admin이 아닌 모든 사용자는 소속 전시장 계약만 노출 (단, 본사 소속은 전체 전시장 노출)
      if (curUser && !isAdminRole) {
        var myShowroomId = resolveShowroomId(curUser);
        var _isHQSalesContracts = (myShowroomId === 'headquarters');
        if (myShowroomId && !_isHQSalesContracts) {
          contracts = contracts.filter(function (c) { return (c.showroomId || '') === myShowroomId; });
        }
      }
      // contract-detail-panel이 tbody 안으로 이동된 경우, innerHTML 초기화로 소멸되는 것을 방지
      (function () {
        var _p = document.getElementById('contract-detail-panel');
        if (_p && tbodyContracts.contains(_p)) {
          var _tbl = tbodyContracts.closest('table');
          var _safe = _tbl && _tbl.closest('.table-wrap') && _tbl.closest('.table-wrap').parentNode;
          if (_safe) _safe.appendChild(_p);
        }
      })();
      tbodyContracts.innerHTML = contracts.map(function (c, i) {
        var _amountDivisor = c.amountUnit === 'manwon' ? 1 : 10000;
        function amountCell(amount, date, type) {
          if (amount != null && String(amount).trim() !== '') {
            var displayAmt = Math.round(Number(amount) / _amountDivisor);
            var label = formatMoney(displayAmt) + '만원';
            if (date) label += ' (' + formatDate(date) + ')';
            return '<span class="payment-label">' + label + '</span> <button type="button" class="btn btn-xs btn-secondary" data-payment="' + type + '" data-id="' + c.id + '">수정</button>';
          }
          return '<button type="button" class="btn btn-sm btn-secondary" data-payment="' + type + '" data-id="' + c.id + '">입금</button>';
        }
        var deposit = amountCell(c.depositAmount, c.depositReceivedAt, 'deposit');
        var p1 = amountCell(c.progress1Amount, c.progress1ReceivedAt, 'progress1');
        var p2 = amountCell(c.progress2Amount, c.progress2ReceivedAt, 'progress2');
        var p3 = amountCell(c.progress3Amount, c.progress3ReceivedAt, 'progress3');
        var balance = amountCell(c.balanceAmount, c.balanceReceivedAt, 'balance');
        var salesPerson = (c.salesPerson || '-');
        var houseType = (c.contractModel || '-');
        var modelName = (c.contractModelName || '-');
        var editFieldBtn = function(field) { return ' <button type="button" class="btn btn-xs btn-secondary" data-contract-field="' + field + '" data-id="' + c.id + '">수정</button>'; };
        var detailBtn = '<button type="button" class="btn btn-sm btn-secondary" data-contract-detail="' + c.id + '">상세</button>';
        var deleteBtn = ' <button type="button" class="btn btn-sm btn-danger btn-contract-delete" data-contract-id="' + c.id + '">삭제</button>';
        var shortAddr = (function() {
          var addr = c.siteAddress || '';
          if (!addr) return '-';
          var parts = addr.trim().split(/\s+/);
          return parts.slice(0, 2).join(' ');
        })();
        return '<tr class="contract-row" data-contract-id="' + c.id + '"><td style="text-align:center;color:#94a3b8;font-size:0.85rem;">' + (i + 1) + '</td><td>' + getShowroomName(c.showroomId) + editFieldBtn('showroomId') + '</td><td>' + houseType + editFieldBtn('contractModel') + '</td><td>' + modelName + editFieldBtn('contractModelName') + '</td><td>' + formatDate(c.contractDate) + editFieldBtn('contractDate') + '</td><td>' + (c.customerName || '-') + editFieldBtn('customerName') + '</td><td>' + shortAddr + '</td><td>' + salesPerson + editFieldBtn('salesPerson') + '</td><td>' + formatMoney(Math.round(Number(c.totalAmount) / _amountDivisor)) + '만원' + editFieldBtn('totalAmount') + '</td><td>' + deposit + '</td><td>' + p1 + '</td><td>' + p2 + '</td><td>' + p3 + '</td><td>' + balance + '</td><td>' + detailBtn + deleteBtn + '</td></tr>';
      }).join('') || (getContractSearchKeyword()
        ? '<tr><td colspan="15" class="no-result-msg">검색 결과가 없습니다.</td></tr>'
        : '<tr><td colspan="15">계약 데이터가 없습니다.</td></tr>');
      updateContractFilterResult(contracts, contracts);
      if (expandedContractId) {
        var exists = contracts.some(function (c) { return c.id === expandedContractId; });
        if (exists) {
          showContractDetailPanel(expandedContractId, true);
        } else {
          expandedContractId = null;
        }
      }
    }
    renderSalesCustomers();
  }

  function renderSalesCustomers() {
    var customers = getCustomers();
    if (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
      var cur = window.seumAuth.currentEmployee;
      var team = (cur.team || '').trim();
      var myShowroom = (cur.showroom || '').trim();
      // ????? ?????? ?? ?????? ?? ??????????? ???????
      if (team === '영업' && myShowroom) {
        customers = customers.filter(function (o) { return (o.showroomId || '') === myShowroom; });
      }
    }
    customers = filterByShowroom(customers, 'showroomId');
    customers = filterByYearMonth(customers, 'createdAt');
    var tbody = document.getElementById('tbody-customers');
    if (!tbody) return;
    tbody.innerHTML = customers.map(function (o) {
      return '<tr><td>' + formatDate(o.createdAt) + '</td><td>' + (o.name || '-') + '</td><td>' + (o.phone || '-') + '</td><td>' + formatDate(o.visitDate) + '</td><td>' + (o.salesPerson || '-') + '</td><td>' + getShowroomName(o.showroomId) + '</td><td>' + (o.memo || '-') + '</td><td><button type="button" class="btn btn-sm btn-secondary" data-edit-customer="' + o.id + '">수정</button> <button type="button" class="btn btn-sm btn-secondary" data-delete-customer="' + o.id + '">삭제</button></td></tr>';
    }).join('') || '<tr><td colspan="8">고객 데이터가 없습니다.</td></tr>';
  }

  // =====================================================================
  // 설계 업무일지 - 상수 & Storage Helpers
  // =====================================================================
  var DW_STAGES = ['상담설계', '1차도면', '2차도면', '3차도면', '최종도면', '설계완료', '시공이관'];

  var DW_STAGE_COLOR = {
    '상담설계': 'dw-stage-consult',
    '1차도면':  'dw-stage-d1',
    '2차도면':  'dw-stage-d2',
    '3차도면':  'dw-stage-d3',
    '최종도면': 'dw-stage-final',
    '설계완료': 'dw-stage-done',
    '시공이관': 'dw-stage-transfer'
  };

  function getDesignWorklog() {
    try { return JSON.parse(localStorage.getItem(STORAGE_DESIGN_WORKLOG) || '[]'); } catch (e) { return []; }
  }
  function saveDesignWorklog(list) {
    localStorage.setItem(STORAGE_DESIGN_WORKLOG, JSON.stringify(list));
  }

  // =====================================================================
  // 설계팀 우선순위 - 렌더
  // =====================================================================
  function renderDesignPriority() {
    var wrap = document.getElementById('design-priority-wrap');
    if (!wrap) return;

    var allContracts = getContracts().filter(function (c) { return c.depositReceivedAt; });
    var showroomLabels = { headquarters: '본사', showroom1: '1전시장', showroom3: '3전시장', showroom4: '4전시장' };
    var statusMap = { none: '미착수', '': '미착수', in_progress: '설계 중', done: '완료' };
    var statusCls = { none: 'status-none', '': 'status-none', in_progress: 'status-in_progress', done: 'status-done' };
    var TYPE_BADGE_CLS = { '컨테이너/농막': 'badge-container', '체류형쉼터': 'badge-shelter', '전원주택(인허가)': 'badge-house', '기타': 'badge-etc' };

    // 설계팀 여부 (작업완료 버튼 활성화 조건)
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var userTeam = (cur && (cur.team || '').trim()) || '';
    var canMarkDone = (userTeam === '설계') || isAdmin() || isMaster() || isSuperAdmin();

    function getTypeKey(c) {
      var t = (c.projectType || c.contractModel || '').trim();
      if (t === '컨테이너/농막') return '컨테이너/농막';
      if (t === '체류형쉼터') return '체류형쉼터';
      if (t === '전원주택') return '전원주택(인허가)';
      return '기타';
    }

    // 작업완료 여부로 분리
    var contracts = allContracts.filter(function (c) { return !c.priorityDone; });
    var doneContracts = allContracts.filter(function (c) { return c.priorityDone; });

    // 긴급진행건: isUrgent, 작업완료 아닌 것, 계약일 오래된 순
    var urgentList = contracts.filter(function (c) { return c.isUrgent; });
    urgentList.sort(function (a, b) {
      return (a.contractDate || '') < (b.contractDate || '') ? -1 : 1;
    });

    var TYPE_ORDER = ['전원주택(인허가)', '컨테이너/농막', '체류형쉼터', '기타'];
    var groups = {};
    TYPE_ORDER.forEach(function (t) { groups[t] = []; });
    contracts.forEach(function (c) { groups[getTypeKey(c)].push(c); });

    TYPE_ORDER.forEach(function (type) {
      groups[type].sort(function (a, b) {
        if (type === '전원주택(인허가)') {
          var hasA = a.permitCertDate ? 0 : 1;
          var hasB = b.permitCertDate ? 0 : 1;
          if (hasA !== hasB) return hasA - hasB;
          var dA = (a.permitCertDate || a.contractDate) || '';
          var dB = (b.permitCertDate || b.contractDate) || '';
          if (dA !== dB) return dA < dB ? -1 : 1;
        } else {
          var dA = a.contractDate || '';
          var dB = b.contractDate || '';
          if (dA !== dB) return dA < dB ? -1 : 1;
        }
        var sA = (a.designStatus || 'none').toLowerCase();
        var sB = (b.designStatus || 'none').toLowerCase();
        return ((sA === 'none' || sA === '') ? 0 : 1) - ((sB === 'none' || sB === '') ? 0 : 1);
      });
    });

    function doneBtn(cid) {
      if (!canMarkDone) return '';
      return '<button type="button" class="btn btn-sm priority-done-btn" data-contract-id="' + escapeAttr(cid) + '" style="white-space:nowrap;background:#059669;color:#fff;border:none;">작업완료</button>';
    }

    function renderUrgentSection(list) {
      var html = '<div class="design-priority-section design-priority-urgent-section">' +
        '<div class="design-priority-header">' +
        '<span class="design-priority-urgent-title">🚨 긴급진행건</span>' +
        '<span class="design-priority-count urgent-count">총 ' + list.length + '건</span>' +
        '</div>';
      if (list.length === 0) {
        html += '<p class="design-priority-empty">긴급진행건이 없습니다.</p>';
      } else {
        html += '<div style="overflow-x:auto"><table class="design-priority-table"><thead><tr>' +
          '<th>#</th><th>계약일</th><th>유형</th><th>고객명</th><th>모델명</th><th>전시장</th><th>지역</th><th>담당 영업사원</th><th>설계담당</th><th>설계진행 상태</th><th>비고</th><th></th>' +
          '</tr></thead><tbody>';
        list.forEach(function (c, i) {
          var shortAddr = (c.siteAddress || '').trim().split(/\s+/).slice(0, 2).join(' ') || '-';
          var st = (c.designStatus || 'none').toLowerCase();
          var typeLabel = getTypeKey(c);
          html += '<tr class="design-priority-row" data-contract-id="' + escapeAttr(c.id) + '" style="cursor:pointer;">' +
            '<td class="design-priority-rank">' + (i + 1) + '</td>' +
            '<td class="design-priority-date">' + escapeHtml(c.contractDate || '-') + '</td>' +
            '<td><span class="design-type-badge ' + (TYPE_BADGE_CLS[typeLabel] || 'badge-etc') + '">' + escapeHtml(typeLabel) + '</span></td>' +
            '<td>' + escapeHtml(c.customerName || '-') + '</td>' +
            '<td>' + escapeHtml(c.contractModelName || c.contractModel || '-') + '</td>' +
            '<td>' + escapeHtml(showroomLabels[c.showroomId] || c.showroomId || '-') + '</td>' +
            '<td>' + escapeHtml(shortAddr) + '</td>' +
            '<td>' + escapeHtml(c.salesPerson || '-') + '</td>' +
            '<td>' + escapeHtml((c.designPermitDesigner || c.designContactName || '').trim() || '-') + '</td>' +
            '<td><span class="design-priority-status ' + (statusCls[st] || 'status-none') + '">' + escapeHtml(statusMap[st] || st) + '</span></td>' +
            '<td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(c.designStatusMemoDesign || '') + '</td>' +
            '<td style="white-space:nowrap;display:flex;gap:4px;">' + doneBtn(c.id) + '<button type="button" class="btn btn-sm btn-secondary priority-goto-btn" data-contract-id="' + escapeAttr(c.id) + '" style="white-space:nowrap;">계약 상세</button></td>' +
            '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';
      return html;
    }

    function renderSection(type, list) {
      var isPermit = type === '전원주택(인허가)';
      var dateHeader = isPermit ? '허가완료일' : '계약일';
      var html = '<div class="design-priority-section">' +
        '<div class="design-priority-header">' +
        '<span>' + escapeHtml(type) + '</span>' +
        '<span class="design-priority-count">총 ' + list.length + '건</span>' +
        '</div>';
      if (list.length === 0) {
        html += '<p class="design-priority-empty">해당 계약이 없습니다.</p>';
      } else {
        html += '<div style="overflow-x:auto"><table class="design-priority-table"><thead><tr>' +
          '<th>#</th><th>' + dateHeader + '</th><th>고객명</th><th>모델명</th><th>전시장</th><th>지역</th><th>담당 영업사원</th><th>설계담당</th><th>설계진행 상태</th><th>비고</th><th></th>' +
          '</tr></thead><tbody>';
        list.forEach(function (c, i) {
          var shortAddr = (c.siteAddress || '').trim().split(/\s+/).slice(0, 2).join(' ') || '-';
          var dateVal = isPermit ? (c.permitCertDate || '-') : (c.contractDate || '-');
          var st = (c.designStatus || 'none').toLowerCase();
          html += '<tr class="design-priority-row" data-contract-id="' + escapeAttr(c.id) + '" style="cursor:pointer;">' +
            '<td class="design-priority-rank">' + (i + 1) + '</td>' +
            '<td class="design-priority-date">' + escapeHtml(dateVal) + '</td>' +
            '<td>' + escapeHtml(c.customerName || '-') + '</td>' +
            '<td>' + escapeHtml(c.contractModelName || c.contractModel || '-') + '</td>' +
            '<td>' + escapeHtml(showroomLabels[c.showroomId] || c.showroomId || '-') + '</td>' +
            '<td>' + escapeHtml(shortAddr) + '</td>' +
            '<td>' + escapeHtml(c.salesPerson || '-') + '</td>' +
            '<td>' + escapeHtml((c.designPermitDesigner || c.designContactName || '').trim() || '-') + '</td>' +
            '<td><span class="design-priority-status ' + (statusCls[st] || 'status-none') + '">' + escapeHtml(statusMap[st] || st) + '</span></td>' +
            '<td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(c.designStatusMemoDesign || '') + '</td>' +
            '<td style="white-space:nowrap;display:flex;gap:4px;">' + doneBtn(c.id) + '<button type="button" class="btn btn-sm btn-secondary priority-goto-btn" data-contract-id="' + escapeAttr(c.id) + '" style="white-space:nowrap;">계약 상세</button></td>' +
            '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';
      return html;
    }

    function renderDoneSection(list) {
      // 작업완료 섹션: 기본 접힘, 토글 버튼
      var visible = wrap.dataset.doneOpen === '1';
      var html = '<div class="design-priority-section design-priority-done-section">' +
        '<div class="design-priority-header" style="cursor:pointer;" id="priority-done-toggle">' +
        '<span class="design-priority-done-title">✅ 작업 완료</span>' +
        '<span class="design-priority-count done-count">총 ' + list.length + '건</span>' +
        '<span style="margin-left:auto;color:#6b7280;font-size:0.8rem;">' + (visible ? '▲ 접기' : '▼ 펼치기') + '</span>' +
        '</div>';
      if (visible) {
        if (list.length === 0) {
          html += '<p class="design-priority-empty">작업 완료된 계약이 없습니다.</p>';
        } else {
          list = list.slice().sort(function (a, b) { return (a.contractDate || '') < (b.contractDate || '') ? -1 : 1; });
          html += '<div style="overflow-x:auto"><table class="design-priority-table"><thead><tr>' +
            '<th>#</th><th>계약일</th><th>유형</th><th>고객명</th><th>모델명</th><th>전시장</th><th>지역</th><th>담당 영업사원</th><th>설계담당</th><th>설계진행 상태</th><th></th>' +
            '</tr></thead><tbody>';
          list.forEach(function (c, i) {
            var shortAddr = (c.siteAddress || '').trim().split(/\s+/).slice(0, 2).join(' ') || '-';
            var st = (c.designStatus || 'none').toLowerCase();
            var typeLabel = getTypeKey(c);
            html += '<tr class="design-priority-row design-priority-done-row" data-contract-id="' + escapeAttr(c.id) + '" style="cursor:pointer;opacity:0.7;">' +
              '<td class="design-priority-rank">' + (i + 1) + '</td>' +
              '<td class="design-priority-date">' + escapeHtml(c.contractDate || '-') + '</td>' +
              '<td><span class="design-type-badge ' + (TYPE_BADGE_CLS[typeLabel] || 'badge-etc') + '">' + escapeHtml(typeLabel) + '</span></td>' +
              '<td>' + escapeHtml(c.customerName || '-') + '</td>' +
              '<td>' + escapeHtml(c.contractModelName || c.contractModel || '-') + '</td>' +
              '<td>' + escapeHtml(showroomLabels[c.showroomId] || c.showroomId || '-') + '</td>' +
              '<td>' + escapeHtml(shortAddr) + '</td>' +
              '<td>' + escapeHtml(c.salesPerson || '-') + '</td>' +
              '<td>' + escapeHtml((c.designPermitDesigner || c.designContactName || '').trim() || '-') + '</td>' +
              '<td><span class="design-priority-status ' + (statusCls[st] || 'status-none') + '">' + escapeHtml(statusMap[st] || st) + '</span></td>' +
              '<td style="white-space:nowrap;display:flex;gap:4px;">' +
              (canMarkDone ? '<button type="button" class="btn btn-sm priority-undone-btn" data-contract-id="' + escapeAttr(c.id) + '" style="white-space:nowrap;background:#374151;color:#d1d5db;border:none;">복원</button>' : '') +
              '<button type="button" class="btn btn-sm btn-secondary priority-goto-btn" data-contract-id="' + escapeAttr(c.id) + '" style="white-space:nowrap;">계약 상세</button></td>' +
              '</tr>';
          });
          html += '</tbody></table></div>';
        }
      }
      html += '</div>';
      return html;
    }

    var html = renderUrgentSection(urgentList) +
      TYPE_ORDER.map(function (type) { return renderSection(type, groups[type]); }).join('') +
      renderDoneSection(doneContracts);
    wrap.innerHTML = html;

    // 작업완료 섹션 토글
    var doneToggle = wrap.querySelector('#priority-done-toggle');
    if (doneToggle) {
      doneToggle.addEventListener('click', function () {
        wrap.dataset.doneOpen = wrap.dataset.doneOpen === '1' ? '0' : '1';
        renderDesignPriority();
      });
    }

    // 작업완료 버튼
    wrap.querySelectorAll('.priority-done-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var cid = btn.getAttribute('data-contract-id');
        var cs = getContracts();
        var c = cs.find(function (x) { return x.id === cid; });
        if (c) { c.priorityDone = true; saveContracts(cs); renderDesignPriority(); }
      });
    });

    // 복원 버튼
    wrap.querySelectorAll('.priority-undone-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var cid = btn.getAttribute('data-contract-id');
        var cs = getContracts();
        var c = cs.find(function (x) { return x.id === cid; });
        if (c) { c.priorityDone = false; saveContracts(cs); renderDesignPriority(); }
      });
    });

    wrap.querySelectorAll('.priority-goto-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        goToDesignDetail(btn.getAttribute('data-contract-id'));
      });
    });
    wrap.querySelectorAll('.design-priority-row').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('.priority-goto-btn') || e.target.closest('.priority-done-btn') || e.target.closest('.priority-undone-btn')) return;
        goToDesignDetail(tr.getAttribute('data-contract-id'));
      });
    });
  }

  function goToDesignDetail(contractId) {
    if (!contractId) return;
    // 필터 초기화 (연/월·검색어가 걸려 있으면 row가 보이지 않음)
    var yearEl = document.getElementById('filter-year');
    var monthEl = document.getElementById('filter-month');
    var searchEl = document.getElementById('design-search-input');
    if (yearEl) yearEl.value = '';
    if (monthEl) monthEl.value = '';
    if (searchEl) searchEl.value = '';
    showSection('design');
    renderDesign();
    var tbody = document.getElementById('tbody-design');
    if (!tbody) return;
    var row = tbody.querySelector('.design-row[data-contract-id="' + contractId + '"]');
    if (!row) {
      // depositReceivedAt 없는 계약이면 설계 목록에 표시되지 않음
      window.alert('해당 계약은 설계팀 목록에 표시되지 않습니다.\n(계약금 수령 전이거나 전시장 필터 조건에 맞지 않습니다.)');
      return;
    }
    showDesignDetailPanel(contractId, true);
    setTimeout(function () {
      var detail = tbody.querySelector('.design-detail-row[data-detail-for="' + contractId + '"]');
      var target = detail || row;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      row.classList.add('design-row-highlight');
      setTimeout(function () { row.classList.remove('design-row-highlight'); }, 2000);
    }, 80);
  }

  // =====================================================================
  // 설계 업무일지 - 렌더
  // =====================================================================
  function renderDesignWorklog() {
    var logs = getDesignWorklog();
    var keyword = ((document.getElementById('dw-search') || {}).value || '').toLowerCase();
    var stageFilter = (document.getElementById('dw-stage-filter') || {}).value || '';
    if (keyword) {
      logs = logs.filter(function (l) {
        return (l.address || '').toLowerCase().indexOf(keyword) !== -1 ||
               (l.customerName || '').toLowerCase().indexOf(keyword) !== -1;
      });
    }
    if (stageFilter) {
      logs = logs.filter(function (l) { return l.stage === stageFilter; });
    }
    // 날짜 내림차순 정렬
    logs = logs.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

    var tbody = document.getElementById('tbody-dw');
    if (!tbody) return;
    tbody.innerHTML = logs.map(function (l) {
      var stageClass = DW_STAGE_COLOR[l.stage] || '';
      var stageHtml = '<span class="dw-stage-badge ' + stageClass + '">' + escapeHtml(l.stage || '-') + '</span>';
      var drawingHtml = l.drawingUrl
        ? '<a href="' + escapeAttr(l.drawingUrl) + '" target="_blank" class="dw-file-link" title="' + escapeAttr(l.drawingUrl) + '">' +
            (l.drawingUrl.length > 16 ? l.drawingUrl.slice(0, 15) + '…' : l.drawingUrl) + '</a>'
        : '-';
      var transferBtn = l.stage !== '시공이관'
        ? '<button type="button" class="btn btn-sm dw-transfer-btn" data-id="' + escapeAttr(l.id) + '" title="시공팀으로 이관">시공이관</button> '
        : '<span class="dw-transferred-badge">이관완료</span> ';
      return '<tr>' +
        '<td>' + (l.date || '-') + '</td>' +
        '<td>' + escapeHtml(l.customerName || '-') + '</td>' +
        '<td>' + escapeHtml(l.address || '-') + '</td>' +
        '<td>' + escapeHtml(l.size || '-') + '</td>' +
        '<td>' + escapeHtml(l.task || '-') + '</td>' +
        '<td>' + stageHtml + '</td>' +
        '<td>' + escapeHtml(l.manager || '-') + '</td>' +
        '<td>' + drawingHtml + '</td>' +
        '<td>' + escapeHtml(l.memo || '-') + '</td>' +
        '<td class="dw-action-cell">' + transferBtn +
          '<button type="button" class="btn btn-sm btn-secondary btn-edit-dw" data-id="' + escapeAttr(l.id) + '">수정</button> ' +
          '<button type="button" class="btn btn-sm btn-danger btn-delete-dw" data-id="' + escapeAttr(l.id) + '">삭제</button>' +
        '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="10" class="no-result-msg">업무일지 데이터가 없습니다. 업무를 등록하거나 엑셀을 업로드하세요.</td></tr>';

    // 필터 결과 카운트
    var resultEl = document.getElementById('dw-filter-result');
    if (resultEl) resultEl.textContent = '총 ' + logs.length + '건';

    // 검색 초기화 버튼
    var clearBtn = document.getElementById('dw-search-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !keyword);

    // 미초기화 시 이벤트 등록
    if (!designWorklogInitialized) {
      designWorklogInitialized = true;
      initDesignWorklogEvents();
    }
  }

  // =====================================================================
  // 설계 일정 - 렌더
  // =====================================================================
  function renderDesignSchedule() {
    var logs = getDesignWorklog();
    var stageFilter = (document.getElementById('schedule-stage-filter') || {}).value || '';
    var managerFilter = (document.getElementById('schedule-manager-filter') || {}).value || '';

    // 담당자 select 채우기
    var managerSel = document.getElementById('schedule-manager-filter');
    if (managerSel) {
      var managers = [];
      logs.forEach(function (l) { if (l.manager && managers.indexOf(l.manager) === -1) managers.push(l.manager); });
      var prevVal = managerSel.value;
      managerSel.innerHTML = '<option value="">전체 담당자</option>' + managers.map(function (m) {
        return '<option value="' + escapeAttr(m) + '"' + (prevVal === m ? ' selected' : '') + '>' + escapeHtml(m) + '</option>';
      }).join('');
      if (prevVal) managerSel.value = prevVal;
    }

    if (stageFilter) logs = logs.filter(function (l) { return l.stage === stageFilter; });
    if (managerFilter) logs = logs.filter(function (l) { return l.manager === managerFilter; });

    // 날짜 오름차순
    logs = logs.slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });

    // 월별 그룹화
    var monthGroups = {};
    logs.forEach(function (l) {
      var month = (l.date || '').slice(0, 7) || '날짜 없음';
      if (!monthGroups[month]) monthGroups[month] = [];
      monthGroups[month].push(l);
    });

    var container = document.getElementById('design-schedule-list');
    if (!container) return;
    var months = Object.keys(monthGroups).sort();
    if (!months.length) {
      container.innerHTML = '<p class="no-result-msg">등록된 일정이 없습니다.</p>';
      return;
    }
    container.innerHTML = months.map(function (month) {
      var items = monthGroups[month];
      var rows = items.map(function (l) {
        var stageClass = DW_STAGE_COLOR[l.stage] || '';
        return '<tr>' +
          '<td>' + (l.date || '-') + '</td>' +
          '<td>' + escapeHtml(l.customerName || '-') + '</td>' +
          '<td>' + escapeHtml(l.address || '-') + '</td>' +
          '<td>' + escapeHtml(l.task || '-') + '</td>' +
          '<td><span class="dw-stage-badge ' + stageClass + '">' + escapeHtml(l.stage || '-') + '</span></td>' +
          '<td>' + escapeHtml(l.manager || '-') + '</td>' +
          '</tr>';
      }).join('');
      var ym = month.split('-');
      var label = ym.length === 2 ? ym[0] + '년 ' + parseInt(ym[1], 10) + '월' : month;
      return '<div class="dw-month-group">' +
        '<div class="dw-month-header"><span class="dw-month-label">' + label + '</span><span class="dw-month-count">' + items.length + '건</span></div>' +
        '<div class="table-wrap"><table class="data-table">' +
          '<thead><tr><th>날짜</th><th>고객명</th><th>주소</th><th>작업</th><th>설계단계</th><th>담당자</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div></div>';
    }).join('');

    // 필터 이벤트 (한 번만)
    var sf = document.getElementById('schedule-stage-filter');
    var mf = document.getElementById('schedule-manager-filter');
    if (sf && !sf._dwBound) { sf._dwBound = true; sf.addEventListener('change', renderDesignSchedule); }
    if (mf && !mf._dwBound) { mf._dwBound = true; mf.addEventListener('change', renderDesignSchedule); }
  }

  // =====================================================================
  // 설계 업무일지 - 이벤트 초기화
  // =====================================================================
  var designWorklogInitialized = false;

  function initDesignWorklogEvents() {
    // 업무 등록 버튼
    var btnAdd = document.getElementById('btn-add-dw');
    if (btnAdd) btnAdd.addEventListener('click', function () {
      document.getElementById('dw-edit-id').value = '';
      document.getElementById('form-dw').reset();
      document.getElementById('dw-form-title').textContent = '업무 등록';
      document.getElementById('dw-form-wrap').classList.remove('hidden');
    });

    // 취소 버튼
    var btnCancel = document.getElementById('btn-cancel-dw');
    if (btnCancel) btnCancel.addEventListener('click', function () {
      document.getElementById('dw-form-wrap').classList.add('hidden');
    });

    // 도면파일 첨부 → 파일명을 URL 필드에 표시
    var dwFileInput = document.getElementById('dw-drawing-file');
    if (dwFileInput) dwFileInput.addEventListener('change', function () {
      if (dwFileInput.files && dwFileInput.files[0]) {
        document.getElementById('dw-drawing-url').value = dwFileInput.files[0].name;
      }
    });

    // 업무 등록/수정 폼 저장
    var formDw = document.getElementById('form-dw');
    if (formDw) formDw.addEventListener('submit', function (e) {
      e.preventDefault();
      var editId = document.getElementById('dw-edit-id').value;
      var entry = {
        customerName: document.getElementById('dw-customer').value.trim(),
        address: document.getElementById('dw-address').value.trim(),
        size: document.getElementById('dw-size').value.trim(),
        task: document.getElementById('dw-task').value.trim(),
        date: document.getElementById('dw-date').value,
        manager: document.getElementById('dw-manager').value.trim(),
        stage: document.getElementById('dw-stage').value,
        memo: document.getElementById('dw-memo').value.trim(),
        drawingUrl: document.getElementById('dw-drawing-url').value.trim(),
        updatedAt: new Date().toISOString()
      };
      if (!entry.customerName || !entry.address || !entry.date || !entry.stage) return;
      var logs = getDesignWorklog();
      if (editId) {
        logs = logs.map(function (l) { return l.id === editId ? Object.assign({}, l, entry) : l; });
      } else {
        entry.id = id();
        entry.createdAt = new Date().toISOString();
        logs.push(entry);
      }
      saveDesignWorklog(logs);
      document.getElementById('dw-form-wrap').classList.add('hidden');
      renderDesignWorklog();
      showToast(editId ? '수정됐습니다.' : '업무일지가 등록됐습니다.');
    });

    // 검색 & 필터
    var dwSearch = document.getElementById('dw-search');
    if (dwSearch) dwSearch.addEventListener('input', renderDesignWorklog);
    var dwSearchClear = document.getElementById('dw-search-clear');
    if (dwSearchClear) dwSearchClear.addEventListener('click', function () {
      document.getElementById('dw-search').value = '';
      renderDesignWorklog();
    });
    var dwStageFilter = document.getElementById('dw-stage-filter');
    if (dwStageFilter) dwStageFilter.addEventListener('change', renderDesignWorklog);

    // 테이블 이벤트 위임 (수정/삭제/시공이관)
    var tbodyDw = document.getElementById('tbody-dw');
    if (tbodyDw) tbodyDw.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.btn-edit-dw');
      var delBtn = e.target.closest('.btn-delete-dw');
      var transferBtn = e.target.closest('.dw-transfer-btn');

      if (editBtn) {
        var lid = editBtn.getAttribute('data-id');
        var log = getDesignWorklog().find(function (l) { return l.id === lid; });
        if (!log) return;
        document.getElementById('dw-edit-id').value = log.id;
        document.getElementById('dw-customer').value = log.customerName || '';
        document.getElementById('dw-address').value = log.address || '';
        document.getElementById('dw-size').value = log.size || '';
        document.getElementById('dw-task').value = log.task || '';
        document.getElementById('dw-date').value = log.date || '';
        document.getElementById('dw-manager').value = log.manager || '';
        document.getElementById('dw-stage').value = log.stage || '';
        document.getElementById('dw-memo').value = log.memo || '';
        document.getElementById('dw-drawing-url').value = log.drawingUrl || '';
        document.getElementById('dw-form-title').textContent = '업무 수정';
        document.getElementById('dw-form-wrap').classList.remove('hidden');
        document.getElementById('dw-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (delBtn) {
        if (!confirm('업무일지를 삭제하시겠습니까?')) return;
        var did = delBtn.getAttribute('data-id');
        saveDesignWorklog(getDesignWorklog().filter(function (l) { return l.id !== did; }));
        renderDesignWorklog();
        showToast('삭제됐습니다.');
      }

      if (transferBtn) {
        var tid = transferBtn.getAttribute('data-id');
        var logs = getDesignWorklog().map(function (l) {
          return l.id === tid ? Object.assign({}, l, { stage: '시공이관', updatedAt: new Date().toISOString() }) : l;
        });
        saveDesignWorklog(logs);
        renderDesignWorklog();
        showToast('시공팀으로 이관됐습니다.');
      }
    });

    // 엑셀 업로드
    var excelInput = document.getElementById('dw-excel-input');
    if (excelInput) excelInput.addEventListener('change', function () {
      var file = excelInput.files && excelInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var XLSX = window.XLSX;
          if (!XLSX) { showToast('엑셀 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도하세요.', 'error'); return; }
          var wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          var COL_MAP = {
            '주소': 'address', '고객명': 'customerName', '크기': 'size',
            '작업': 'task', '날짜': 'date', '비고': 'memo',
            '담당자': 'manager', '설계단계': 'stage', '도면파일': 'drawingUrl'
          };
          var imported = rows.filter(function (r) { return r['고객명'] || r['주소']; }).map(function (r) {
            var entry = { id: id(), createdAt: new Date().toISOString() };
            Object.keys(COL_MAP).forEach(function (col) {
              var val = r[col];
              if (col === '날짜' && val instanceof Date) {
                val = val.toISOString().slice(0, 10);
              } else if (col === '날짜' && typeof val === 'number') {
                // Excel serial date
                var d = new Date((val - 25569) * 86400 * 1000);
                val = d.toISOString().slice(0, 10);
              }
              entry[COL_MAP[col]] = String(val || '').trim();
            });
            // 설계단계 유효성 검사
            if (DW_STAGES.indexOf(entry.stage) === -1) entry.stage = '상담설계';
            return entry;
          });
          if (!imported.length) { showToast('가져올 데이터가 없습니다. 열 이름을 확인하세요.', 'error'); return; }
          var logs = getDesignWorklog().concat(imported);
          saveDesignWorklog(logs);
          renderDesignWorklog();
          showToast(imported.length + '건을 업로드했습니다.');
        } catch (err) {
          showToast('엑셀 파싱 오류: ' + err.message, 'error');
        }
        excelInput.value = '';
      };
      reader.readAsBinaryString(file);
    });
  }

  function renderDesign() {
    var contracts = getContracts().filter(function (c) { return c.depositReceivedAt; });
    // master/admin이 아닌 모든 사용자는 본인 전시장만 (단, 본사 소속은 전체 전시장 노출)
    if (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
      var cur = window.seumAuth.currentEmployee;
      var _isAdminDesign = isAdmin() || isMaster() || isSuperAdmin();
      var myShowroomDesign = resolveShowroomId(cur);
      var _isHeadquartersDesign = (myShowroomDesign === 'headquarters');
      if (myShowroomDesign && !_isAdminDesign && !_isHeadquartersDesign) {
        contracts = contracts.filter(function (c) { return (c.showroomId || '') === myShowroomDesign; });
      }
    }
    contracts = filterByShowroom(contracts, 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    contracts = getFilteredDesignContracts(contracts);

    // ── 유형 분류 헬퍼 ──
    function getContractTypeKey(c) {
      var t = (c.projectType || c.contractModel || '').trim();
      if (t === '컨테이너/농막') return '컨테이너/농막';
      if (t === '체류형쉼터') return '체류형쉼터';
      if (t === '전원주택') return '전원주택(인허가)';
      return '기타';
    }
    var TYPE_ORDER = { '컨테이너/농막': 0, '체류형쉼터': 1, '전원주택(인허가)': 2, '기타': 3 };
    var TYPE_BADGE_CLS = { '컨테이너/농막': 'badge-container', '체류형쉼터': 'badge-shelter', '전원주택(인허가)': 'badge-house', '기타': 'badge-etc' };

    // ── 탭 + 건수 렌더 ──
    var tabsEl = document.getElementById('design-type-tabs');
    if (tabsEl) {
      var allTypes = ['컨테이너/농막', '체류형쉼터', '전원주택(인허가)', '기타'];
      var typeCounts = { '컨테이너/농막': 0, '체류형쉼터': 0, '전원주택(인허가)': 0, '기타': 0 };
      contracts.forEach(function (c) { typeCounts[getContractTypeKey(c)]++; });
      var total = contracts.length;
      var tabHtml = '<button type="button" class="design-type-tab' + (designTypeFilter === 'all' ? ' active' : '') + '" data-type="all">전체 <span class="tab-count">' + total + '</span></button>';
      allTypes.forEach(function (t) {
        tabHtml += '<button type="button" class="design-type-tab' + (designTypeFilter === t ? ' active' : '') + '" data-type="' + escapeAttr(t) + '">' + escapeHtml(t) + ' <span class="tab-count">' + typeCounts[t] + '</span></button>';
      });
      tabsEl.innerHTML = tabHtml;
      tabsEl.querySelectorAll('.design-type-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          designTypeFilter = btn.getAttribute('data-type') || 'all';
          renderDesign();
        });
      });
    }

    // ── 유형 필터 적용 ──
    if (designTypeFilter !== 'all') {
      contracts = contracts.filter(function (c) { return getContractTypeKey(c) === designTypeFilter; });
    }

    // ── 정렬: 유형 순 → 계약일 오름차순 ──
    contracts.sort(function (a, b) {
      var tA = TYPE_ORDER[getContractTypeKey(a)];
      var tB = TYPE_ORDER[getContractTypeKey(b)];
      if (tA !== tB) return tA - tB;
      var dA = a.contractDate || '';
      var dB = b.contractDate || '';
      return dA < dB ? -1 : dA > dB ? 1 : 0;
    });

    var tbody = document.getElementById('tbody-design');
    if (!tbody) return;
    var salesReadonly = isSalesReadonly();
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var userTeam = (cur && (cur.team || '').trim()) || '';
    var myName = (cur && (cur.name || '').trim()) || '';
    var designOnlyReview = (userTeam === '설계');
    var constructionOnlyReview = (userTeam === '시공');
    var salesOnlyReview = (userTeam === '영업' || userTeam === '영업팀');
    var salesCheckDisabled = designOnlyReview || constructionOnlyReview;
    var designCheckDisabled = salesReadonly || constructionOnlyReview || salesOnlyReview;
    var constructionCheckDisabled = salesReadonly || designOnlyReview || salesOnlyReview;
    var statusMap = {
      none: '미착수',
      in_progress: '설계 중',
      negotiating: '협의 중',
      negotiated: '협의 완료',
      done: '설계 완료'
    };
    tbody.innerHTML = contracts.map(function (c, i) {
      var status = c.designStatus || 'none';
      var statusLabel = statusMap[status] || '미착수';
      var select = '<select class="design-status-select design-progress-select" data-id="' + c.id + '"' + (salesReadonly ? ' disabled' : '') + '>' +
        '<option value="none"' + (status === 'none' ? ' selected' : '') + '>미착수</option>' +
        '<option value="in_progress"' + (status === 'in_progress' ? ' selected' : '') + '>설계 중</option>' +
        '<option value="negotiating"' + (status === 'negotiating' ? ' selected' : '') + '>협의 중</option>' +
        '<option value="negotiated"' + (status === 'negotiated' ? ' selected' : '') + '>협의 완료</option>' +
        '<option value="done"' + (status === 'done' ? ' selected' : '') + '>설계 완료</option>' +
        '</select>';
      var designProgressCell = '<div class="design-process-cell"><span class="design-process-label">설계 진행</span>' + select + '</div>';
      var projectType = c.projectType || '-';
      var constructionOk = c.constructionStartOk ? 'Y' : '-';
      var salesC = !!c.salesConfirmed;
      var designC = !!c.designConfirmed;
      var constructionC = !!c.constructionConfirmed;
      var allConfirmed = salesC && designC && constructionC;
      var salesCheckDisabledForRow = salesCheckDisabled || (salesOnlyReview && (c.salesPerson || '').trim() !== myName);
      var reviewCell = '<div class="review-checklist"><span class="review-checklist-title">검토 확인</span>' +
        '<label class="review-check-item"><input type="checkbox" class="review-check sales-check" data-contract-id="' + escapeAttr(c.id) + '"' + (salesC ? ' checked' : '') + (salesCheckDisabledForRow ? ' disabled' : '') + '><span>영업팀 확인</span><small class="review-desc review-help">계약 내용 및 고객 요구 사항 확인</small></label>' +
        '<label class="review-check-item"><input type="checkbox" class="review-check design-check" data-contract-id="' + escapeAttr(c.id) + '"' + (designC ? ' checked' : '') + (designCheckDisabled ? ' disabled' : '') + '><span>설계팀 확인</span><small class="review-desc review-help">설계 가능 여부 및 특이사항 검토</small></label>' +
        '<label class="review-check-item"><input type="checkbox" class="review-check construction-check" data-contract-id="' + escapeAttr(c.id) + '"' + (constructionC ? ' checked' : '') + (constructionCheckDisabled ? ' disabled' : '') + '><span>시공팀 확인</span><small class="review-desc review-help">현장 시공 가능 여부 및 일정 확인</small></label>' +
        '</div>';
      var reviewTdClass = 'review-check-cell' + (allConfirmed ? ' review-all-done' : '');
      var approved = !!c.finalApproved;
      var canApprove = allConfirmed && !salesReadonly;
      var approvalBtnDisabled = !canApprove;
      var approvalBtnText = approved ? '승인 취소' : '최종 승인';
      var approvalCell = '<div class="final-approval-cell"><span class="approval-badge ' + (approved ? 'approved' : 'pending') + '">' + (approved ? '최종 승인됨' : '미승인') + '</span><button type="button" class="btn btn-sm approve-btn" data-contract-id="' + escapeAttr(c.id) + '"' + (approvalBtnDisabled ? ' disabled' : '') + '>' + escapeAttr(approvalBtnText) + '</button></div>';
      var rowClass = 'design-row' + (allConfirmed ? ' review-complete' : '');
      var designerName = c.designPermitDesigner || c.designContactName || '-';
      var houseType = (c.contractModel || '-');
      var modelName = (c.contractModelName || '-');
      var contractDateStr = formatDate(c.contractDate) || '-';
      var shortAddr = (function() { var a = c.siteAddress || ''; if (!a) return '-'; var p = a.trim().split(/\s+/); return p.slice(0, 2).join(' '); })();
      var designerCell = designOnlyReview
        ? '<input type="text" class="design-designer-input" data-contract-id="' + escapeAttr(c.id) + '" value="' + escapeAttr(c.designPermitDesigner || c.designContactName || '') + '" placeholder="설계담당">'
        : designerName;
      var constructionMgrCell = constructionOnlyReview
        ? '<input type="text" class="design-construction-manager-input" data-contract-id="' + escapeAttr(c.id) + '" value="' + escapeAttr(c.constructionManager || '') + '" placeholder="시공담당">'
        : (c.constructionManager || '-');
      var _dDivisor = c.amountUnit === 'manwon' ? 1 : 10000;
      var typeKey = getContractTypeKey(c);
      var typeBadge = '<span class="design-type-badge ' + TYPE_BADGE_CLS[typeKey] + '">' + escapeHtml(typeKey) + '</span>';
      var isUrgent = !!c.isUrgent;
      var urgentCheckDisabled = salesOnlyReview || constructionOnlyReview;
      var urgentCell = '<label class="urgent-check-label" title="긴급진행건으로 설정"><input type="checkbox" class="urgent-check" data-contract-id="' + escapeAttr(c.id) + '"' + (isUrgent ? ' checked' : '') + (urgentCheckDisabled ? ' disabled' : '') + '></label>';
      if (isUrgent) rowClass += ' design-row-urgent';
      return '<tr class="' + rowClass + '" data-contract-id="' + c.id + '"><td style="text-align:center;color:#94a3b8;font-size:0.85rem;">' + (i + 1) + '</td><td class="urgent-check-cell">' + urgentCell + '</td><td>' + typeBadge + '</td><td>' + getShowroomName(c.showroomId) + '</td><td>' + houseType + '</td><td>' + modelName + '</td><td>' + contractDateStr + '</td><td>' + (c.customerName || '-') + '</td><td>' + shortAddr + '</td><td>' + (c.salesPerson || '-') + '</td><td class="design-manager-cell">' + designerCell + '</td><td class="design-construction-manager-cell">' + constructionMgrCell + '</td><td>' + formatMoney(Math.round(Number(c.totalAmount) / _dDivisor)) + '만원</td><td>' + formatDate(c.depositReceivedAt) + '</td><td>' + statusLabel + '</td><td>' + constructionOk + '</td><td class="design-progress-cell">' + designProgressCell + '</td><td class="' + reviewTdClass + '">' + reviewCell + '</td><td class="final-approval-cell-wrap">' + approvalCell + '</td></tr>';
    }).join('') || (getDesignSearchKeyword()
      ? '<tr><td colspan="19" class="no-result-msg">검색 결과가 없습니다.</td></tr>'
      : '<tr><td colspan="19">설계 데이터가 없습니다.</td></tr>');
    updateDesignFilterResult(contracts);
    if (expandedDesignId) {
      var expandedDesignRow = tbody.querySelector('.design-row[data-contract-id="' + expandedDesignId + '"]');
      if (expandedDesignRow) {
        insertDesignDetailRowAfter(expandedDesignRow, expandedDesignId);
        expandedDesignRow.classList.add('design-row-expanded');
      } else {
        expandedDesignId = null;
      }
    }
  }

  var expandedDesignId = null;
  var designTypeFilter = 'all'; // 설계팀 유형 탭 필터

  function formatOptionsSummary(options) {
    if (!options) return '';
    var parts = [];
    var labels = { porch: '포치', deck: '데크', sunroom: '썬룸', demolition: '철거', repair: '집수리', interior: '인테리어' };
    ['porch', 'deck', 'sunroom', 'demolition', 'repair', 'interior'].forEach(function (key) {
      var o = options[key] || {};
      if (o.enabled) {
        var label = labels[key] || key;
        if (key === 'demolition' || key === 'repair' || key === 'interior') {
          parts.push(label);
        } else {
          var p = (o.pyeong != null && o.pyeong !== '') ? String(o.pyeong) + '평' : '';
          parts.push(label + (p ? ' ' + p : ''));
        }
      }
    });
    return parts.join(', ');
  }

  function buildInteriorNoteFromMemos(c) {
    function line(label, value) {
      if (!value) return '';
      return label + ': ' + String(value).trim();
    }
    var lines = [];
    var l;
    l = line('침실/방', c.memoBedroom); if (l) lines.push(l);
    l = line('거실', c.memoLiving); if (l) lines.push(l);
    l = line('주방', c.memoKitchen); if (l) lines.push(l);
    l = line('욕실/화장실', c.memoBath); if (l) lines.push(l);
    l = line('외부/데크/포치', c.memoExterior); if (l) lines.push(l);
    l = line('기타 요청사항', c.memoEtc); if (l) lines.push(l);
    return lines.join('\\n');
  }

  /** ????? ?? ?? ??? ??????? ??? ??? ?? HTML (??? ??? ?? ?? ???) */
  function buildDesignRequestViewHtml(c) {
    var esc = function (v) { return escapeAttr(v || ''); };
    var roomLabel = function (mode, memo) {
      var isChange = (mode || 'basic') === 'change' || (!mode && memo && String(memo).trim());
      if (!isChange) return '<span class="design-request-view-badge design-request-view-basic">기본</span>';
      return '<span class="design-request-view-badge design-request-view-change">변경</span> ' + (memo ? esc(memo) : '-');
    };
    var extLabel = function (type, memo) {
      if ((type || 'none') === 'none') return '<span class="design-request-view-badge design-request-view-none">없음</span>';
      return '<span class="design-request-view-badge design-request-view-add">추가</span> ' + (memo ? esc(memo) : '');
    };
    var matLabel = { default: '기본', ceramic: '세라믹사이딩', longbrick: '롱브릭', smart: '스마트사이딩' };
    var exteriorMat = matLabel[c.exteriorMaterialType || 'default'] || (c.exteriorMaterialType || '기본');

    var html = '<div class="design-detail-design-request-block">' +
      '<h5 class="design-detail-design-request-heading">설계 요청 사항</h5>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">내부 공간</span>' +
      '<div class="design-detail-design-request-grid">' +
      '<div class="design-detail-field"><label>침실/방</label><div>' + roomLabel(c.bedroomMode, c.memoBedroom) + '</div></div>' +
      '<div class="design-detail-field"><label>거실</label><div>' + roomLabel(c.livingMode, c.memoLiving) + '</div></div>' +
      '<div class="design-detail-field"><label>주방</label><div>' + roomLabel(c.kitchenMode, c.memoKitchen) + '</div></div>' +
      '<div class="design-detail-field"><label>욕실/화장실</label><div>' + roomLabel(c.bathMode, c.memoBath) + '</div></div>' +
      '</div></div>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">외부 공간</span>' +
      '<div class="design-detail-design-request-grid design-detail-design-request-external">' +
      '<div class="design-detail-field"><label>데크</label><div>' + extLabel(c.externalDeck, c.externalDeckMemo) + '</div></div>' +
      '<div class="design-detail-field"><label>포치</label><div>' + extLabel(c.externalPorch, c.externalPorchMemo) + '</div></div>' +
      '<div class="design-detail-field"><label>마당</label><div>' + extLabel(c.externalYard, c.externalYardMemo) + '</div></div>' +
      '<div class="design-detail-field"><label>주차</label><div>' + extLabel(c.externalParking, c.externalParkingMemo) + '</div></div>' +
      '</div>' +
      (c.memoExterior && !c.externalDeck && !c.externalPorch ? '<div class="design-detail-field design-detail-field-full"><label>외부/데크/포치 (메모)</label><div>' + esc(c.memoExterior) + '</div></div>' : '') +
      '</div>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">창호 변경</span>' +
      '<div class="design-detail-design-request-window">' +
      (c.windowAddMemo ? '<div class="design-detail-field"><label>창 추가</label><div>' + esc(c.windowAddMemo) + '</div></div>' : '') +
      (c.windowPositionMemo ? '<div class="design-detail-field"><label>창 위치 변경</label><div>' + esc(c.windowPositionMemo) + '</div></div>' : '') +
      (c.windowSizeMemo ? '<div class="design-detail-field"><label>창 크기 변경</label><div>' + esc(c.windowSizeMemo) + '</div></div>' : '') +
      (!c.windowAddMemo && !c.windowPositionMemo && !c.windowSizeMemo ? '<div class="design-detail-field"><div class="design-detail-view-empty">-</div></div>' : '') +
      '</div></div>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">외장재 변경</span>' +
      '<div class="design-detail-field"><div>' + esc(exteriorMat) + '</div></div></div>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">설비 / 전기</span>' +
      '<div class="design-detail-design-request-grid design-detail-design-request-facility">' +
      (c.facilityCeilingFan ? '<div class="design-detail-field"><label>실링팬</label><div>' + esc(c.facilityCeilingFan) + '</div></div>' : '') +
      (c.facilityAircon ? '<div class="design-detail-field"><label>에어컨 위치</label><div>' + esc(c.facilityAircon) + '</div></div>' : '') +
      (c.facilityOutlet ? '<div class="design-detail-field"><label>콘센트 추가</label><div>' + esc(c.facilityOutlet) + '</div></div>' : '') +
      (c.facilityLighting ? '<div class="design-detail-field"><label>조명 변경</label><div>' + esc(c.facilityLighting) + '</div></div>' : '') +
      (!c.facilityCeilingFan && !c.facilityAircon && !c.facilityOutlet && !c.facilityLighting ? '<div class="design-detail-field"><div class="design-detail-view-empty">-</div></div>' : '') +
      '</div></div>' +

      '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">기타 요청 및 메모</span>' +
      '<div class="design-detail-design-request-grid">' +
      '<div class="design-detail-field"><label>기타 요청사항</label><div>' + esc(c.memoEtc) + '</div></div>' +
      '<div class="design-detail-field"><label>외장재</label><div>' + esc(c.exteriorNote) + '</div></div>' +
      '<div class="design-detail-field"><label>추가 내용</label><div>' + esc(c.extraNote) + '</div></div>' +
      '</div></div>';

    if (c.designHandoverSummary) {
      html += '<div class="design-detail-design-request-group"><span class="design-detail-design-request-group-title">[설계팀 인계 메모]</span>' +
        '<div class="design-detail-field design-detail-handover-summary-wrap"><pre class="design-detail-handover-summary">' + esc(c.designHandoverSummary) + '</pre></div></div>';
    }
    html += '</div>';
    return html;
  }

  function buildDesignDetailContent(contractId) {
    var c = getContracts().find(function (x) { return x.id === contractId; });
    if (!c) return '';
    var statusMap = { none: '미착수', in_progress: '설계 중', done: '완료' };
    var statusLabel = statusMap[c.designStatus || 'none'] || '-';
    // 영업팀 contractModel을 항상 기준으로 사용 (기존 projectType 무시)
    var effectiveProjectType = c.contractModel || '';
    var projectType = effectiveProjectType || '-';
    var houseWrapHidden = effectiveProjectType !== '전원주택' ? ' hidden' : '';
    var summaryBar = '<div class="design-detail-summary-bar">' +
      '<span class="design-detail-summary-item"><strong>고객명</strong> ' + escapeAttr(c.customerName || '-') + '</span>' +
      '<span class="design-detail-summary-item"><strong>유형</strong> ' + escapeAttr(projectType) + '</span>' +
      '<span class="design-detail-summary-item"><strong>계약금액</strong> ' + escapeAttr(formatMoney(Math.round(Number(c.totalAmount) / (c.amountUnit === 'manwon' ? 1 : 10000)))) + '만원</span>' +
      '<span class="design-detail-summary-item"><strong>계약금 입금일</strong> ' + escapeAttr(formatDate(c.depositReceivedAt)) + '</span>' +
      '<span class="design-detail-summary-item"><strong>설계 진행 상태</strong> ' + escapeAttr(statusLabel) + '</span>' +
      '<span class="design-detail-summary-item"><strong>착공 준비완료</strong> ' + (c.constructionStartOk ? 'Y' : '-') + '</span>' +
      '<div class="design-detail-summary-actions">' +
      '<button type="button" class="btn btn-sm btn-secondary btn-open-contract-chat" data-contract-id="' + escapeAttr(contractId) + '">팀 채팅</button>' +
      '<button type="button" class="btn btn-sm btn-primary design-detail-save-top-inline">저장</button>' +
      '<button type="button" class="btn btn-sm btn-secondary design-detail-modal-btn" data-contract-id="' + escapeAttr(contractId) + '">계약 상세</button>' +
      '</div></div>';
    var cardBasic = '<div class="design-detail-card">' +
      '<h4 class="design-detail-card-title">기본 계약 정보 (읽기)</h4>' +
      '<div class="design-detail-card-body design-detail-basic-grid">' +
      '<div class="design-detail-field"><label>영업사원 전시장</label><div>' + escapeAttr(getShowroomName(c.showroomId || "")) + '</div></div>' +
      '<div class="design-detail-field"><label>계약 모델</label><div>' + escapeAttr(c.contractModel || "-") + '</div></div>' +
      '<div class="design-detail-field"><label>모델 이름</label><div>' + escapeAttr(c.contractModelName || "-") + '</div></div>' +
      '<div class="design-detail-field"><label>담당 영업사원</label><div>' + escapeAttr(c.salesPerson || "-") + '</div></div>' +
      '<div class="design-detail-field"><label>시공 주소</label><div>' + escapeAttr(c.siteAddress || "-") + '</div></div>' +
      '<div class="design-detail-field"><label>설치 유형</label><div>' + escapeAttr(c.installType || "현장시공") + '</div></div>' +
      '<div class="design-detail-field"><label>공급가(만원)</label><div>' + escapeAttr(c.supplyAmount || "") + '</div></div>' +
      '<div class="design-detail-field"><label>부가세(만원)</label><div>' + escapeAttr(c.vatAmount || "") + '</div></div>' +
      '<div class="design-detail-field"><label>기초공사 평수</label><div>' + escapeAttr(c.foundationPyeong || "") + '</div></div>' +
      '<div class="design-detail-field"><label>주택 평수</label><div>' + escapeAttr(c.housePyeong || "") + '</div></div>' +
      '<div class="design-detail-field"><label>옵션 요약</label><div>' + escapeAttr(formatOptionsSummary(c.options)) + '</div></div>' +
      buildDesignRequestViewHtml(c) +
      '</div></div>';
    var extraLinks = '';
    if (Array.isArray(c.extraAttachments) && c.extraAttachments.length > 0) {
      extraLinks = c.extraAttachments.map(function (f) {
        var name = (f.name || (f.url || '').split('/').pop().replace(/^\d+_/, '') || '파일');
        return '<div style="margin-bottom:2px"><a href="' + escapeAttr(f.url || '') + '" target="_blank" rel="noopener">' + escapeAttr(name) + '</a></div>';
      }).join('');
    }
    var cardSalesContract = '<div class="design-detail-card design-detail-sales-contract-view">' +
      '<h4 class="design-detail-card-title">영업팀 계약서 (읽기)</h4>' +
      '<div class="design-detail-card-body"><p class="design-detail-view-only">' + linkOrText(c.contractAttachment) + '</p>' +
      (extraLinks ? '<p class="design-detail-view-only" style="margin-top:6px"><span style="font-size:11px;color:#9ca3af;display:block;margin-bottom:4px">추가 자료</span>' + extraLinks + '</p>' : '') +
      '</div></div>';
    var d1DesignMemo = c.designDrawing1DesignMemo || '';
    var d1SalesMemo = c.designDrawing1SalesMemo || '';
    var d1Final = !!c.designDrawing1Final;
    var d2Attachment = c.designDrawing2Attachment || '';
    var d2DesignMemo = c.designDrawing2DesignMemo || '';
    var d2SalesMemo = c.designDrawing2SalesMemo || '';
    var d2Final = !!c.designDrawing2Final;
    var d3Attachment = c.designDrawing3Attachment || '';
    var d3DesignMemo = c.designDrawing3DesignMemo || '';
    var d3SalesMemo = c.designDrawing3SalesMemo || '';
    var d3Final = !!c.designDrawing3Final;
    var cardDrawing = '<div class="design-detail-card">' +
      '<h4 class="design-detail-card-title">도면 관리</h4>' +
      '<div class="design-detail-card-body">' +
      '<label class="design-detail-field">유형 <select class="design-inline-project-type"><option value="">선택</option><option value="컨테이너/농막"' + (effectiveProjectType === '컨테이너/농막' ? ' selected' : '') + '>컨테이너/농막</option><option value="체류형쉼터"' + (effectiveProjectType === '체류형쉼터' ? ' selected' : '') + '>체류형쉼터</option><option value="전원주택"' + (effectiveProjectType === '전원주택' ? ' selected' : '') + '>전원주택</option><option value="기타"' + (effectiveProjectType === '기타' ? ' selected' : '') + '>기타</option></select></label>' +
      '<div class="design-discussion-card">' +
      '<div class="design-discussion-header"><span class="design-discussion-title">설계 협의 1차</span><label class="checkbox-label design-discussion-final-header"><input type="checkbox" class="design-inline-drawing-1-final design-inline-drawing-final"' + (d1Final ? ' checked' : '') + '> 최종 확정</label><span class="design-discussion-final-badge' + (d1Final ? '' : '" style=\\"display:none\\""') + '">최종 확정</span></div>' +
      '<div class="design-detail-field"><label>현재 도면 URL</label><div class="design-detail-view-only">' + linkOrText(c.designDrawingAttachment) + '</div></div>' +
      '<div class="design-detail-field design-detail-field-upload design-discussion-file-row"><label>파일</label><input type="text" class="design-inline-drawing drawing-url-input" placeholder="파일 업로드 후 URL 자동 입력 (또는 직접 입력)" value="' + escapeAttr(c.designDrawingAttachment || '') + '"><input type="file" class="design-inline-drawing-file" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.zip" multiple hidden><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-upload">파일 업로드</button><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-open">열기</button></div>' +
      '<div class="drawing-file-list" data-input-selector=".design-inline-drawing"></div>' +
      '</div>' +
      '<div class="design-discussion-card">' +
      '<div class="design-discussion-header"><span class="design-discussion-title">설계 협의 2차</span><label class="checkbox-label design-discussion-final-header"><input type="checkbox" class="design-inline-drawing-2-final design-inline-drawing-final"' + (d2Final ? ' checked' : '') + '> 최종 확정</label><span class="design-discussion-final-badge' + (d2Final ? '' : '" style=\\"display:none\\""') + '">최종 확정</span></div>' +
      '<div class="design-detail-field"><label>현재 도면 URL</label><div class="design-detail-view-only">' + linkOrText(d2Attachment) + '</div></div>' +
      '<div class="design-detail-field design-detail-field-upload design-discussion-file-row"><label>파일</label><input type="text" class="design-inline-drawing-2 drawing-url-input" placeholder="파일 업로드 후 URL" value="' + escapeAttr(d2Attachment) + '"><input type="file" class="design-inline-drawing-file-2" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.zip" multiple hidden><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-upload-2">파일 업로드</button><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-open-2">열기</button></div>' +
      '<div class="drawing-file-list" data-input-selector=".design-inline-drawing-2"></div>' +
      '</div>' +
      '<div class="design-discussion-card">' +
      '<div class="design-discussion-header"><span class="design-discussion-title">설계 협의 3차</span><label class="checkbox-label design-discussion-final-header"><input type="checkbox" class="design-inline-drawing-3-final design-inline-drawing-final"' + (d3Final ? ' checked' : '') + '> 최종 확정</label><span class="design-discussion-final-badge' + (d3Final ? '' : '" style=\\"display:none\\""') + '">최종 확정</span></div>' +
      '<div class="design-detail-field"><label>현재 도면 URL</label><div class="design-detail-view-only">' + linkOrText(d3Attachment) + '</div></div>' +
      '<div class="design-detail-field design-detail-field-upload design-discussion-file-row"><label>파일</label><input type="text" class="design-inline-drawing-3 drawing-url-input" placeholder="파일 업로드 후 URL" value="' + escapeAttr(d3Attachment) + '"><input type="file" class="design-inline-drawing-file-3" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.zip" multiple hidden><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-upload-3">파일 업로드</button><button type="button" class="btn btn-sm btn-secondary design-inline-drawing-open-3">열기</button></div>' +
      '<div class="drawing-file-list" data-input-selector=".design-inline-drawing-3"></div>' +
      '</div>' +
      '<div class="design-discussion-card design-construction-card">' +
      '<div class="design-discussion-header"><span class="design-discussion-title">시공 도면</span></div>' +
      '<div class="design-detail-field"><label>현재 도면 URL</label><div class="design-detail-view-only">' + linkOrText(c.constructionDrawingAttachment) + '</div></div>' +
      '<div class="design-detail-field design-detail-field-upload design-discussion-file-row"><label>파일</label><input type="text" class="design-inline-construction-drawing drawing-url-input" placeholder="파일 업로드 후 URL 자동 입력 (또는 직접 입력)" value="' + escapeAttr(c.constructionDrawingAttachment || '') + '"><input type="file" class="design-inline-construction-drawing-file" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.zip" multiple hidden><button type="button" class="btn btn-sm btn-secondary design-inline-construction-drawing-upload">파일 업로드</button><button type="button" class="btn btn-sm btn-secondary design-inline-construction-drawing-open">열기</button></div>' +
      '<div class="drawing-file-list" data-input-selector=".design-inline-construction-drawing"></div>' +
      '</div>' +
      '</div></div>';
    var cardPermitInfo = '<div class="design-detail-card design-inline-house-wrap' + houseWrapHidden + '">' +
      '<h4 class="design-detail-card-title">주택 허가 정보</h4>' +
      '<div class="design-detail-card-body">' +
      '<label class="design-detail-field">건축사 정보<input type="text" class="design-inline-architect" placeholder="이름/연락처" value="' + escapeAttr(c.architectInfo || '') + '"></label>' +
      '<label class="design-detail-field">담당자 이름<input type="text" class="design-inline-contact-name" placeholder="건축사 담당자명" value="' + escapeAttr(c.designContactName || '') + '"></label>' +
      '<label class="design-detail-field">담당자 연락처<input type="tel" class="design-inline-contact-phone" placeholder="010-0000-0000" value="' + escapeAttr(c.designContactPhone || '') + '"></label>' +
      '<label class="design-detail-field">건축허가서 URL <input type="text" class="design-inline-permit-attachment" placeholder="파일 업로드 후 URL" value="' + escapeAttr(c.permitAttachment || '') + '"></label>' +
      '<label class="design-detail-field">사용승인서 URL <input type="text" class="design-inline-completion-attachment" placeholder="파일 업로드 후 URL" value="' + escapeAttr(c.completionCertAttachment || '') + '"></label>' +
      '</div></div>';
    var cardStatus = '<div class="design-detail-card permit-status-card">' +
      '<div class="design-detail-card-body">' +
      '<h4 class="design-detail-card-title manager-info-title">담당자 정보</h4>' +
      '<div class="design-detail-field"><label>영업 담당자</label><div class="design-detail-view-only">' + escapeAttr(c.salesPerson || '-') + '</div></div>' +
      '<div class="design-detail-field"><label>설계 담당자</label><div class="design-detail-view-only">' + escapeAttr(c.designPermitDesigner || c.designContactName || '-') + '</div></div>' +
      '<div class="design-detail-field"><label>시공 담당자</label><div class="design-detail-view-only">' + escapeAttr(c.constructionManager || '-') + '</div></div>' +
      '<div class="design-detail-field design-detail-designer-field">' +
      '<label>설계 담당자</label>' +
      '<div class="design-detail-designer-inputs">' +
      '<input type="text" class="design-inline-designer" placeholder="설계 담당자 이름을 입력하세요" value="' + escapeAttr(c.designPermitDesigner || '') + '">' +
      '</div>' +
      '</div>' +
      '<h4 class="design-detail-card-title permit-status-title">허가 / 착공 현황</h4>' +
      '<div class="permit-steps-wrap' + (effectiveProjectType === '전원주택' ? '' : ' hidden') + '">' +
      '<label class="design-detail-check-item"><input type="checkbox" class="design-inline-design-consult-inprogress"' + (c.designConsultInProgress ? ' checked' : '') + '> 건축 설계 협의 진행중</label>' +
      '<label class="design-detail-check-item"><input type="checkbox" class="design-inline-permit-inprogress"' + (c.permitInProgress ? ' checked' : '') + '> 건축 인허가 진행중</label>' +
      '<div class="permit-cert-wrap"><label class="permit-cert-label"><input type="checkbox" class="design-inline-has-permit"' + (c.hasPermitCert ? ' checked' : '') + '> 건축허가 완료</label><input type="date" class="design-inline-permit-cert-date" value="' + escapeAttr(c.permitCertDate || '') + '" title="허가 완료일"></div>' +
      '<label class="design-detail-check-item"><input type="checkbox" class="design-inline-has-construction-report"' + (c.hasConstructionStartReport ? ' checked' : '') + '> 착공 신고서 완료</label>' +
      '<label class="design-detail-check-item"><input type="checkbox" class="design-inline-has-completion-cert"' + (c.hasCompletionCert ? ' checked' : '') + '> 사용 승인서 완료</label>' +
      '</div>' +
      '<div class="shelter-permit-wrap' + (effectiveProjectType === '체류형쉼터' ? '' : ' hidden') + '">' +
      '<label class="design-detail-check-item"><input type="checkbox" class="design-inline-has-temporary-building-cert"' + (c.hasTemporaryBuildingCert ? ' checked' : '') + '> 가설 건축물 필증</label>' +
      '</div>' +
      '<div class="start-ready-box">' +
      '<div class="design-approval-readonly">' +
      '<span class="design-approval-readonly-item' + (c.salesConfirmed ? ' confirmed' : '') + '">영업팀 확인 ' + (c.salesConfirmed ? '✓' : '✗') + '</span>' +
      '<span class="design-approval-readonly-item' + (c.designConfirmed ? ' confirmed' : '') + '">설계팀 확인 ' + (c.designConfirmed ? '✓' : '✗') + '</span>' +
      '<span class="design-approval-readonly-item' + (c.constructionConfirmed ? ' confirmed' : '') + '">시공팀 확인 ' + (c.constructionConfirmed ? '✓' : '✗') + '</span>' +
      '<span class="design-approval-readonly-item final' + (c.finalApproved ? ' confirmed' : '') + '">최종 승인 ' + (c.finalApproved ? '✓' : '✗') + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="design-detail-memo-grid">' +
      '<label class="design-detail-field"><span>설계팀 메모</span><textarea class="design-status-memo design-status-memo-design" rows="3" placeholder="설계 진행 상황 메모, 특이 사항 기록">' + escapeAttr(c.designStatusMemoDesign || '') + '</textarea></label>' +
      '<label class="design-detail-field"><span>영업팀 메모</span><textarea class="design-status-memo design-status-memo-sales" rows="3" placeholder="고객 요청 내용 메모, 영업 협의 사항 등">' + escapeAttr(c.designStatusMemoSales || '') + '</textarea></label>' +
      '<label class="design-detail-field"><span>시공팀 메모</span><textarea class="design-status-memo design-status-memo-construction" rows="3" placeholder="시공 준비 메모, 현장 특이사항 등">' + escapeAttr(c.designStatusMemoConstruction || '') + '</textarea></label>' +
      '</div>' +
      '</div></div>';
    var chatTitle = (c.customerName || '-') + ' ? ' + (c.contractModelName || c.contractModel || '-');
    var chatSubtitle = (typeof getShowroomName === 'function' ? getShowroomName(c.showroomId || '') : (c.showroomId || '-')) + ' · 팀 내부 채팅';
    var cardChat = '<div class="design-detail-card design-contract-chat-card contract-chat-card">' +
      '<div class="contract-chat-header">' +
      '<h4 class="contract-chat-title">' + escapeAttr(chatTitle) + '</h4>' +
      '<p class="contract-chat-subtitle">' + escapeAttr(chatSubtitle) + '</p>' +
      '</div>' +
      '<div class="contract-chat-messages design-contract-chat-messages-wrap">' +
      '<ul id="design-contract-chat-message-list" class="chat-message-list design-contract-chat-message-list"></ul>' +
      '</div>' +
      '<div id="design-contract-chat-form" class="design-contract-chat-form contract-chat-input-wrap">' +
      '<input type="hidden" id="design-contract-chat-contract-id" value="' + escapeAttr(contractId) + '">' +
      '<input type="file" id="design-contract-chat-file-input" class="chat-file-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" multiple hidden>' +
      '<div class="chat-input-bar design-contract-chat-input-bar">' +
      '<div class="chat-input-actions">' +
      '<button type="button" class="chat-tool-btn design-chat-attach-btn" title="파일 첨부">📎</button>' +
      '<button type="button" class="chat-tool-btn design-chat-mention-btn" title="멘션">@</button>' +
      '<button type="button" class="chat-tool-btn design-chat-emoji-btn" title="이모지">😊</button>' +
      '</div>' +
      '<textarea id="design-contract-chat-input" class="chat-input chat-textarea" placeholder="메시지를 입력하세요..." rows="1" maxlength="2000"></textarea>' +
      '<button type="button" class="btn btn-primary chat-send-btn design-chat-send-btn">전송</button>' +
      '</div>' +
      '<div class="design-chat-emoji-popover hidden" id="design-chat-emoji-popover">' +
      '<span class="chat-emoji-item" data-emoji="😊">😊</span><span class="chat-emoji-item" data-emoji="😄">😄</span><span class="chat-emoji-item" data-emoji="😂">😂</span><span class="chat-emoji-item" data-emoji="🥰">🥰</span><span class="chat-emoji-item" data-emoji="😎">😎</span><span class="chat-emoji-item" data-emoji="🤔">🤔</span><span class="chat-emoji-item" data-emoji="😅">😅</span><span class="chat-emoji-item" data-emoji="😭">😭</span>' +
      '<span class="chat-emoji-item" data-emoji="👍">👍</span><span class="chat-emoji-item" data-emoji="👎">👎</span><span class="chat-emoji-item" data-emoji="👏">👏</span><span class="chat-emoji-item" data-emoji="🙏">🙏</span><span class="chat-emoji-item" data-emoji="🤝">🤝</span><span class="chat-emoji-item" data-emoji="💪">💪</span><span class="chat-emoji-item" data-emoji="✅">✅</span><span class="chat-emoji-item" data-emoji="❌">❌</span>' +
      '<span class="chat-emoji-item" data-emoji="⭐">⭐</span><span class="chat-emoji-item" data-emoji="🔥">🔥</span><span class="chat-emoji-item" data-emoji="💡">💡</span><span class="chat-emoji-item" data-emoji="📌">📌</span><span class="chat-emoji-item" data-emoji="📎">📎</span><span class="chat-emoji-item" data-emoji="📋">📋</span><span class="chat-emoji-item" data-emoji="📝">📝</span><span class="chat-emoji-item" data-emoji="📊">📊</span>' +
      '<span class="chat-emoji-item" data-emoji="🏠">🏠</span><span class="chat-emoji-item" data-emoji="🏗️">🏗️</span><span class="chat-emoji-item" data-emoji="🔨">🔨</span><span class="chat-emoji-item" data-emoji="🪚">🪚</span><span class="chat-emoji-item" data-emoji="⚙️">⚙️</span><span class="chat-emoji-item" data-emoji="🔧">🔧</span><span class="chat-emoji-item" data-emoji="📐">📐</span><span class="chat-emoji-item" data-emoji="📏">📏</span>' +
      '<span class="chat-emoji-item" data-emoji="💰">💰</span><span class="chat-emoji-item" data-emoji="💳">💳</span><span class="chat-emoji-item" data-emoji="📞">📞</span><span class="chat-emoji-item" data-emoji="✉️">✉️</span><span class="chat-emoji-item" data-emoji="📱">📱</span><span class="chat-emoji-item" data-emoji="🚗">🚗</span><span class="chat-emoji-item" data-emoji="📅">📅</span><span class="chat-emoji-item" data-emoji="⏰">⏰</span>' +
      '<span class="chat-emoji-item" data-emoji="❓">❓</span><span class="chat-emoji-item" data-emoji="❗">❗</span><span class="chat-emoji-item" data-emoji="⚠️">⚠️</span><span class="chat-emoji-item" data-emoji="🔔">🔔</span><span class="chat-emoji-item" data-emoji="🎯">🎯</span><span class="chat-emoji-item" data-emoji="✨">✨</span><span class="chat-emoji-item" data-emoji="🆗">🆗</span><span class="chat-emoji-item" data-emoji="🆕">🆕</span>' +
      '</div>' +
      '</div></div>';
    var grid = '<div class="design-detail-grid">' +
      '<div class="design-detail-col-left">' + cardBasic + cardSalesContract + cardDrawing + cardPermitInfo + '</div>' +
      '<div class="design-detail-col-right">' + cardStatus + cardChat + '</div>' +
      '</div>';
    var form = '<form class="form-design-inline-inline" data-contract-id="' + escapeAttr(contractId) + '">' +
      '<input type="hidden" class="design-inline-contract-id" value="' + escapeAttr(contractId) + '">' +
      summaryBar + grid +
      '<div class="form-actions design-detail-actions"><button type="submit" class="btn btn-primary">저장</button></div></form>';
    return '<div class="design-detail-inner">' + form + '</div>';
  }

  function initDesignContractChatInCell(td, contractId) {
    if (!td || !contractId) return;
    var contracts = typeof getContracts === 'function' ? getContracts() : [];
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (typeof ensureContractChatRoom === 'function') ensureContractChatRoom(contractId);
    if (c && typeof ensureContractChatSystemMessages === 'function') ensureContractChatSystemMessages(contractId, c);
    if (typeof renderContractChat === 'function') renderContractChat(contractId, 'design-contract-chat-message-list');
    var form = td.querySelector('#design-contract-chat-form');
    var input = td.querySelector('#design-contract-chat-input');
    var fileInput = td.querySelector('#design-contract-chat-file-input');
    var attachBtn = td.querySelector('.design-chat-attach-btn');
    var mentionBtn = td.querySelector('.design-chat-mention-btn');
    var emojiBtn = td.querySelector('.design-chat-emoji-btn');
    var emojiPopover = td.querySelector('.design-chat-emoji-popover');
    if (!form || !input) return;
    form._designChatPendingFiles = [];
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) {
          for (var i = 0; i < fileInput.files.length; i++) form._designChatPendingFiles.push(fileInput.files[i]);
          var names = [];
          for (var j = 0; j < fileInput.files.length; j++) names.push(fileInput.files[j].name);
          input.value = (input.value || '').trim() + (input.value ? '\n' : '') + '[???: ' + names.join(', ') + ']';
        }
        fileInput.value = '';
      });
    }
    if (mentionBtn) {
      mentionBtn.addEventListener('click', function () {
        var val = input.value || '';
        input.value = val + (val && !/^\s*$/.test(val) ? ' ' : '') + '@';
        input.focus();
      });
    }
    if (emojiBtn && emojiPopover) {
      emojiBtn.addEventListener('click', function () { emojiPopover.classList.toggle('hidden'); });
      emojiPopover.querySelectorAll('.chat-emoji-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var emoji = el.getAttribute('data-emoji') || '';
          if (emoji) {
            var start = input.selectionStart;
            var end = input.selectionEnd;
            var val = input.value || '';
            input.value = val.slice(0, start) + emoji + val.slice(end);
            input.selectionStart = input.selectionEnd = start + emoji.length;
          }
          emojiPopover.classList.add('hidden');
          input.focus();
        });
      });
      document.addEventListener('click', function closeDesignEmoji(e) {
        if (emojiPopover && emojiPopover.isConnected && !emojiPopover.classList.contains('hidden') && !emojiPopover.contains(e.target) && !emojiBtn.contains(e.target)) {
          emojiPopover.classList.add('hidden');
        }
      });
    }
    function doDesignChatSend() {
      var rawText = (input.value || '').trim();
      var text = rawText.replace(/\s*\[\?\?\?:[^\]]*\]\s*$/, '').trim();
      var pending = form._designChatPendingFiles || [];
      if (!text && !pending.length) return;
      var hid = td.querySelector('#design-contract-chat-contract-id');
      var cid = hid && hid.value;
      if (!cid) return;
      if (pending.length && typeof uploadChatFiles === 'function') {
        uploadChatFiles(pending, 'contract_' + cid).then(function (attachments) {
          var me = typeof getCurrentChatUser === 'function' ? getCurrentChatUser() : { id: 'user', name: '사용자' };
          var msg = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
            contract_id: cid,
            sender_id: me.id,
            sender_name: me.name,
            message: text || '(파일 첨부)',
            created_at: new Date().toISOString()
          };
          if (attachments && attachments.length) msg.attachments = attachments;
          if (typeof saveContractChatMessage === 'function') saveContractChatMessage(cid, msg);
          input.value = '';
          form._designChatPendingFiles = [];
          if (typeof renderContractChat === 'function') renderContractChat(cid, 'design-contract-chat-message-list');
        }).catch(function () {
          var me = typeof getCurrentChatUser === 'function' ? getCurrentChatUser() : { id: 'user', name: '사용자' };
          if (typeof saveContractChatMessage === 'function') saveContractChatMessage(cid, { id: 'msg_' + Date.now(), contract_id: cid, sender_id: me.id, sender_name: me.name, message: rawText, created_at: new Date().toISOString() });
          input.value = '';
          form._designChatPendingFiles = [];
          if (typeof renderContractChat === 'function') renderContractChat(cid, 'design-contract-chat-message-list');
        });
      } else {
        var me = typeof getCurrentChatUser === 'function' ? getCurrentChatUser() : { id: 'user', name: '사용자' };
        var msg = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          contract_id: cid,
          sender_id: me.id,
          sender_name: me.name,
          message: text,
          created_at: new Date().toISOString()
        };
        if (typeof saveContractChatMessage === 'function') saveContractChatMessage(cid, msg);
        input.value = '';
        form._designChatPendingFiles = [];
        if (typeof renderContractChat === 'function') renderContractChat(cid, 'design-contract-chat-message-list');
      }
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doDesignChatSend();
      }
    });
    var sendBtn = td.querySelector('.design-chat-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', function (e) { e.preventDefault(); doDesignChatSend(); });
  }

  function insertDesignDetailRowAfter(row, contractId) {
    var tbody = row.parentNode;
    var next = row.nextElementSibling;
    if (next && next.classList && next.classList.contains('design-detail-row')) {
      next.remove();
    }
    var tr = document.createElement('tr');
    tr.className = 'design-detail-row';
    tr.setAttribute('data-detail-for', contractId);
    var td = document.createElement('td');
    // ????? ??????? ????????? ???)?? ??????? colspan??15?????
    td.colSpan = 15;
    td.className = 'design-detail-cell';
    td.innerHTML = buildDesignDetailContent(contractId);
    initDesignContractChatInCell(td, contractId);
    // ?????? ??? ?? ??? (???/???/???)
    if (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
      var cur = window.seumAuth.currentEmployee;
      var team = (cur.team || '').trim();
      var canDesign = team === '설계' || team === '영업';
      var canSales = team === '영업';
      var canConstruction = team === '시공';
      var designMemo = td.querySelector('.design-status-memo-design');
      var salesMemo = td.querySelector('.design-status-memo-sales');
      var constructionMemo = td.querySelector('.design-status-memo-construction');
      if (designMemo && team !== '설계') designMemo.readOnly = true;
      if (salesMemo && !canSales) salesMemo.readOnly = true;
      if (constructionMemo && !canConstruction) constructionMemo.readOnly = true;
      // 설계팀 + 영업팀: 설계 담당자 입력란 및 허가/착공 현황 체크박스 편집 가능
      if (!canDesign) {
        var designerInput = td.querySelector('.design-inline-designer');
        if (designerInput) { designerInput.readOnly = true; designerInput.disabled = true; }
        ['.design-inline-permit-required', '.design-inline-design-consult-inprogress',
          '.design-inline-permit-inprogress', '.design-inline-has-permit',
          '.design-inline-permit-cert-date',
          '.design-inline-has-construction-report', '.design-inline-has-completion-cert'
        ].forEach(function (cls) { var el = td.querySelector(cls); if (el) el.disabled = true; });
        var constructionStartOkCheck = td.querySelector('.design-inline-construction-start-ok');
        if (constructionStartOkCheck) constructionStartOkCheck.disabled = true;
      }
    }
    // ???????? ??? ?????? ?????
    td.querySelectorAll('.drawing-file-list[data-input-selector]').forEach(function (listEl) {
      var selector = listEl.getAttribute('data-input-selector');
      if (!selector) return;
      var inputEl = td.querySelector(selector);
      if (inputEl) {
        refreshDrawingFileListForInput(inputEl, listEl);
      }
    });
    // ??????? ??? ???????????????????)
    if (isSalesReadonly()) {
      td.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        if (el.type === 'submit' || el.classList.contains('btn-primary')) {
          el.disabled = true;
        } else if (el.tagName === 'BUTTON') {
          el.disabled = true;
        } else {
          el.setAttribute('readonly', 'readonly');
          if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
            el.disabled = true;
          }
        }
      });
    }
    tr.appendChild(td);
    tbody.insertBefore(tr, row.nextSibling);
  }

  function showDesignDetailPanel(contractId, forceRefresh) {
    var tbody = document.getElementById('tbody-design');
    if (!tbody) return;
    var row = tbody.querySelector('.design-row[data-contract-id="' + contractId + '"]');
    if (!row) return;
    var next = row.nextElementSibling;
    var isDetailOpen = next && next.classList && next.classList.contains('design-detail-row') && next.getAttribute('data-detail-for') === contractId;
    if (!forceRefresh && isDetailOpen) {
      next.remove();
      row.classList.remove('design-row-expanded');
      expandedDesignId = null;
      return;
    }
    row.classList.remove('design-row-expanded');
    tbody.querySelectorAll('.design-detail-row').forEach(function (r) { r.remove(); });
    tbody.querySelectorAll('.design-row-expanded').forEach(function (r) { r.classList.remove('design-row-expanded'); });
    insertDesignDetailRowAfter(row, contractId);
    // ??????? ??? ???????????????????????, "????? ??"????? ??????? ???
    if (isSalesReadonly()) {
      var detailRow = tbody.querySelector('.design-detail-row[data-detail-for="' + contractId + '"]');
      if (detailRow) {
        detailRow.querySelectorAll('input, select, textarea, button').forEach(function (el) {
          // ?????????????, ???? ??? ?????readonly/disabled
          if (el.type === 'submit' || el.classList.contains('btn-primary')) {
            el.disabled = true;
          } else if (el.tagName === 'BUTTON') {
            el.disabled = true;
          } else {
            el.setAttribute('readonly', 'readonly');
            if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') {
              el.disabled = true;
            }
          }
        });
        // ?? ????? ?????? "????? ??" ??? + ?????????????
        var curEmp = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee ? window.seumAuth.currentEmployee : null;
        if (curEmp && (curEmp.team || '').trim() === '영업') {
          var salesMemo = detailRow.querySelector('.design-status-memo-sales');
          if (salesMemo) {
            salesMemo.readOnly = false;
            salesMemo.removeAttribute('readonly');
            salesMemo.disabled = false;
          }
          detailRow.querySelectorAll('button[type="submit"], .btn-primary.design-detail-save-top-inline').forEach(function (btn) {
            btn.disabled = false;
          });
        }
        if (curEmp && (curEmp.team || '').trim() === '설계') {
          var designMemo = detailRow.querySelector('.design-status-memo-design');
          if (designMemo) {
            designMemo.readOnly = false;
            designMemo.removeAttribute('readonly');
            designMemo.disabled = false;
          }
          // 설계 담당자 입력란 및 허가/착공 현황 체크박스 활성화
          var designerInput = detailRow.querySelector('.design-inline-designer');
          if (designerInput) { designerInput.readOnly = false; designerInput.removeAttribute('readonly'); designerInput.disabled = false; }
          var permitCheck = detailRow.querySelector('.design-inline-has-permit');
          if (permitCheck) permitCheck.disabled = false;
          var permitDateInput = detailRow.querySelector('.design-inline-permit-cert-date');
          if (permitDateInput) permitDateInput.disabled = false;
          var completionCheck = detailRow.querySelector('.design-inline-has-completion-cert');
          if (completionCheck) completionCheck.disabled = false;
          var constructionReportCheck = detailRow.querySelector('.design-inline-has-construction-report');
          if (constructionReportCheck) constructionReportCheck.disabled = false;
          var constructionStartOkCheck = detailRow.querySelector('.design-inline-construction-start-ok');
          if (constructionStartOkCheck) constructionStartOkCheck.disabled = false;
          detailRow.querySelectorAll('button[type="submit"], .btn-primary.design-detail-save-top-inline').forEach(function (btn) {
            btn.disabled = false;
          });
        }
      }
    }
    row.classList.add('design-row-expanded');
    expandedDesignId = contractId;
  }

  function saveDesignInline(contractId) {
    if (!contractId) contractId = document.getElementById('design-inline-contract-id') && document.getElementById('design-inline-contract-id').value;
    if (!contractId) return;
    var form = document.querySelector('.design-detail-row[data-detail-for="' + contractId + '"] form') || document.getElementById('form-design-inline');
    if (!form) return;
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    var curEmp = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee ? window.seumAuth.currentEmployee : null;
    var isSales = curEmp && (curEmp.team || '').trim() === '영업';
    // ?????????? ?????? ?????? ????? ??????
    var isDesign = curEmp && (curEmp.team || '').trim() === '설계';
    if (isSalesReadonly() && isSales) {
      function sel(cls, id) { return (form.querySelector && form.querySelector(cls)) || (id && form.querySelector && form.querySelector('#' + id)); }
      c.designStatusMemoSales = (sel('.design-status-memo-sales') || {}).value ? sel('.design-status-memo-sales').value.trim() : '';
      saveContracts(contracts);
      renderDesign();
      renderConstruction();
      window.alert('설계 메모가 저장되었습니다.');
      return;
    }
    if (isSalesReadonly() && isDesign) {
      function sel(cls, id) { return (form.querySelector && form.querySelector(cls)) || (id && form.querySelector && form.querySelector('#' + id)); }
      c.designStatusMemoDesign = (sel('.design-status-memo-design') || {}).value ? sel('.design-status-memo-design').value.trim() : '';
      c.designPermitDesigner = (sel('.design-inline-designer') || {}).value ? sel('.design-inline-designer').value.trim() : '';
      var permitRequiredEl = sel('.design-inline-permit-required');
      if (permitRequiredEl) c.permitRequired = permitRequiredEl.checked;
      var designConsultEl = sel('.design-inline-design-consult-inprogress');
      if (designConsultEl) c.designConsultInProgress = designConsultEl.checked;
      var permitInProgressEl = sel('.design-inline-permit-inprogress');
      if (permitInProgressEl) c.permitInProgress = permitInProgressEl.checked;
      var permitEl = sel('.design-inline-has-permit');
      if (permitEl) c.hasPermitCert = permitEl.checked;
      var permitCertDateEl = sel('.design-inline-permit-cert-date');
      if (permitCertDateEl) c.permitCertDate = permitCertDateEl.value || '';
      var constructionReportEl = sel('.design-inline-has-construction-report');
      if (constructionReportEl) c.hasConstructionStartReport = constructionReportEl.checked;
      var completionEl = sel('.design-inline-has-completion-cert');
      if (completionEl) c.hasCompletionCert = completionEl.checked;
      var tempBuildingEl = sel('.design-inline-has-temporary-building-cert');
      if (tempBuildingEl) c.hasTemporaryBuildingCert = tempBuildingEl.checked;
      c.constructionStartOk = !!(c.salesConfirmed && c.designConfirmed && c.constructionConfirmed && c.finalApproved);
      saveContracts(contracts);
      renderDesign();
      renderConstruction();
      window.alert('설계팀 메모가 저장되었습니다.');
      return;
    }
    if (isSalesReadonly()) return;
    function sel(cls, id) { return (form.querySelector && form.querySelector(cls)) || (id && form.querySelector && form.querySelector('#' + id)); }
    c.projectType = (sel('.design-inline-project-type', 'design-inline-project-type') || {}).value || '';
    // ?????? 1?? ?? ??? + ??/???
    var d1Input = sel('.design-inline-drawing', 'design-inline-drawing');
    c.designDrawingAttachment = d1Input && d1Input.value ? d1Input.value.trim() : '';
    var d1MemoDesignEl = sel('.design-inline-drawing-1-memo-design');
    var d1MemoSalesEl = sel('.design-inline-drawing-1-memo-sales');
    var d1FinalEl = sel('.design-inline-drawing-1-final');
    c.designDrawing1DesignMemo = d1MemoDesignEl && d1MemoDesignEl.value ? d1MemoDesignEl.value.trim() : '';
    c.designDrawing1SalesMemo = d1MemoSalesEl && d1MemoSalesEl.value ? d1MemoSalesEl.value.trim() : '';
    c.designDrawing1Final = !!(d1FinalEl && d1FinalEl.checked);
    // ?????? 2??
    var d2Input = sel('.design-inline-drawing-2');
    var d2MemoDesignEl = sel('.design-inline-drawing-2-memo-design');
    var d2MemoSalesEl = sel('.design-inline-drawing-2-memo-sales');
    var d2FinalEl = sel('.design-inline-drawing-2-final');
    c.designDrawing2Attachment = d2Input && d2Input.value ? d2Input.value.trim() : '';
    c.designDrawing2DesignMemo = d2MemoDesignEl && d2MemoDesignEl.value ? d2MemoDesignEl.value.trim() : '';
    c.designDrawing2SalesMemo = d2MemoSalesEl && d2MemoSalesEl.value ? d2MemoSalesEl.value.trim() : '';
    c.designDrawing2Final = !!(d2FinalEl && d2FinalEl.checked);
    // ?????? 3??
    var d3Input = sel('.design-inline-drawing-3');
    var d3MemoDesignEl = sel('.design-inline-drawing-3-memo-design');
    var d3MemoSalesEl = sel('.design-inline-drawing-3-memo-sales');
    var d3FinalEl = sel('.design-inline-drawing-3-final');
    c.designDrawing3Attachment = d3Input && d3Input.value ? d3Input.value.trim() : '';
    c.designDrawing3DesignMemo = d3MemoDesignEl && d3MemoDesignEl.value ? d3MemoDesignEl.value.trim() : '';
    c.designDrawing3SalesMemo = d3MemoSalesEl && d3MemoSalesEl.value ? d3MemoSalesEl.value.trim() : '';
    c.designDrawing3Final = !!(d3FinalEl && d3FinalEl.checked);
    c.constructionDrawingAttachment = (sel('.design-inline-construction-drawing', 'design-inline-construction-drawing') || {}).value.trim() || '';
    c.architectInfo = (sel('.design-inline-architect', 'design-inline-architect') || {}).value.trim() || '';
    c.designContactName = (sel('.design-inline-contact-name', 'design-inline-contact-name') || {}).value.trim() || '';
    c.designContactPhone = (sel('.design-inline-contact-phone', 'design-inline-contact-phone') || {}).value.trim() || '';
    c.designPermitDesigner = (sel('.design-inline-designer', 'design-inline-designer') || {}).value.trim() || '';
    c.permitRequired = (sel('.design-inline-permit-required') || {}).checked || false;
    c.designConsultInProgress = (sel('.design-inline-design-consult-inprogress') || {}).checked || false;
    c.permitInProgress = (sel('.design-inline-permit-inprogress') || {}).checked || false;
    c.hasPermitCert = (sel('.design-inline-has-permit', 'design-inline-has-permit') || {}).checked || false;
    c.permitCertDate = ((sel('.design-inline-permit-cert-date') || {}).value || '').trim();
    if (c.hasPermitCert && !c.permitCertDate) {
      window.alert('건축허가 완료 시 허가 완료일을 입력해 주세요.');
      return;
    }
    if (!c.hasPermitCert) c.permitCertDate = '';
    c.permitAttachment = (sel('.design-inline-permit-attachment', 'design-inline-permit-attachment') || {}).value.trim() || '';
    c.completionCertAttachment = (sel('.design-inline-completion-attachment', 'design-inline-completion-attachment') || {}).value.trim() || '';
    c.hasConstructionStartReport = (sel('.design-inline-has-construction-report', 'design-inline-has-construction-report') || {}).checked || false;
    c.hasCompletionCert = (sel('.design-inline-has-completion-cert', 'design-inline-has-completion-cert') || {}).checked || false;
    c.hasTemporaryBuildingCert = (sel('.design-inline-has-temporary-building-cert') || {}).checked || false;
    c.constructionStartOk = !!(c.salesConfirmed && c.designConfirmed && c.constructionConfirmed && c.finalApproved);
    // ???????? ?? ????????????, ??? ???????????? ???????? ????? ??????????? ??? ???
    if (c.constructionStartOk && !c.designPermitDesigner && typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
      var curEmp = window.seumAuth.currentEmployee;
      if (curEmp && (curEmp.team || '').trim() === '설계') {
        c.designPermitDesigner = curEmp.name || c.designPermitDesigner;
      }
    }
    c.designStatusMemoDesign = (sel('.design-status-memo-design') || {}).value ? sel('.design-status-memo-design').value.trim() : '';
    c.designStatusMemoSales = (sel('.design-status-memo-sales') || {}).value ? sel('.design-status-memo-sales').value.trim() : '';
    c.designStatusMemoConstruction = (sel('.design-status-memo-construction') || {}).value ? sel('.design-status-memo-construction').value.trim() : '';
    saveContracts(contracts);
    if (c.designPermitDesigner && typeof window.addContractInviteMessage === 'function') {
      window.addContractInviteMessage(c.id, 'design', c.designPermitDesigner);
    }
    renderDesign();
    renderConstruction();
    window.alert('설계 정보가 저장되었습니다.');
    if (expandedDesignId === contractId) {
      var detailRow = document.querySelector('.design-detail-row[data-detail-for="' + contractId + '"]');
      if (detailRow && detailRow.querySelector('td')) {
        var td2 = detailRow.querySelector('td');
        td2.innerHTML = buildDesignDetailContent(contractId);
        td2.querySelectorAll('.drawing-file-list[data-input-selector]').forEach(function (listEl) {
          var sel2 = listEl.getAttribute('data-input-selector');
          var inputEl2 = sel2 && td2.querySelector(sel2);
          if (inputEl2) refreshDrawingFileListForInput(inputEl2, listEl);
        });
      }
    }
  }

  function initDesignDetailPanel() {
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('design-inline-project-type') || e.target.id === 'design-inline-project-type') {
        var container = e.target.closest('form') || e.target.closest('.design-detail-inner') || e.target.closest('.design-detail-row');
        var wrap = container ? container.querySelector('.design-inline-house-wrap') : document.querySelector('.design-inline-house-wrap');
        if (wrap) wrap.classList.toggle('hidden', e.target.value !== '전원주택');
        var permitWrap = container ? container.querySelector('.permit-steps-wrap') : document.querySelector('.permit-steps-wrap');
        if (permitWrap) permitWrap.classList.toggle('hidden', e.target.value !== '전원주택');
        var shelterWrap = container ? container.querySelector('.shelter-permit-wrap') : document.querySelector('.shelter-permit-wrap');
        if (shelterWrap) shelterWrap.classList.toggle('hidden', e.target.value !== '체류형쉼터');
      }
      if (e.target.classList.contains('design-inline-drawing-file') ||
        e.target.classList.contains('design-inline-drawing-file-2') ||
        e.target.classList.contains('design-inline-drawing-file-3')) {
        var form = e.target.closest('form');
        var contractId = form && (form.querySelector('.design-inline-contract-id') || {}).value;
        var files = Array.prototype.slice.call(e.target.files || []);
        if (contractId && files.length) {
          var selector = e.target.classList.contains('design-inline-drawing-file') ? '.design-inline-drawing'
            : e.target.classList.contains('design-inline-drawing-file-2') ? '.design-inline-drawing-2'
              : '.design-inline-drawing-3';
          var fieldKey = selector === '.design-inline-drawing' ? 'designDrawingAttachment'
            : selector === '.design-inline-drawing-2' ? 'designDrawing2Attachment'
              : 'designDrawing3Attachment';
          Promise.all(files.map(function (file) {
            return uploadDesignDrawingAttachment(contractId, file);
          })).then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) {
              window.alert('업로드에 실패했습니다.');
              return;
            }
            // 현재 DOM이 살아있으면 라이브 input 값 사용, 아니면 localStorage 사용
            var liveForm = document.querySelector('.design-detail-row[data-detail-for="' + contractId + '"] form');
            var liveInp = liveForm && liveForm.querySelector(selector);
            var contracts = getContracts();
            var c = contracts.find(function (x) { return x.id === contractId; });
            var baseVal = liveInp && liveInp.value ? liveInp.value : (c && c[fieldKey] ? c[fieldKey] : '');
            var existingUrls = parseDrawingUrls(baseVal);
            existingUrls = existingUrls.concat(urls);
            var newVal = serializeDrawingUrls(existingUrls);
            if (c) {
              c[fieldKey] = newVal;
              saveContracts(contracts);
            }
            if (liveInp) {
              liveInp.value = newVal;
              var listSel = '.drawing-file-list[data-input-selector="' + selector + '"]';
              var listEl = liveForm.querySelector(listSel);
              if (listEl) refreshDrawingFileListForInput(liveInp, listEl);
              // 현재 도면 URL 표시도 즉시 업데이트
              var card = liveInp.closest('.design-discussion-card');
              if (card) {
                var viewEl = card.querySelector('.design-detail-view-only');
                if (viewEl) viewEl.innerHTML = linkOrText(newVal);
              }
            }
          }).finally(function () {
            e.target.value = '';
          });
        }
      }
      // ?? ??? ??? ???? (?????
      if (e.target.classList.contains('design-inline-drawing-final')) {
        var card = e.target.closest('.design-discussion-card');
        if (card) {
          var badge = card.querySelector('.design-discussion-final-badge');
          if (badge) badge.style.display = e.target.checked ? 'inline-block' : 'none';
        }
      }
      if (e.target.classList.contains('design-inline-construction-drawing-file')) {
        var form = e.target.closest('form');
        var contractId = form && (form.querySelector('.design-inline-contract-id') || {}).value;
        var files = Array.prototype.slice.call(e.target.files || []);
        if (contractId && files.length) {
          Promise.all(files.map(function (file) {
            return uploadConstructionDrawingAttachment(contractId, file);
          })).then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) {
              window.alert('업로드에 실패했습니다.');
              return;
            }
            var liveForm2 = document.querySelector('.design-detail-row[data-detail-for="' + contractId + '"] form');
            var liveInp2 = liveForm2 && liveForm2.querySelector('.design-inline-construction-drawing');
            var contracts = getContracts();
            var c = contracts.find(function (x) { return x.id === contractId; });
            var baseVal2 = liveInp2 && liveInp2.value ? liveInp2.value : (c && c.constructionDrawingAttachment ? c.constructionDrawingAttachment : '');
            var existingUrls = parseDrawingUrls(baseVal2);
            existingUrls = existingUrls.concat(urls);
            var newVal = serializeDrawingUrls(existingUrls);
            if (c) {
              c.constructionDrawingAttachment = newVal;
              saveContracts(contracts);
            }
            if (liveInp2) {
              liveInp2.value = newVal;
              var listEl2 = liveForm2.querySelector('.drawing-file-list[data-input-selector=".design-inline-construction-drawing"]');
              if (listEl2) refreshDrawingFileListForInput(liveInp2, listEl2);
              var card2 = liveInp2.closest('.design-discussion-card');
              if (card2) {
                var viewEl2 = card2.querySelector('.design-detail-view-only');
                if (viewEl2) viewEl2.innerHTML = linkOrText(newVal);
              }
            }
          }).finally(function () {
            e.target.value = '';
          });
        }
      }
    });
    document.addEventListener('submit', function (e) {
      if (e.target.id === 'form-design-inline' || e.target.classList.contains('form-design-inline-inline')) {
        e.preventDefault();
        var contractId = (e.target.querySelector('.design-inline-contract-id') || e.target.querySelector('#design-inline-contract-id') || {}).value;
        if (contractId) saveDesignInline(contractId);
      }
    });
    document.addEventListener('click', function (e) {
      var modalBtn = e.target.closest('.design-detail-modal-btn');
      if (modalBtn) {
        var id = modalBtn.getAttribute('data-contract-id');
        if (id) openDesignPermitModal(id);
      }
      if (e.target.classList.contains('design-detail-save-top-inline')) {
        var inlineForm = e.target.closest('form.form-design-inline-inline');
        if (inlineForm) {
          inlineForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
      if (e.target.classList.contains('design-inline-drawing-upload') ||
        e.target.classList.contains('design-inline-drawing-upload-2') ||
        e.target.classList.contains('design-inline-drawing-upload-3')) {
        var form = e.target.closest('form');
        var selector = e.target.classList.contains('design-inline-drawing-upload') ? '.design-inline-drawing-file'
          : e.target.classList.contains('design-inline-drawing-upload-2') ? '.design-inline-drawing-file-2'
            : '.design-inline-drawing-file-3';
        var inputSelector = e.target.classList.contains('design-inline-drawing-upload') ? '.design-inline-drawing'
          : e.target.classList.contains('design-inline-drawing-upload-2') ? '.design-inline-drawing-2'
            : '.design-inline-drawing-3';
        var fileInput = form && form.querySelector(selector);
        if (fileInput) fileInput.click();
      }
      if (e.target.classList.contains('design-inline-construction-drawing-upload')) {
        var form = e.target.closest('form');
        var fileInput = form && form.querySelector('.design-inline-construction-drawing-file');
        if (fileInput) fileInput.click();
      }
      if (e.target.classList.contains('design-inline-drawing-open') ||
        e.target.classList.contains('design-inline-drawing-open-2') ||
        e.target.classList.contains('design-inline-drawing-open-3')) {
        var form = e.target.closest('form');
        var selectorOpen = e.target.classList.contains('design-inline-drawing-open') ? '.design-inline-drawing'
          : e.target.classList.contains('design-inline-drawing-open-2') ? '.design-inline-drawing-2'
            : '.design-inline-drawing-3';
        var inp = form && form.querySelector(selectorOpen);
        var raw = inp && inp.value ? inp.value.trim() : '';
        if (raw) {
          var parts = raw.split(/\s+/);
          var val = parts[parts.length - 1];
          if (/^https?:\/\//i.test(val)) window.open(val, '_blank');
          else window.alert('유효한 URL이 아닙니다. https:// 로 시작하는 URL을 입력해 주세요.');
        } else window.alert('파일이 없습니다.');
      }
      if (e.target.classList.contains('design-inline-construction-drawing-open')) {
        var form = e.target.closest('form');
        var inp = form && form.querySelector('.design-inline-construction-drawing');
        var raw = inp && inp.value ? inp.value.trim() : '';
        if (raw) {
          var parts = raw.split(/\s+/);
          var val = parts[parts.length - 1];
          if (/^https?:\/\//i.test(val)) window.open(val, '_blank');
          else window.alert('유효한 URL이 아닙니다. https:// 로 시작하는 URL을 입력해 주세요.');
        } else window.alert('파일이 없습니다.');
      }
      // ??? ??? ???? ???/????
      if (e.target.classList.contains('drawing-file-open')) {
        var url = e.target.getAttribute('data-url') || '';
        if (!url) { window.alert('파일이 없습니다.'); return; }
        if (!/^https?:\/\//i.test(url)) {
          window.alert('유효한 URL이 아닙니다. https:// 로 시작하는 URL을 입력해 주세요.');
          return;
        }
        window.open(url, '_blank');
      }
      if (e.target.classList.contains('drawing-file-delete')) {
        var item = e.target.closest('.drawing-file-item');
        var list = e.target.closest('.drawing-file-list');
        if (!item || !list) return;
        var idx = Number(item.getAttribute('data-index') || '0');
        if (isNaN(idx)) return;
        // ??(?????????)????????? id????
        var inputEl = null;
        if (list.id === 'design-drawing-list-1') inputEl = document.getElementById('design-drawing-attachment');
        else if (list.id === 'design-drawing-list-2') inputEl = document.getElementById('design-drawing-attachment-2');
        else if (list.id === 'design-drawing-list-3') inputEl = document.getElementById('design-drawing-attachment-3');
        else if (list.id === 'design-construction-drawing-list') inputEl = document.getElementById('design-construction-drawing-attachment');
        // ???????? ????????? data-input-selector ??
        if (!inputEl && list.hasAttribute('data-input-selector')) {
          var selector = list.getAttribute('data-input-selector');
          var container = list.closest('.design-detail-card') || list.closest('form') || document;
          inputEl = selector && container ? container.querySelector(selector) : null;
        }
        if (!inputEl) return;
        var urls = parseDrawingUrls(inputEl.value || '');
        if (idx < 0 || idx >= urls.length) return;
        urls.splice(idx, 1);
        inputEl.value = serializeDrawingUrls(urls);
        refreshDrawingFileListForInput(inputEl, list);
        // ???????? ?????? ????????, ?? ?? ??????????
        var inlineForm = list.closest('form.form-design-inline-inline');
        if (inlineForm) {
          var cidEl = inlineForm.querySelector('.design-inline-contract-id');
          var contractId = cidEl && cidEl.value;
          if (contractId) {
            var contracts = getContracts();
            var c = contracts.find(function (x) { return x.id === contractId; });
            if (c) {
              // ??? ?????????? selector/id????? ??
              if (inputEl.classList.contains('design-inline-drawing')) {
                c.designDrawingAttachment = urls.length ? urls[0] : '';
              } else if (inputEl.classList.contains('design-inline-drawing-2')) {
                c.designDrawing2Attachment = urls.length ? urls[0] : '';
              } else if (inputEl.classList.contains('design-inline-drawing-3')) {
                c.designDrawing3Attachment = urls.length ? urls[0] : '';
              } else if (inputEl.classList.contains('design-inline-construction-drawing')) {
                c.constructionDrawingAttachment = urls.length ? urls[0] : '';
              }
              saveContracts(contracts);
            }
          }
        }
      }
    });
  }

  var CONSTRUCTION_PROGRESS_OPTIONS = [
    { value: '착공전', label: '착공전 '},
    { value: '착공', label: '착공' },
    { value: '진행중', label: '진행중 '},
    { value: '완료', label: '완료 '}
  ];

  function getStageBadgeClass(progress) {
    var p = progress || '착공전';
    if (p === '착공') return 'started';
    if (p === '진행중') return 'progress';
    if (p === '완료') return 'done';
    return 'waiting';
  }

  var expandedConstructionId = null;

  function buildConstructionDetailContent(contractId) {
    var c = getContracts().find(function (x) { return x.id === contractId; });
    if (!c) return '';
    var startStr = formatDate(c.constructionStartDate);
    var endStr = formatDate(c.constructionEndDate);
    var stages = getConstructionStages(c);
    var escapedId = escapeAttr(contractId);
    var rows = stages.map(function (s) {
      var stageName = escapeAttr(s.name || '');
      var hasEnd = (s.endDate || '').trim() !== '';
      var hasMemo = (s.memo || '').trim() !== '';
      var rowClass = (hasEnd ? ' stage-row-completed' : '') + (hasMemo ? ' stage-row-has-memo' : '');
      return '<tr class="construction-stage-row' + rowClass + '" data-stage="' + stageName + '">' +
        '<td class="stage-name-cell">' + (s.name || '-') + '</td>' +
        '<td><input type="date" class="stage-start-date" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" value="' + escapeAttr(s.startDate || '') + '"></td>' +
        '<td><input type="date" class="stage-end-date" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" value="' + escapeAttr(s.endDate || '') + '"></td>' +
        '<td><input type="text" class="stage-manager" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="담당자" value="' + escapeAttr(s.responsibleName || '') + '"></td>' +
        '<td><input type="text" class="stage-worker-list" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="작업자 이름, 연락처" value="' + escapeAttr(s.workerList || '') + '"></td>' +
        '<td><input type="text" class="stage-phone" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="연락처" value="' + escapeAttr(s.responsiblePhone || '') + '"></td>' +
        '<td class="stage-cost-cell"><input type="number" class="stage-labor-cost" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="인건비(만원)" value="' + escapeAttr(s.laborCost || '') + '" min="0" step="1"></td>' +
        '<td class="stage-cost-cell"><input type="number" class="stage-extra-cost" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="기타 비용" value="' + escapeAttr(s.extraCost || '') + '" min="0" step="1"></td>' +
        '<td><textarea class="stage-memo" data-contract-id="' + escapedId + '" data-stage="' + stageName + '" placeholder="메모 및 특이사항" rows="2">' + escapeAttr(s.memo || '') + '</textarea></td>' +
        '</tr>';
    }).join('');
    return '<div class="construction-detail-inner">' +
      '<div class="construction-detail-header-inline"><strong class="construction-detail-customer-name">' + (c.customerName || '-') + '</strong>' +
      '<span class="construction-detail-dates-inline">시공 기간: ' + startStr + ' ~ ' + endStr + '</span>' +
      '<button type="button" class="btn btn-sm btn-secondary btn-open-contract-chat" data-contract-id="' + escapedId + '">팀 채팅</button>' +
      '<button type="button" class="btn btn-sm btn-secondary construction-detail-edit-btn" data-contract-id="' + escapedId + '">시공 정보 수정</button></div>' +
      '<div class="construction-detail-table-wrap">' +
      '<table class="data-table construction-detail-table"><thead><tr><th>공사 단계</th><th>시작 날짜</th><th>완료 날짜</th><th>담당자</th><th>작업자/연락처</th><th>연락처</th><th>인건비</th><th>기타비용</th><th>메모</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '</div></div>';
  }

  function insertConstructionDetailRowAfter(row, contractId) {
    var tbody = row.parentNode;
    var next = row.nextElementSibling;
    if (next && next.classList && next.classList.contains('construction-detail-row')) {
      next.remove();
    }
    var tr = document.createElement('tr');
    tr.className = 'construction-detail-row';
    tr.setAttribute('data-detail-for', contractId);
    var td = document.createElement('td');
    td.colSpan = 16;
    td.className = 'construction-detail-cell';
    td.innerHTML = buildConstructionDetailContent(contractId);
    tr.appendChild(td);
    tbody.insertBefore(tr, row.nextSibling);
  }

  function removeConstructionDetailRow(tbody) {
    var detail = tbody && tbody.querySelector('.construction-detail-row');
    if (detail) detail.remove();
  }

  var CONSTRUCTION_STAGE_NAMES = ['계약', '착공 준비', '기초 공사', '골조 공사', '외장 공사', '내장 공사', '마감 공사', '준공', '사후 관리'];

  function getConstructionStages(contract) {
    var arr = contract.constructionStages;
    if (!Array.isArray(arr)) {
      return CONSTRUCTION_STAGE_NAMES.map(function (name) {
        return { name: name, startDate: '', endDate: '', responsibleName: '', workerList: '', responsiblePhone: '', laborCost: '', extraCost: '', memo: '' };
      });
    }
    var byName = {};
    arr.forEach(function (s) { byName[s.name] = s; });
    return CONSTRUCTION_STAGE_NAMES.map(function (name) {
      var s = byName[name];
      return s ? {
        name: name,
        startDate: s.startDate || '',
        endDate: s.endDate || '',
        responsibleName: s.responsibleName || '',
        workerList: s.workerList || '',
        responsiblePhone: s.responsiblePhone || '',
        laborCost: s.laborCost != null ? String(s.laborCost) : '',
        extraCost: s.extraCost != null ? String(s.extraCost) : '',
        memo: s.memo || ''
      } : { name: name, startDate: '', endDate: '', responsibleName: '', workerList: '', responsiblePhone: '', laborCost: '', extraCost: '', memo: '' };
    });
  }

  function updateConstructionStageField(contractId, stageName, field, value) {
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    if (!Array.isArray(c.constructionStages)) c.constructionStages = [];
    var byName = {};
    c.constructionStages.forEach(function (s) { byName[s.name] = s; });
    var stage = byName[stageName];
    if (!stage) {
      stage = { name: stageName, startDate: '', endDate: '', responsibleName: '', workerList: '', responsiblePhone: '', laborCost: '', extraCost: '', memo: '' };
      c.constructionStages.push(stage);
    }
    stage[field] = value == null ? '' : String(value).trim();
    saveContracts(contracts);
  }

  // =====================================================================
  // 시공 업무일지
  // =====================================================================
  var CW_PROCESSES = ['기초', '골조', '단열', '외장', '창호', '전기', '설비', '내장', '마감', '완료'];
  var CW_PROCESS_COLOR = {
    '기초': 'cw-proc-foundation',
    '골조': 'cw-proc-frame',
    '단열': 'cw-proc-insulation',
    '외장': 'cw-proc-exterior',
    '창호': 'cw-proc-window',
    '전기': 'cw-proc-electric',
    '설비': 'cw-proc-plumbing',
    '내장': 'cw-proc-interior',
    '마감': 'cw-proc-finish',
    '완료': 'cw-proc-done'
  };

  function getConstructionWorklog() {
    try { return JSON.parse(localStorage.getItem(STORAGE_CONSTRUCTION_WORKLOG) || '[]'); } catch (e) { return []; }
  }
  function saveConstructionWorklog(list) {
    localStorage.setItem(STORAGE_CONSTRUCTION_WORKLOG, JSON.stringify(list));
  }

  function cwProgressBar(pct) {
    var p = Math.min(100, Math.max(0, Number(pct) || 0));
    var cls = p >= 100 ? 'cw-prog-done' : p >= 60 ? 'cw-prog-mid' : 'cw-prog-low';
    return '<div class="cw-progress-wrap"><div class="cw-progress-bar ' + cls + '" style="width:' + p + '%"></div></div>' +
           '<span class="cw-progress-pct">' + p + '%</span>';
  }

  function renderConstructionWorklog() {
    var logs = getConstructionWorklog();
    var keyword = ((document.getElementById('cw-search') || {}).value || '').toLowerCase();
    var processFilter = (document.getElementById('cw-process-filter') || {}).value || '';
    var issueFilter = (document.getElementById('cw-issue-filter') || {}).value || '';

    if (keyword) {
      logs = logs.filter(function (l) {
        return (l.siteName || '').toLowerCase().indexOf(keyword) !== -1;
      });
    }
    if (processFilter) {
      logs = logs.filter(function (l) { return l.process === processFilter; });
    }
    if (issueFilter === 'issues') {
      logs = logs.filter(function (l) { return l.issues && l.issues.trim(); });
    }

    // 날짜 내림차순
    logs = logs.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

    // 요약 카드 업데이트
    var allLogs = getConstructionWorklog();
    var today10 = new Date().toISOString().slice(0, 10);
    var sites = {};
    allLogs.forEach(function (l) {
      if (!l.siteName) return;
      if (!sites[l.siteName] || l.date > sites[l.siteName].date) sites[l.siteName] = l;
    });
    var siteArr = Object.values ? Object.values(sites) : Object.keys(sites).map(function(k){ return sites[k]; });
    var activeCount = siteArr.filter(function (l) { return l.process !== '완료'; }).length;
    var doneCount = siteArr.filter(function (l) { return l.process === '완료'; }).length;
    var issueCount = siteArr.filter(function (l) { return l.issues && l.issues.trim(); }).length;
    var todayCount = allLogs.filter(function (l) { return l.date === today10; }).length;
    var elA = document.getElementById('cw-count-active'); if (elA) elA.textContent = activeCount;
    var elD = document.getElementById('cw-count-done'); if (elD) elD.textContent = doneCount;
    var elI = document.getElementById('cw-count-issues'); if (elI) elI.textContent = issueCount;
    var elT = document.getElementById('cw-count-today'); if (elT) elT.textContent = todayCount;

    var tbody = document.getElementById('tbody-cw');
    if (!tbody) return;
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:2rem;">등록된 업무일지가 없습니다.</td></tr>';
      var fr = document.getElementById('cw-filter-result'); if (fr) fr.textContent = '0건';
      return;
    }

    tbody.innerHTML = logs.map(function (l) {
      var procClass = CW_PROCESS_COLOR[l.process] || '';
      var procBadge = '<span class="cw-proc-badge ' + procClass + '">' + escapeHtml(l.process || '-') + '</span>';
      var issueBadge = (l.issues && l.issues.trim())
        ? '<span class="cw-issue-badge">문제</span>'
        : '<span style="color:#9ca3af;">-</span>';
      var photoHtml = (l.photos && l.photos.length)
        ? '<span class="cw-photo-count-badge" data-id="' + escapeAttr(l.id) + '">' + l.photos.length + '장</span>'
        : '-';
      return '<tr>' +
        '<td>' + (l.date || '-') + '</td>' +
        '<td class="cw-site-cell">' + escapeHtml(l.siteName || '-') +
          (l.delayed ? ' <span class="cw-delay-badge">지연</span>' : '') + '</td>' +
        '<td>' + escapeHtml(l.address || '-') + '</td>' +
        '<td>' + procBadge + '</td>' +
        '<td class="cw-progress-cell">' + cwProgressBar(l.progress) + '</td>' +
        '<td style="text-align:center;">' + (l.crew || '-') + '명</td>' +
        '<td>' + issueBadge + '</td>' +
        '<td>' + photoHtml + '</td>' +
        '<td class="cw-action-cell">' +
          '<button type="button" class="btn btn-sm btn-secondary cw-edit-btn" data-id="' + escapeAttr(l.id) + '">수정</button> ' +
          '<button type="button" class="btn btn-sm cw-delete-btn" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;" data-id="' + escapeAttr(l.id) + '">삭제</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    var filterResult = document.getElementById('cw-filter-result');
    if (filterResult) filterResult.textContent = logs.length + '건';
  }

  var constructionWorklogInitialized = false;
  function initConstructionWorklogEvents() {
    if (constructionWorklogInitialized) return;
    constructionWorklogInitialized = true;

    var addBtn = document.getElementById('btn-add-cw');
    var formWrap = document.getElementById('cw-form-wrap');
    var cancelBtn = document.getElementById('btn-cancel-cw');
    var formTitle = document.getElementById('cw-form-title');
    var form = document.getElementById('form-cw');
    var editId = document.getElementById('cw-edit-id');

    function openForm(title) {
      if (formTitle) formTitle.textContent = title;
      if (formWrap) formWrap.classList.remove('hidden');
      var dateEl = document.getElementById('cw-date');
      if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    }
    function closeForm() {
      if (formWrap) formWrap.classList.add('hidden');
      if (form) form.reset();
      if (editId) editId.value = '';
      var preview = document.getElementById('cw-photo-preview');
      if (preview) preview.innerHTML = '';
      var photosData = document.getElementById('cw-photos-data');
      if (photosData) photosData.value = '';
      var photoCount = document.getElementById('cw-photo-count');
      if (photoCount) photoCount.textContent = '';
    }

    if (addBtn) addBtn.addEventListener('click', function () { openForm('업무 등록'); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeForm);

    // 사진 업로드 미리보기
    var photoInput = document.getElementById('cw-photos');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        var files = Array.prototype.slice.call(this.files || []);
        if (!files.length) return;
        var preview = document.getElementById('cw-photo-preview');
        var photosData = document.getElementById('cw-photos-data');
        var photoCount = document.getElementById('cw-photo-count');
        var existing = [];
        try { existing = JSON.parse((photosData && photosData.value) || '[]'); } catch (e) { existing = []; }
        var pending = files.length;
        files.forEach(function (f) {
          var reader = new FileReader();
          reader.onload = function (ev) {
            existing.push({ name: f.name, data: ev.target.result });
            pending--;
            if (pending === 0) {
              if (photosData) photosData.value = JSON.stringify(existing);
              if (photoCount) photoCount.textContent = existing.length + '장 선택됨';
              if (preview) {
                preview.innerHTML = existing.map(function (p) {
                  return '<img src="' + p.data + '" class="cw-photo-thumb" title="' + escapeAttr(p.name) + '" alt="' + escapeAttr(p.name) + '">';
                }).join('');
              }
            }
          };
          reader.readAsDataURL(f);
        });
        this.value = '';
      });
    }

    // 폼 저장
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var logs = getConstructionWorklog();
        var id = (editId && editId.value) || '';
        var photos = [];
        try { photos = JSON.parse((document.getElementById('cw-photos-data') || {}).value || '[]'); } catch (ex) { photos = []; }
        var entry = {
          id: id || id(),
          date: (document.getElementById('cw-date') || {}).value || '',
          siteName: (document.getElementById('cw-site-name') || {}).value || '',
          address: (document.getElementById('cw-address') || {}).value || '',
          process: (document.getElementById('cw-process') || {}).value || '',
          progress: (document.getElementById('cw-progress') || {}).value || '',
          crew: (document.getElementById('cw-crew') || {}).value || '',
          content: (document.getElementById('cw-content') || {}).value || '',
          special: (document.getElementById('cw-special') || {}).value || '',
          issues: (document.getElementById('cw-issues') || {}).value || '',
          tomorrow: (document.getElementById('cw-tomorrow') || {}).value || '',
          photos: photos,
          delayed: false
        };
        if (id) {
          var idx = logs.findIndex ? logs.findIndex(function (l) { return l.id === id; }) : -1;
          if (idx === -1) { for (var i = 0; i < logs.length; i++) { if (logs[i].id === id) { idx = i; break; } } }
          if (idx !== -1) {
            entry.photos = entry.photos.length ? entry.photos : (logs[idx].photos || []);
            logs[idx] = entry;
          }
        } else {
          logs.push(entry);
        }
        saveConstructionWorklog(logs);
        closeForm();
        renderConstructionWorklog();
        showToast(id ? '업무일지를 수정했습니다.' : '업무일지를 등록했습니다.', 'success');
      });
    }

    // 검색 / 필터
    var searchEl = document.getElementById('cw-search');
    var procFilter = document.getElementById('cw-process-filter');
    var issueFilter = document.getElementById('cw-issue-filter');
    if (searchEl) searchEl.addEventListener('input', renderConstructionWorklog);
    if (procFilter) procFilter.addEventListener('change', renderConstructionWorklog);
    if (issueFilter) issueFilter.addEventListener('change', renderConstructionWorklog);

    // 테이블 위임 (수정/삭제/사진보기)
    var tbody = document.getElementById('tbody-cw');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-id]') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        var logs = getConstructionWorklog();
        var log = null;
        for (var i = 0; i < logs.length; i++) { if (logs[i].id === id) { log = logs[i]; break; } }
        if (!log) return;

        if (btn.classList.contains('cw-edit-btn')) {
          openForm('업무 수정');
          document.getElementById('cw-edit-id').value = id;
          document.getElementById('cw-date').value = log.date || '';
          document.getElementById('cw-site-name').value = log.siteName || '';
          document.getElementById('cw-address').value = log.address || '';
          document.getElementById('cw-process').value = log.process || '';
          document.getElementById('cw-progress').value = log.progress || '';
          document.getElementById('cw-crew').value = log.crew || '';
          document.getElementById('cw-content').value = log.content || '';
          document.getElementById('cw-special').value = log.special || '';
          document.getElementById('cw-issues').value = log.issues || '';
          document.getElementById('cw-tomorrow').value = log.tomorrow || '';
          var photosData = document.getElementById('cw-photos-data');
          var photos = log.photos || [];
          if (photosData) photosData.value = JSON.stringify(photos);
          var photoCount = document.getElementById('cw-photo-count');
          if (photoCount) photoCount.textContent = photos.length ? photos.length + '장 첨부됨' : '';
          var preview = document.getElementById('cw-photo-preview');
          if (preview) {
            preview.innerHTML = photos.map(function (p) {
              return '<img src="' + (p.data || '') + '" class="cw-photo-thumb" title="' + escapeAttr(p.name || '') + '" alt="' + escapeAttr(p.name || '') + '">';
            }).join('');
          }
          formWrap.scrollIntoView({ behavior: 'smooth' });
        } else if (btn.classList.contains('cw-delete-btn') || btn.getAttribute('class') && btn.getAttribute('class').indexOf('cw-delete') !== -1) {
          if (!window.confirm('"' + escapeHtml(log.siteName) + '" 업무일지를 삭제하시겠습니까?')) return;
          var newLogs = logs.filter(function (l) { return l.id !== id; });
          saveConstructionWorklog(newLogs);
          renderConstructionWorklog();
          showToast('삭제했습니다.', 'info');
        } else if (btn.classList.contains('cw-photo-count-badge')) {
          var photos2 = log.photos || [];
          if (!photos2.length) return;
          var html = photos2.map(function (p) {
            return '<div style="margin-bottom:0.5rem;"><img src="' + (p.data || '') + '" style="max-width:100%;border-radius:6px;" alt="' + escapeAttr(p.name || '') + '"><div style="font-size:0.75rem;color:#9ca3af;margin-top:0.25rem;">' + escapeHtml(p.name || '') + '</div></div>';
          }).join('');
          var win = window.open('', '_blank', 'width=600,height=800,scrollbars=yes');
          if (win) { win.document.write('<body style="background:#1a1a2e;padding:1rem;">' + html + '</body>'); win.document.close(); }
        }
      });
    }
  }

  function renderConstruction() {
    var contracts = getContracts().filter(function (c) {
      return !!c.constructionStartOk;
    });
    contracts = filterByShowroom(contracts, 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    contracts = getFilteredConstructionContracts(contracts);
    var tbody = document.getElementById('tbody-construction');
    if (!tbody) return;
    var salesReadonly = isSalesReadonly();
    var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
    var userTeam = (cur && (cur.team || '').trim()) || '';
    var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
    tbody.innerHTML = contracts.map(function (c) {
      var deposit = paymentCellWithConfirm(c, 'deposit');
      var p1 = paymentCellWithConfirm(c, 'progress1');
      var p2 = paymentCellWithConfirm(c, 'progress2');
      var p3 = paymentCellWithConfirm(c, 'progress3');
      var balance = paymentCellWithConfirm(c, 'balance');
      var progress = c.constructionProgress || '착공전';
      var stageBadgeClass = getStageBadgeClass(progress);
      var stageLabel = CONSTRUCTION_PROGRESS_OPTIONS.find(function (o) { return o.value === progress; });
      stageLabel = stageLabel ? stageLabel.label : progress;
      var progressSelect = '<select class="construction-progress-select stage-select" data-id="' + c.id + '"' + (salesReadonly ? ' disabled' : '') + '>' + CONSTRUCTION_PROGRESS_OPTIONS.map(function (o) {
        var sel = progress === o.value ? ' selected' : '';
        return '<option value="' + o.value + '"' + sel + '>' + o.label + '</option>';
      }).join('') + '</select>';
      var stageCell = '<div class="construction-stage-inner"><span class="stage-badge ' + stageBadgeClass + '">' + stageLabel + '</span>' + progressSelect + '</div>';
      var stagesBtn = salesReadonly ? '' : '<button type="button" class="btn btn-sm btn-secondary" data-construction-stages="' + c.id + '">단계 관리</button>';
      var summary = paymentSummaryHtml(c);
      var managerInput = '<input type="text" class="construction-manager-input" data-contract-id="' + escapeAttr(c.id) + '" value="' + escapeAttr(c.constructionManager || '') + '" placeholder="담당자명"' + (salesReadonly ? ' disabled' : '') + '>';
      var deleteBtn = ' <button type="button" class="btn btn-sm btn-secondary btn-contract-delete" data-contract-id="' + escapeAttr(c.id) + '">삭제</button>';
      var contractDateStr = formatDate(c.contractDate);
      var shortAddrC = (function() { var a = c.siteAddress || ''; if (!a) return '-'; var p = a.trim().split(/\s+/); return p.slice(0, 2).join(' '); })();
      var _cDivisor = c.amountUnit === 'manwon' ? 1 : 10000;
      return '<tr class="construction-row" data-contract-id="' + c.id + '"><td>' + getShowroomName(c.showroomId) + '</td><td>' + contractDateStr + '</td><td>' + (c.customerName || '-') + '</td><td>' + shortAddrC + '</td><td>' + (c.salesPerson || '-') + '</td><td>' + (c.designPermitDesigner || c.designContactName || '-') + '</td><td class="construction-manager-cell">' + managerInput + '</td><td>' + formatMoney(Math.round(Number(c.totalAmount) / _cDivisor)) + '만원</td><td class="payment-summary-cell">' + summary + '</td><td class="payment-cell">' + deposit + '</td><td class="payment-cell">' + p1 + '</td><td class="payment-cell">' + p2 + '</td><td class="payment-cell">' + p3 + '</td><td class="payment-cell">' + balance + '</td><td class="construction-stage-cell">' + stageCell + '</td><td>' + stagesBtn + deleteBtn + '</td></tr>';
    }).join('') || (getConstructionSearchKeyword()
      ? '<tr><td colspan="16" class="no-result-msg">검색 결과가 없습니다.</td></tr>'
      : '<tr><td colspan="16">시공 데이터가 없습니다.</td></tr>');
    updateConstructionFilterResult(contracts);
    if (expandedConstructionId) {
      var expandedRow = tbody.querySelector('.construction-row[data-contract-id="' + expandedConstructionId + '"]');
      if (expandedRow) {
        insertConstructionDetailRowAfter(expandedRow, expandedConstructionId);
        expandedRow.classList.add('construction-row-expanded');
      } else {
        expandedConstructionId = null;
      }
    }
  }

  // =====================================================================
  // 발주팀 - 업체 템플릿 & 상수
  // =====================================================================
  var PROCUREMENT_VENDORS = [
    { name: '삼원목재', materials: ['다루끼', '투바이', '석고보드', '방수석고', '편백루바', 'OSB합판', '타이벡', '몰딩', '코너몰딩', '바닥피스', '직결피스'] },
    { name: '로자메탈사이딩', materials: ['타카핀', 'ST', 'DT', 'T', 'F'] },
    { name: '철물자재', materials: ['단열방화문', '고무바킹', '실리콘', '우레탄폼', '감바천', '자바라', '디지털도어락', '레바키', '크레인고리'] },
    { name: '대한전기', materials: ['분전함', '통신함', '환풍기', '화재감지기', '콘센트', '스위치', '전선', '조명'] },
    { name: '장원EPS', materials: ['스티로폼', 'EPS'] }
  ];
  var ORDER_STATUS_OPTIONS = ['발주전', '발주완료', '입고완료', '현장투입'];
  var activeProcurementSiteId = '';
  var activeVendorName = '';

  // =====================================================================
  // 발주팀 - Storage Helpers
  // =====================================================================
  function getProcurementMaterials() { try { return JSON.parse(localStorage.getItem(STORAGE_PROCUREMENT_MATERIALS) || '[]'); } catch (e) { return []; } }
  function saveProcurementMaterials(list) { localStorage.setItem(STORAGE_PROCUREMENT_MATERIALS, JSON.stringify(list)); }
  function getProcurementSites() { try { return JSON.parse(localStorage.getItem(STORAGE_PROCUREMENT_SITES) || '[]'); } catch (e) { return []; } }
  function saveProcurementSites(list) { localStorage.setItem(STORAGE_PROCUREMENT_SITES, JSON.stringify(list)); }
  function getProcurementOrderItems() { try { return JSON.parse(localStorage.getItem(STORAGE_PROCUREMENT_ORDER_ITEMS) || '[]'); } catch (e) { return []; } }
  function saveProcurementOrderItems(list) { localStorage.setItem(STORAGE_PROCUREMENT_ORDER_ITEMS, JSON.stringify(list)); }
  function getProcurementStdQty() { try { return JSON.parse(localStorage.getItem(STORAGE_PROCUREMENT_STD_QTY) || '[]'); } catch (e) { return []; } }
  function saveProcurementStdQty(list) { localStorage.setItem(STORAGE_PROCUREMENT_STD_QTY, JSON.stringify(list)); }

  // =====================================================================
  // 발주팀 - 발주 항목 자동 생성 (현장 생성 시)
  // =====================================================================
  function generateOrderItemsForSite(site) {
    var existing = getProcurementOrderItems().filter(function (it) { return it.siteId === site.id; });
    if (existing.length) return;
    var stdQtys = getProcurementStdQty().filter(function (sq) { return sq.modelName === site.modelName; });
    var newItems = [];
    if (stdQtys.length) {
      stdQtys.forEach(function (sq) {
        newItems.push({ id: id(), siteId: site.id, vendorName: sq.vendorName, materialName: sq.materialName, spec: sq.spec || '', standardQty: sq.quantity || 0, actualQty: null, unit: sq.unit || '', memo: '', status: '발주전' });
      });
    } else {
      PROCUREMENT_VENDORS.forEach(function (v) {
        v.materials.forEach(function (mat) {
          newItems.push({ id: id(), siteId: site.id, vendorName: v.name, materialName: mat, spec: '', standardQty: 0, actualQty: null, unit: '', memo: '', status: '발주전' });
        });
      });
    }
    saveProcurementOrderItems(getProcurementOrderItems().concat(newItems));
  }

  // =====================================================================
  // 발주팀 - Tab: 현장발주
  // =====================================================================
  function renderFieldOrderTab() {
    var sites = getProcurementSites();
    var tbody = document.getElementById('tbody-field-orders');
    if (!tbody) return;
    tbody.innerHTML = sites.map(function (s) {
      return '<tr>' +
        '<td><a href="#" class="po-site-link" data-site-id="' + escapeAttr(s.id) + '">' + escapeHtml(s.siteName) + '</a></td>' +
        '<td>' + escapeHtml(s.modelName) + '</td>' +
        '<td>' + (s.pyeong || '-') + '평</td>' +
        '<td>' + escapeHtml(s.siteAddress || '-') + '</td>' +
        '<td>' + escapeHtml(s.foremanName || '-') + '</td>' +
        '<td>' + escapeHtml(s.foremanPhone || '-') + '</td>' +
        '<td>' + escapeHtml(s.manager || '-') + '</td>' +
        '<td>' + (s.orderDate || '-') + '</td>' +
        '<td>' +
          '<button type="button" class="btn btn-sm btn-secondary btn-edit-field-order" data-id="' + escapeAttr(s.id) + '">수정</button> ' +
          '<button type="button" class="btn btn-sm btn-danger btn-delete-field-order" data-id="' + escapeAttr(s.id) + '">삭제</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="9" class="no-result-msg">현장 발주 데이터가 없습니다. 새 현장 발주를 생성하세요.</td></tr>';
  }

  // =====================================================================
  // 발주팀 - Tab: 업체별발주
  // =====================================================================
  function renderVendorOrderTab() {
    var sites = getProcurementSites();
    var sel = document.getElementById('vendor-site-selector');
    if (sel) {
      var prevVal = activeProcurementSiteId || sel.value;
      sel.innerHTML = '<option value="">현장 선택</option>' + sites.map(function (s) {
        return '<option value="' + escapeAttr(s.id) + '"' + (prevVal === s.id ? ' selected' : '') + '>' +
          escapeHtml(s.siteName) + ' (' + escapeHtml(s.modelName) + ' ' + (s.pyeong || '-') + '평)</option>';
      }).join('');
      if (!activeProcurementSiteId && sel.value) activeProcurementSiteId = sel.value;
    }
    renderVendorCards();
  }

  function renderVendorCards() {
    var grid = document.getElementById('vendor-card-grid');
    if (!grid) return;
    var siteId = activeProcurementSiteId;
    var allItems = getProcurementOrderItems().filter(function (it) { return it.siteId === siteId; });
    grid.innerHTML = PROCUREMENT_VENDORS.map(function (v) {
      var vendorItems = allItems.filter(function (it) { return it.vendorName === v.name; });
      var total = vendorItems.length;
      var ordered = vendorItems.filter(function (it) { return it.status !== '발주전'; }).length;
      var statusClass = !siteId ? 'vendor-card-disabled' :
        ordered === total && total > 0 ? 'vendor-card-done' :
        ordered > 0 ? 'vendor-card-partial' : 'vendor-card-pending';
      return '<div class="vendor-card ' + statusClass + '" data-vendor="' + escapeAttr(v.name) + '">' +
        '<div class="vendor-card-name">' + escapeHtml(v.name) + '</div>' +
        '<div class="vendor-card-count">' + (siteId ? (ordered + '/' + total + ' 발주') : '현장 선택') + '</div>' +
        '</div>';
    }).join('');
  }

  function renderVendorItems(siteId, vendorName) {
    var detail = document.getElementById('vendor-order-detail');
    var nameEl = document.getElementById('vendor-order-vendor-name');
    if (!detail || !nameEl) return;
    if (!siteId) { detail.classList.add('hidden'); return; }
    detail.classList.remove('hidden');
    nameEl.textContent = vendorName + ' - 발주 목록';
    var items = getProcurementOrderItems().filter(function (it) {
      return it.siteId === siteId && it.vendorName === vendorName;
    });
    var tbody = document.getElementById('tbody-vendor-order-items');
    if (!tbody) return;
    tbody.innerHTML = items.map(function (item) {
      var statusSel = '<select class="vendor-item-status-select procurement-status-select" data-id="' + escapeAttr(item.id) + '">' +
        ORDER_STATUS_OPTIONS.map(function (s) {
          return '<option value="' + s + '"' + (item.status === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('') + '</select>';
      return '<tr>' +
        '<td>' + escapeHtml(item.materialName) + '</td>' +
        '<td><input type="text" class="vendor-item-spec-input" data-id="' + escapeAttr(item.id) + '" value="' + escapeAttr(item.spec || '') + '" placeholder="규격" style="width:80px;"></td>' +
        '<td class="text-right">' + (item.standardQty || 0) + '</td>' +
        '<td><input type="number" class="vendor-item-qty-input" data-id="' + escapeAttr(item.id) + '" value="' + (item.actualQty != null ? item.actualQty : '') + '" placeholder="-" min="0" step="0.01" style="width:70px;"></td>' +
        '<td><input type="text" class="vendor-item-unit-input" data-id="' + escapeAttr(item.id) + '" value="' + escapeAttr(item.unit || '') + '" placeholder="단위" style="width:55px;"></td>' +
        '<td>' + statusSel + '</td>' +
        '<td><input type="text" class="vendor-item-memo-input" data-id="' + escapeAttr(item.id) + '" value="' + escapeAttr(item.memo || '') + '" placeholder="비고" style="width:100px;"></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="no-result-msg">발주 항목이 없습니다.</td></tr>';
  }

  // =====================================================================
  // 발주팀 - Tab: 기준수량관리
  // =====================================================================
  function renderStdQtyTab() {
    var stdQtys = getProcurementStdQty();
    var modelFilter = ((document.getElementById('sq-model-filter') || {}).value || '').toLowerCase();
    var vendorFilter = (document.getElementById('sq-vendor-filter') || {}).value || '';
    if (modelFilter) stdQtys = stdQtys.filter(function (sq) { return (sq.modelName || '').toLowerCase().indexOf(modelFilter) !== -1; });
    if (vendorFilter) stdQtys = stdQtys.filter(function (sq) { return sq.vendorName === vendorFilter; });
    var groups = {};
    stdQtys.forEach(function (sq) {
      var key = (sq.modelName || '') + '||' + (sq.vendorName || '');
      if (!groups[key]) groups[key] = { modelName: sq.modelName, vendorName: sq.vendorName, items: [] };
      groups[key].items.push(sq);
    });
    var container = document.getElementById('std-qty-list');
    if (!container) return;
    var keys = Object.keys(groups);
    if (!keys.length) { container.innerHTML = '<p class="no-result-msg">기준 수량 데이터가 없습니다.</p>'; return; }
    container.innerHTML = keys.map(function (k) {
      var g = groups[k];
      var rows = g.items.map(function (sq) {
        return '<tr>' +
          '<td>' + escapeHtml(sq.materialName || '-') + '</td>' +
          '<td>' + escapeHtml(sq.spec || '-') + '</td>' +
          '<td class="text-right">' + (sq.quantity || 0) + '</td>' +
          '<td>' + escapeHtml(sq.unit || '-') + '</td>' +
          '<td><button type="button" class="btn btn-sm btn-danger btn-delete-std-qty" data-id="' + escapeAttr(sq.id) + '">삭제</button></td>' +
          '</tr>';
      }).join('');
      return '<div class="procurement-model-group">' +
        '<div class="procurement-model-header">' +
          '<strong>' + escapeHtml(g.modelName) + '</strong>' +
          '<span class="procurement-model-meta">' + escapeHtml(g.vendorName) + '</span>' +
          '<span class="procurement-model-cost">' + g.items.length + '개 자재</span>' +
        '</div>' +
        '<div class="table-wrap"><table class="data-table">' +
          '<thead><tr><th>자재명</th><th>규격</th><th>기준 수량</th><th>단위</th><th>작업</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div></div>';
    }).join('');
  }

  function populateSqMaterialSelect(vendorName) {
    var sel = document.getElementById('sq-material');
    if (!sel) return;
    var v = PROCUREMENT_VENDORS.find(function (vv) { return vv.name === vendorName; });
    sel.innerHTML = '<option value="">자재 선택</option>' + (v ? v.materials : []).map(function (m) {
      return '<option value="' + escapeAttr(m) + '">' + escapeHtml(m) + '</option>';
    }).join('');
  }

  // =====================================================================
  // 발주팀 - Tab: 자재관리
  // =====================================================================
  function renderMaterialsTab() {
    var materials = getProcurementMaterials();
    var keyword = ((document.getElementById('material-search') || {}).value || '').toLowerCase();
    var vendorFilter = (document.getElementById('material-vendor-filter') || {}).value || '';
    if (keyword) materials = materials.filter(function (m) {
      return (m.name || '').toLowerCase().indexOf(keyword) !== -1 || (m.vendor || '').toLowerCase().indexOf(keyword) !== -1;
    });
    if (vendorFilter) materials = materials.filter(function (m) { return m.vendor === vendorFilter; });
    var tbody = document.getElementById('tbody-materials');
    if (!tbody) return;
    tbody.innerHTML = materials.map(function (m) {
      return '<tr>' +
        '<td>' + escapeHtml(m.name || '') + '</td>' +
        '<td>' + escapeHtml(m.vendor || '-') + '</td>' +
        '<td>' + escapeHtml(m.unit || '-') + '</td>' +
        '<td>' + escapeHtml(m.spec || '-') + '</td>' +
        '<td class="text-right">' + (m.price ? formatMoney(m.price) + '원' : '-') + '</td>' +
        '<td>' +
          '<button type="button" class="btn btn-sm btn-secondary btn-edit-material" data-id="' + escapeAttr(m.id) + '">수정</button> ' +
          '<button type="button" class="btn btn-sm btn-danger btn-delete-material" data-id="' + escapeAttr(m.id) + '">삭제</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="no-result-msg">자재 데이터가 없습니다.</td></tr>';
  }

  // =====================================================================
  // 발주팀 - Tab: 평당자재분석
  // =====================================================================
  function renderPyeongAnalysisTab() {
    var stdQtys = getProcurementStdQty();
    var sel = document.getElementById('pyeong-model-select');
    if (sel) {
      var models = [];
      stdQtys.forEach(function (sq) { if (models.indexOf(sq.modelName) === -1) models.push(sq.modelName); });
      var prevVal = sel.value;
      sel.innerHTML = '<option value="">모델 선택</option>' + models.map(function (m) {
        return '<option value="' + escapeAttr(m) + '"' + (prevVal === m ? ' selected' : '') + '>' + escapeHtml(m) + '</option>';
      }).join('');
    }
    renderPyeongAnalysisResult(sel ? sel.value : '');
  }

  function renderPyeongAnalysisResult(modelName) {
    var el = document.getElementById('pyeong-analysis-result');
    if (!el) return;
    if (!modelName) { el.innerHTML = '<p class="no-result-msg">모델을 선택하세요.</p>'; return; }
    var stdQtys = getProcurementStdQty().filter(function (sq) { return sq.modelName === modelName; });
    var sites = getProcurementSites().filter(function (s) { return s.modelName === modelName; });
    var pyeong = sites.length ? sites[0].pyeong : 0;
    if (!stdQtys.length) { el.innerHTML = '<p class="no-result-msg">해당 모델의 기준 수량이 없습니다.</p>'; return; }
    var vendorGroups = {};
    stdQtys.forEach(function (sq) {
      if (!vendorGroups[sq.vendorName]) vendorGroups[sq.vendorName] = [];
      vendorGroups[sq.vendorName].push(sq);
    });
    el.innerHTML = Object.keys(vendorGroups).map(function (vName) {
      var items = vendorGroups[vName];
      var rows = items.map(function (sq) {
        var perPyeong = pyeong > 0 ? (sq.quantity / pyeong).toFixed(2) : '-';
        return '<tr>' +
          '<td>' + escapeHtml(sq.materialName) + '</td>' +
          '<td>' + escapeHtml(sq.unit || '-') + '</td>' +
          '<td class="text-right">' + (sq.quantity || 0) + '</td>' +
          '<td class="text-right procurement-highlight">' + perPyeong + (pyeong > 0 ? ' / 평' : '') + '</td>' +
          '</tr>';
      }).join('');
      return '<div class="procurement-model-group" style="margin-bottom:1rem;">' +
        '<div class="procurement-model-header">' +
          '<strong>' + escapeHtml(vName) + '</strong>' +
          (pyeong ? '<span class="procurement-model-meta">' + escapeHtml(modelName) + ' ' + pyeong + '평 기준</span>' : '') +
        '</div>' +
        '<div class="table-wrap"><table class="data-table">' +
          '<thead><tr><th>자재명</th><th>단위</th><th>기준 수량</th><th>평당 사용량</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div></div>';
    }).join('');
  }

  // =====================================================================
  // 발주팀 - Tab: 발주서출력
  // =====================================================================
  function renderOrderPrintTab() {
    var sites = getProcurementSites();
    var siteSel = document.getElementById('print-site-select');
    if (siteSel) {
      var prevVal = siteSel.value;
      siteSel.innerHTML = '<option value="">현장 선택</option>' + sites.map(function (s) {
        return '<option value="' + escapeAttr(s.id) + '"' + (prevVal === s.id ? ' selected' : '') + '>' + escapeHtml(s.siteName) + '</option>';
      }).join('');
      if (prevVal) siteSel.value = prevVal;
    }
    renderOrderPrintPreview();
  }

  function renderOrderPrintPreview() {
    var siteId = (document.getElementById('print-site-select') || {}).value || '';
    var vendorName = (document.getElementById('print-vendor-select') || {}).value || '';
    var el = document.getElementById('order-print-preview');
    if (!el) return;
    if (!siteId || !vendorName) {
      el.innerHTML = '<p class="no-result-msg">현장과 업체를 선택하면 발주서 미리보기가 표시됩니다.</p>';
      return;
    }
    var site = getProcurementSites().find(function (s) { return s.id === siteId; });
    if (!site) { el.innerHTML = '<p class="no-result-msg">현장 정보를 찾을 수 없습니다.</p>'; return; }
    var items = getProcurementOrderItems().filter(function (it) { return it.siteId === siteId && it.vendorName === vendorName; });
    var today = new Date();
    var dateStr = site.orderDate || (today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
    var rowsHtml = items.map(function (item, i) {
      var qty = item.actualQty != null ? item.actualQty : item.standardQty;
      return '<tr>' +
        '<td style="text-align:center;">' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(item.materialName) + '</td>' +
        '<td>' + escapeHtml(item.spec || '') + '</td>' +
        '<td style="text-align:center;">' + (qty || '') + '</td>' +
        '<td>' + escapeHtml(item.unit || '') + '</td>' +
        '<td>' + escapeHtml(item.memo || '') + '</td>' +
        '</tr>';
    }).join('');
    el.innerHTML =
      '<div class="order-form-sheet" id="order-form-printable">' +
        '<div class="order-form-title">자  재  발  주  서</div>' +
        '<div class="order-form-meta-grid">' +
          '<div class="order-form-meta-row"><span class="order-form-label">발주업체</span><span class="order-form-value">' + escapeHtml(vendorName) + '</span></div>' +
          '<div class="order-form-meta-row"><span class="order-form-label">현장주소</span><span class="order-form-value">' + escapeHtml(site.siteAddress || '-') + '</span></div>' +
          '<div class="order-form-meta-row"><span class="order-form-label">발 주 일</span><span class="order-form-value">' + dateStr + '</span></div>' +
          '<div class="order-form-meta-row"><span class="order-form-label">반  장</span><span class="order-form-value">' + escapeHtml(site.foremanName || '-') + '</span></div>' +
          '<div class="order-form-meta-row"><span class="order-form-label">연락처</span><span class="order-form-value">' + escapeHtml(site.foremanPhone || '-') + '</span></div>' +
          '<div class="order-form-meta-row"><span class="order-form-label">담당자</span><span class="order-form-value">' + escapeHtml(site.manager || '-') + '</span></div>' +
        '</div>' +
        '<table class="order-form-table">' +
          '<thead><tr><th style="width:5%">No.</th><th style="width:30%">품목</th><th style="width:25%">규격</th><th style="width:12%">수량</th><th style="width:10%">단위</th><th style="width:18%">비고</th></tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '<div class="order-form-footer">모델명: ' + escapeHtml(site.modelName || '-') + '  /  ' + (site.pyeong || '-') + '평</div>' +
      '</div>';
  }

  // =====================================================================
  // 발주팀 - Main Render & Event Init
  // =====================================================================
  var procurementInitialized = false;

  function renderProcurement() {
    renderFieldOrderTab();
    renderVendorOrderTab();
    renderStdQtyTab();
    renderMaterialsTab();
    renderPyeongAnalysisTab();
    renderOrderPrintTab();
    if (!procurementInitialized) {
      procurementInitialized = true;
      initProcurementEvents();
    }
  }

  function initProcurementEvents() {
    // ---- 탭 전환 ----
    document.querySelectorAll('.procurement-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.procurement-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.procurement-tab-panel').forEach(function (p) { p.classList.add('hidden'); p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = document.getElementById('procurement-tab-' + btn.getAttribute('data-tab'));
        if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
        var tab = btn.getAttribute('data-tab');
        if (tab === 'vendor-order') renderVendorOrderTab();
        if (tab === 'std-qty') renderStdQtyTab();
        if (tab === 'pyeong-analysis') renderPyeongAnalysisTab();
        if (tab === 'print') renderOrderPrintTab();
      });
    });

    // ---- 현장발주 ----
    var btnNewFO = document.getElementById('btn-new-field-order');
    if (btnNewFO) btnNewFO.addEventListener('click', function () {
      document.getElementById('field-order-edit-id').value = '';
      document.getElementById('form-field-order').reset();
      document.getElementById('field-order-form-wrap').classList.remove('hidden');
    });
    var btnCancelFO = document.getElementById('btn-cancel-field-order');
    if (btnCancelFO) btnCancelFO.addEventListener('click', function () {
      document.getElementById('field-order-form-wrap').classList.add('hidden');
    });
    var formFO = document.getElementById('form-field-order');
    if (formFO) formFO.addEventListener('submit', function (e) {
      e.preventDefault();
      var editId = document.getElementById('field-order-edit-id').value;
      var siteData = {
        siteName: document.getElementById('fo-site-name').value.trim(),
        modelName: document.getElementById('fo-model-name').value.trim(),
        pyeong: parseFloat(document.getElementById('fo-pyeong').value) || 0,
        siteAddress: document.getElementById('fo-address').value.trim(),
        foremanName: document.getElementById('fo-foreman').value.trim(),
        foremanPhone: document.getElementById('fo-foreman-phone').value.trim(),
        manager: document.getElementById('fo-manager').value.trim(),
        orderDate: document.getElementById('fo-order-date').value,
        createdAt: new Date().toISOString()
      };
      if (!siteData.siteName || !siteData.modelName) return;
      var sites = getProcurementSites();
      if (editId) {
        sites = sites.map(function (s) { return s.id === editId ? Object.assign({}, s, siteData) : s; });
        saveProcurementSites(sites);
      } else {
        siteData.id = id();
        sites.push(siteData);
        saveProcurementSites(sites);
        generateOrderItemsForSite(siteData);
      }
      document.getElementById('field-order-form-wrap').classList.add('hidden');
      renderFieldOrderTab();
      showToast(editId ? '수정됐습니다.' : '현장 발주가 생성됐습니다. 업체별발주 탭에서 자재를 확인하세요.');
    });

    var tbodyFO = document.getElementById('tbody-field-orders');
    if (tbodyFO) tbodyFO.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.btn-edit-field-order');
      var delBtn = e.target.closest('.btn-delete-field-order');
      var siteLink = e.target.closest('.po-site-link');
      if (siteLink) {
        e.preventDefault();
        activeProcurementSiteId = siteLink.getAttribute('data-site-id');
        document.querySelectorAll('.procurement-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.procurement-tab-panel').forEach(function (p) { p.classList.add('hidden'); p.classList.remove('active'); });
        var vBtn = document.querySelector('.procurement-tab-btn[data-tab="vendor-order"]');
        if (vBtn) vBtn.classList.add('active');
        var vPanel = document.getElementById('procurement-tab-vendor-order');
        if (vPanel) { vPanel.classList.remove('hidden'); vPanel.classList.add('active'); }
        renderVendorOrderTab();
      }
      if (editBtn) {
        var sid = editBtn.getAttribute('data-id');
        var site = getProcurementSites().find(function (s) { return s.id === sid; });
        if (!site) return;
        document.getElementById('field-order-edit-id').value = site.id;
        document.getElementById('fo-site-name').value = site.siteName || '';
        document.getElementById('fo-model-name').value = site.modelName || '';
        document.getElementById('fo-pyeong').value = site.pyeong || '';
        document.getElementById('fo-address').value = site.siteAddress || '';
        document.getElementById('fo-foreman').value = site.foremanName || '';
        document.getElementById('fo-foreman-phone').value = site.foremanPhone || '';
        document.getElementById('fo-manager').value = site.manager || '';
        document.getElementById('fo-order-date').value = site.orderDate || '';
        document.getElementById('field-order-form-wrap').classList.remove('hidden');
      }
      if (delBtn) {
        if (!confirm('현장 발주를 삭제하면 발주 항목도 모두 삭제됩니다.')) return;
        var did = delBtn.getAttribute('data-id');
        saveProcurementSites(getProcurementSites().filter(function (s) { return s.id !== did; }));
        saveProcurementOrderItems(getProcurementOrderItems().filter(function (it) { return it.siteId !== did; }));
        if (activeProcurementSiteId === did) activeProcurementSiteId = '';
        renderFieldOrderTab();
        showToast('삭제됐습니다.');
      }
    });

    // ---- 업체별발주 ----
    var vendorSiteSel = document.getElementById('vendor-site-selector');
    if (vendorSiteSel) vendorSiteSel.addEventListener('change', function () {
      activeProcurementSiteId = vendorSiteSel.value;
      activeVendorName = '';
      document.getElementById('vendor-order-detail').classList.add('hidden');
      renderVendorCards();
    });

    var vendorGrid = document.getElementById('vendor-card-grid');
    if (vendorGrid) vendorGrid.addEventListener('click', function (e) {
      var card = e.target.closest('.vendor-card');
      if (!card) return;
      if (!activeProcurementSiteId) { showToast('현장을 먼저 선택하세요.', 'error'); return; }
      activeVendorName = card.getAttribute('data-vendor');
      renderVendorItems(activeProcurementSiteId, activeVendorName);
    });

    var btnCloseVD = document.getElementById('btn-close-vendor-detail');
    if (btnCloseVD) btnCloseVD.addEventListener('click', function () {
      document.getElementById('vendor-order-detail').classList.add('hidden');
      activeVendorName = '';
    });

    var btnPrintVO = document.getElementById('btn-print-vendor-order');
    if (btnPrintVO) btnPrintVO.addEventListener('click', function () {
      document.querySelectorAll('.procurement-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.procurement-tab-panel').forEach(function (p) { p.classList.add('hidden'); p.classList.remove('active'); });
      var pBtn = document.querySelector('.procurement-tab-btn[data-tab="print"]');
      if (pBtn) pBtn.classList.add('active');
      var pPanel = document.getElementById('procurement-tab-print');
      if (pPanel) { pPanel.classList.remove('hidden'); pPanel.classList.add('active'); }
      renderOrderPrintTab();
      setTimeout(function () {
        var pss = document.getElementById('print-site-select');
        var pvs = document.getElementById('print-vendor-select');
        if (pss) pss.value = activeProcurementSiteId;
        if (pvs) pvs.value = activeVendorName;
        renderOrderPrintPreview();
      }, 50);
    });

    // 발주 항목 인라인 편집 (이벤트 위임)
    var vendorDetail = document.getElementById('vendor-order-detail');
    if (vendorDetail) {
      vendorDetail.addEventListener('change', function (e) {
        var statusSel = e.target.closest('.vendor-item-status-select');
        if (statusSel) {
          var iid = statusSel.getAttribute('data-id');
          saveProcurementOrderItems(getProcurementOrderItems().map(function (it) {
            return it.id === iid ? Object.assign({}, it, { status: statusSel.value }) : it;
          }));
          renderVendorCards();
          showToast('상태가 변경됐습니다.');
        }
      });
      vendorDetail.addEventListener('blur', function (e) {
        var qtyInput = e.target.closest('.vendor-item-qty-input');
        var specInput = e.target.closest('.vendor-item-spec-input');
        var unitInput = e.target.closest('.vendor-item-unit-input');
        var memoInput = e.target.closest('.vendor-item-memo-input');
        var target = qtyInput || specInput || unitInput || memoInput;
        if (!target) return;
        var iid = target.getAttribute('data-id');
        saveProcurementOrderItems(getProcurementOrderItems().map(function (it) {
          if (it.id !== iid) return it;
          var upd = Object.assign({}, it);
          if (qtyInput) upd.actualQty = parseFloat(qtyInput.value) || 0;
          if (specInput) upd.spec = specInput.value;
          if (unitInput) upd.unit = unitInput.value;
          if (memoInput) upd.memo = memoInput.value;
          return upd;
        }));
      }, true);
    }

    // ---- 기준수량관리 ----
    var btnAddSQ = document.getElementById('btn-add-std-qty');
    if (btnAddSQ) btnAddSQ.addEventListener('click', function () {
      document.getElementById('std-qty-edit-id').value = '';
      document.getElementById('form-std-qty').reset();
      populateSqMaterialSelect('');
      document.getElementById('std-qty-form-wrap').classList.remove('hidden');
    });
    var btnCancelSQ = document.getElementById('btn-cancel-std-qty');
    if (btnCancelSQ) btnCancelSQ.addEventListener('click', function () {
      document.getElementById('std-qty-form-wrap').classList.add('hidden');
    });
    var sqVendorSel = document.getElementById('sq-vendor');
    if (sqVendorSel) sqVendorSel.addEventListener('change', function () {
      populateSqMaterialSelect(sqVendorSel.value);
    });
    var formSQ = document.getElementById('form-std-qty');
    if (formSQ) formSQ.addEventListener('submit', function (e) {
      e.preventDefault();
      var modelName = document.getElementById('sq-model').value.trim();
      var vendorName = document.getElementById('sq-vendor').value;
      var materialName = document.getElementById('sq-material').value;
      var qty = parseFloat(document.getElementById('sq-qty').value) || 0;
      var unit = document.getElementById('sq-unit').value.trim();
      var spec = document.getElementById('sq-spec').value.trim();
      if (!modelName || !vendorName || !materialName) return;
      var list = getProcurementStdQty();
      list.push({ id: id(), modelName: modelName, vendorName: vendorName, materialName: materialName, quantity: qty, unit: unit, spec: spec });
      saveProcurementStdQty(list);
      document.getElementById('std-qty-form-wrap').classList.add('hidden');
      renderStdQtyTab();
      showToast('기준 수량이 저장됐습니다.');
    });
    var sqModelFilter = document.getElementById('sq-model-filter');
    if (sqModelFilter) sqModelFilter.addEventListener('input', renderStdQtyTab);
    var sqVendorFilter = document.getElementById('sq-vendor-filter');
    if (sqVendorFilter) sqVendorFilter.addEventListener('change', renderStdQtyTab);
    var stdQtyList = document.getElementById('std-qty-list');
    if (stdQtyList) stdQtyList.addEventListener('click', function (e) {
      var delBtn = e.target.closest('.btn-delete-std-qty');
      if (delBtn) {
        if (!confirm('기준 수량을 삭제하시겠습니까?')) return;
        saveProcurementStdQty(getProcurementStdQty().filter(function (sq) { return sq.id !== delBtn.getAttribute('data-id'); }));
        renderStdQtyTab();
        showToast('삭제됐습니다.');
      }
    });

    // ---- 자재관리 ----
    var btnAddMat = document.getElementById('btn-add-material');
    if (btnAddMat) btnAddMat.addEventListener('click', function () {
      document.getElementById('material-edit-id').value = '';
      document.getElementById('form-material').reset();
      document.getElementById('material-form-wrap').classList.remove('hidden');
    });
    var btnCancelMat = document.getElementById('btn-cancel-material');
    if (btnCancelMat) btnCancelMat.addEventListener('click', function () {
      document.getElementById('material-form-wrap').classList.add('hidden');
    });
    var formMat = document.getElementById('form-material');
    if (formMat) formMat.addEventListener('submit', function (e) {
      e.preventDefault();
      var editId = document.getElementById('material-edit-id').value;
      var matData = {
        name: document.getElementById('material-name').value.trim(),
        vendor: document.getElementById('material-vendor-name').value,
        unit: document.getElementById('material-unit').value.trim(),
        spec: document.getElementById('material-spec').value.trim(),
        price: parseFloat(document.getElementById('material-price').value) || 0
      };
      if (!matData.name) return;
      var mats = getProcurementMaterials();
      if (editId) {
        mats = mats.map(function (m) { return m.id === editId ? Object.assign({}, m, matData) : m; });
      } else {
        matData.id = id();
        mats.push(matData);
      }
      saveProcurementMaterials(mats);
      document.getElementById('material-form-wrap').classList.add('hidden');
      renderMaterialsTab();
      showToast('자재가 저장됐습니다.');
    });
    var matSearch = document.getElementById('material-search');
    if (matSearch) matSearch.addEventListener('input', renderMaterialsTab);
    var matVendorFilter = document.getElementById('material-vendor-filter');
    if (matVendorFilter) matVendorFilter.addEventListener('change', renderMaterialsTab);
    var tbodyMats = document.getElementById('tbody-materials');
    if (tbodyMats) tbodyMats.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.btn-edit-material');
      var delBtn = e.target.closest('.btn-delete-material');
      if (editBtn) {
        var mid = editBtn.getAttribute('data-id');
        var mat = getProcurementMaterials().find(function (m) { return m.id === mid; });
        if (!mat) return;
        document.getElementById('material-edit-id').value = mat.id;
        document.getElementById('material-name').value = mat.name || '';
        document.getElementById('material-vendor-name').value = mat.vendor || '';
        document.getElementById('material-unit').value = mat.unit || '';
        document.getElementById('material-spec').value = mat.spec || '';
        document.getElementById('material-price').value = mat.price || 0;
        document.getElementById('material-form-wrap').classList.remove('hidden');
      }
      if (delBtn) {
        if (!confirm('자재를 삭제하시겠습니까?')) return;
        saveProcurementMaterials(getProcurementMaterials().filter(function (m) { return m.id !== delBtn.getAttribute('data-id'); }));
        renderMaterialsTab();
        showToast('삭제됐습니다.');
      }
    });

    // ---- 평당자재분석 ----
    var pyeongModelSel = document.getElementById('pyeong-model-select');
    if (pyeongModelSel) pyeongModelSel.addEventListener('change', function () {
      renderPyeongAnalysisResult(pyeongModelSel.value);
    });

    // ---- 발주서출력 ----
    var printSiteSel = document.getElementById('print-site-select');
    if (printSiteSel) printSiteSel.addEventListener('change', renderOrderPrintPreview);
    var printVendorSel = document.getElementById('print-vendor-select');
    if (printVendorSel) printVendorSel.addEventListener('change', renderOrderPrintPreview);
    var btnDoPrint = document.getElementById('btn-do-print');
    if (btnDoPrint) btnDoPrint.addEventListener('click', function () {
      var printable = document.getElementById('order-form-printable');
      if (!printable) { showToast('현장과 업체를 선택하세요.', 'error'); return; }
      var w = window.open('', '_blank', 'width=800,height=1000');
      if (!w) return;
      w.document.write(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>자재 발주서</title>' +
        '<style>body{font-family:"맑은 고딕",sans-serif;background:#fff;color:#111;margin:0;padding:24px;max-width:800px;}' +
        '.order-form-title{text-align:center;font-size:22px;font-weight:bold;margin-bottom:20px;letter-spacing:6px;border-bottom:2px solid #111;padding-bottom:10px;}' +
        '.order-form-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:18px;border:1px solid #ccc;padding:12px;}' +
        '.order-form-meta-row{display:flex;gap:12px;align-items:flex-end;}' +
        '.order-form-label{font-weight:600;min-width:70px;color:#333;font-size:13px;}' +
        '.order-form-value{border-bottom:1px solid #888;flex:1;padding-bottom:2px;font-size:14px;}' +
        'table{width:100%;border-collapse:collapse;}th,td{border:1px solid #999;padding:7px 9px;font-size:13px;}' +
        'th{background:#f5f5f5;text-align:center;font-weight:600;}' +
        '.order-form-footer{margin-top:14px;font-size:12px;color:#666;text-align:right;}' +
        '@media print{body{padding:10px;}}</style>' +
        '</head><body>' + printable.outerHTML + '</body></html>'
      );
      w.document.close();
      w.focus();
      setTimeout(function () { w.print(); }, 300);
    });
  }

  function renderSettlement() {
    var contracts = filterByShowroom(getContracts(), 'showroomId');
    contracts = filterByYearMonth(contracts, 'contractDate');
    var tbody = document.getElementById('tbody-settlement');
    if (!tbody) return;
    tbody.innerHTML = contracts.map(function (c) {
      var deposit = paymentCellWithConfirm(c, 'deposit');
      var p1 = paymentCellWithConfirm(c, 'progress1');
      var p2 = paymentCellWithConfirm(c, 'progress2');
      var p3 = paymentCellWithConfirm(c, 'progress3');
      var balance = paymentCellWithConfirm(c, 'balance');
      var summary = paymentSummaryHtml(c);
      return '<tr><td>' + getShowroomName(c.showroomId) + '</td><td>' + (c.customerName || '-') + '</td><td>' + formatMoney(Math.round(Number(c.totalAmount) / (c.amountUnit === 'manwon' ? 1 : 10000))) + '만원</td><td class="payment-summary-cell">' + summary + '</td><td class="payment-cell">' + deposit + '</td><td class="payment-cell">' + p1 + '</td><td class="payment-cell">' + p2 + '</td><td class="payment-cell">' + p3 + '</td><td class="payment-cell">' + balance + '</td></tr>';
    }).join('') || '<tr><td colspan="10">정산 데이터가 없습니다.</td></tr>';
    renderSettlementIncentive();
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderSettlementIncentive() {
    var contracts = filterByShowroom(getContracts(), 'showroomId');
    var periodEl = document.getElementById('incentive-period');
    var period = periodEl ? periodEl.value : 'this_month';
    var y = getFilterYear();
    var m = getFilterMonth();
    var monthPrefix = (y && m) ? (y + '-' + String(m).padStart(2, '0')) : thisMonth();
    if (period === 'this_month') {
      contracts = contracts.filter(function (c) { return (c.contractDate || '').slice(0, 7) === monthPrefix; });
    } else {
      contracts = filterByYearMonth(contracts, 'contractDate');
    }
    var perContract = Number(document.getElementById('incentive-per-contract') && document.getElementById('incentive-per-contract').value) || 0;
    var percents = getIncentivePercents();

    var bySales = {};
    contracts.forEach(function (c) {
      var key = (c.salesPerson && c.salesPerson.trim()) ? c.salesPerson.trim() : '(미배정)';
      if (!bySales[key]) bySales[key] = { count: 0, total: 0 };
      bySales[key].count++;
      bySales[key].total += Number(c.totalAmount) || 0;
    });

    var tbody = document.getElementById('tbody-incentive');
    if (!tbody) return;
    var totalIncSum = 0;
    var rows = Object.keys(bySales).sort().map(function (name) {
      var v = bySales[name];
      var percent = Number(percents[name]) || 0;
      var perContractAmount = perContract * v.count;
      var percentAmount = (v.total * percent) / 100;
      var totalIncentive = perContractAmount + percentAmount;
      totalIncSum += totalIncentive;
      var percentVal = percents[name] !== undefined && percents[name] !== '' ? String(percents[name]) : '';
      var input = '<input type="number" class="incentive-percent-input" data-salesperson="' + escapeAttr(name) + '" value="' + escapeAttr(percentVal) + '" min="0" max="100" step="0.1" placeholder="%" style="width:4.5rem">';
      return '<tr><td>' + name + '</td><td>' + v.count + '</td><td>' + formatMoney(String(v.total)) + '</td><td>' + formatMoney(String(perContractAmount)) + '</td><td>' + input + '</td><td>' + formatMoney(String(Math.round(percentAmount))) + '</td><td><strong>' + formatMoney(String(Math.round(totalIncentive))) + '</strong></td></tr>';
    });
    var totalRow = '';
    if (rows.length > 0) {
      var totalCount = 0, totalAmount = 0, totalPercentSum = 0;
      Object.keys(bySales).forEach(function (name) {
        var v = bySales[name];
        totalCount += v.count;
        totalAmount += v.total;
        totalPercentSum += (v.total * (Number(percents[name]) || 0)) / 100;
      });
      totalRow = '<tr class="incentive-total-row"><td>합계</td><td>' + totalCount + '</td><td>' + formatMoney(String(totalAmount)) + '</td><td>' + formatMoney(String(perContract * totalCount)) + '</td><td></td><td>' + formatMoney(String(Math.round(totalPercentSum))) + '</td><td><strong>' + formatMoney(String(Math.round(totalIncSum))) + '</strong></td></tr>';
    }
    tbody.innerHTML = rows.join('') + totalRow || '<tr><td colspan="7">이번 달 계약 데이터가 없습니다. 인센티브를 계산할 수 없습니다.</td></tr>';
  }

  function renderHR() {
    var employees = getEmployees();
    var leaves = getLeaves();
    var tbodyEmp = document.getElementById('tbody-employees');
    var tbodyLeaves = document.getElementById('tbody-leaves');
    var leaveSelect = document.getElementById('leave-employee-id');
    if (tbodyEmp) {
      tbodyEmp.innerHTML = employees.map(function (e) {
        var permLabel = e.permission === 'manager' ? '매니저' : (e.permission === 'admin' ? '관리자' : '-');
        return '<tr><td>' + (e.name || '-') + '</td><td>' + (e.team || '-') + '</td><td>' + getShowroomName(e.showroomId) + '</td><td>' + permLabel + '</td><td>' + (e.phone || '-') + '</td><td>' + formatDate(e.joinDate) + '</td><td>' + (e.memo || '-') + '</td><td><button type="button" class="btn btn-sm btn-secondary" data-edit-employee="' + e.id + '">수정</button> <button type="button" class="btn btn-sm btn-secondary" data-delete-employee="' + e.id + '">삭제</button></td></tr>';
      }).join('') || '<tr><td colspan="7">등록된 직원이 없습니다.</td></tr>';
    }
    if (leaveSelect) {
      leaveSelect.innerHTML = '<option value="">선택</option>' + employees.map(function (e) {
        return '<option value="' + e.id + '">' + (e.name || '-') + '</option>';
      }).join('');
    }
    var monthPrefix = thisMonth();
    var thisMonthLeaves = leaves.filter(function (l) {
      return (l.startDate || '').slice(0, 7) === monthPrefix || (l.endDate || '').slice(0, 7) === monthPrefix;
    });
    if (tbodyLeaves) {
      tbodyLeaves.innerHTML = thisMonthLeaves.map(function (l) {
        var emp = employees.find(function (e) { return e.id === l.employeeId; });
        var name = emp ? emp.name : l.employeeId;
        return '<tr><td>' + (name || '-') + '</td><td>' + formatDate(l.startDate) + '</td><td>' + formatDate(l.endDate) + '</td><td>' + (l.reason || '-') + '</td><td><button type="button" class="btn btn-sm btn-secondary" data-delete-leave="' + l.id + '">삭제</button></td></tr>';
      }).join('') || '<tr><td colspan="5">이번 달 휴가 기록이 없습니다.</td></tr>';
    }
  }

  function renderKPI() {
    var contracts = filterByYearMonth(getContracts(), 'contractDate');
    var y = getFilterYear();
    var m = getFilterMonth();
    var monthPrefix = (y && m) ? (y + '-' + String(m).padStart(2, '0')) : thisMonth();
    var monthContracts = (y || m) ? contracts : contracts.filter(function (c) { return c.contractDate && c.contractDate.slice(0, 7) === monthPrefix; });
    var goals = getKpiGoals();
    var goal = goals[monthPrefix] || {};
    var goalContracts = Number(goal.goalContracts) || 0;
    var goalSales = Number(goal.goalSales) || 0;
    var actualContracts = monthContracts.length;
    var actualSales = monthContracts.reduce(function (sum, c) { return sum + (Number(c.totalAmount) || 0); }, 0) / 10000;
    var rateC = goalContracts ? ((actualContracts / goalContracts) * 100).toFixed(1) + '%' : '-';
    var rateS = goalSales ? ((actualSales / goalSales) * 100).toFixed(1) + '%' : '-';

    var elGoalC = document.getElementById('kpi-goal-contracts');
    var elGoalS = document.getElementById('kpi-goal-sales');
    if (elGoalC) elGoalC.value = goalContracts || '';
    if (elGoalS) elGoalS.value = goalSales || '';
    setEl('kpi-actual-contracts', actualContracts);
    setEl('kpi-actual-sales', actualSales.toFixed(1));
    setEl('kpi-rate-contracts', rateC);
    setEl('kpi-rate-sales', rateS);

    var bySales = {};
    contracts.forEach(function (c) {
      var key = c.salesPerson || '(?????';
      if (!bySales[key]) bySales[key] = { count: 0, total: 0 };
      bySales[key].count++;
      bySales[key].total += Number(c.totalAmount) || 0;
    });
    var tbodySales = document.getElementById('tbody-sales-kpi');
    if (tbodySales) {
      tbodySales.innerHTML = Object.keys(bySales).sort().map(function (key) {
        var v = bySales[key];
        return '<tr><td>' + key + '</td><td>' + v.count + '</td><td>' + formatMoney(String(v.total)) + '</td><td></td></tr>';
      }).join('') || '<tr><td colspan="4">데이터가 없습니다.</td></tr>';
    }

    var byShowroom = {};
    monthContracts.forEach(function (c) {
      var key = c.showroomId || '';
      var name = getShowroomName(key);
      if (!byShowroom[name]) byShowroom[name] = { count: 0, total: 0 };
      byShowroom[name].count++;
      byShowroom[name].total += Number(c.totalAmount) || 0;
    });
    var tbodyShowroom = document.getElementById('tbody-showroom-kpi');
    if (tbodyShowroom) {
      tbodyShowroom.innerHTML = Object.keys(byShowroom).sort().map(function (name) {
        var v = byShowroom[name];
        return '<tr><td>' + name + '</td><td>' + v.count + '</td><td>' + formatMoney(String(v.total)) + '</td></tr>';
      }).join('') || '<tr><td colspan="3">전시장 데이터가 없습니다.</td></tr>';
    }
  }

  function getCeoReports() {
    try { return JSON.parse(localStorage.getItem(STORAGE_CEO_REPORTS) || '[]'); } catch (e) { return []; }
  }

  function saveCeoReports(reports) {
    localStorage.setItem(STORAGE_CEO_REPORTS, JSON.stringify(reports));
    try {
      var supa = window.seumSupabase;
      if (!supa || !Array.isArray(reports)) return;
      var rows = reports.map(function (r) {
        return {
          local_id: r.id || null,
          report_type: r.type || null,
          report_date: r.date || null,
          title: r.title || null,
          author: r.author || null,
          content: r.content || null,
          fields: r.fields || null,
          payload: r
        };
      });
      supa.from('ceo_reports').upsert(rows, { onConflict: 'local_id' })
        .then(function (res) { if (res && res.error) console.error('Supabase ceo_reports sync error:', res.error); })
        .catch(function (err) { console.error('Supabase ceo_reports sync failed:', err); });
    } catch (e) { console.error('saveCeoReports exception:', e); }
  }

  function deleteCeoReportFromSupabase(localId) {
    try {
      var supa = window.seumSupabase;
      if (supa && localId) {
        supa.from('ceo_reports').delete().eq('local_id', localId)
          .then(function (res) { if (res && res.error) console.error('Supabase ceo_reports delete error:', res.error); })
          .catch(function (err) { console.error('Supabase ceo_reports delete failed:', err); });
      }
    } catch (e) { console.error('deleteCeoReportFromSupabase exception:', e); }
  }

  function syncCeoReportsFromSupabase() {
    try {
      var supa = window.seumSupabase;
      if (!supa) return;
      supa.from('ceo_reports').select('local_id,payload').order('created_at', { ascending: false })
        .then(function (res) {
          if (!res || res.error || !Array.isArray(res.data)) {
            if (res && res.error) console.error('Supabase ceo_reports load error:', res.error);
            return;
          }
          var remote = res.data.map(function (row) {
            if (row.payload && typeof row.payload === 'object') return row.payload;
            try { return JSON.parse(row.payload); } catch (e) { return null; }
          }).filter(Boolean);
          var local = getCeoReports();
          var merged = {};
          remote.forEach(function (r) { if (r.id) merged[r.id] = r; });
          local.forEach(function (r) { if (r.id && !merged[r.id]) merged[r.id] = r; });
          var result = Object.values(merged);
          localStorage.setItem(STORAGE_CEO_REPORTS, JSON.stringify(result));
          ['daily', 'weekly', 'monthly'].forEach(function (t) { renderCeoReport(t); });
        })
        .catch(function (err) { console.error('syncCeoReportsFromSupabase failed:', err); });
    } catch (e) { console.error('syncCeoReportsFromSupabase exception:', e); }
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderCeoDashboard() {
    var contracts = getContracts ? getContracts() : [];
    var today = new Date();
    var thisMonth = today.toISOString().slice(0, 7);

    // 이번 달 계약
    var monthContracts = contracts.filter(function(c) {
      return (c.contractDate || '').slice(0, 7) === thisMonth;
    });

    // KPI: 계약총액, 예상매출(계약금합계), 달성률
    var totalAmount = monthContracts.reduce(function(s, c) { return s + (Number(c.totalAmount) || 0); }, 0);
    var expectedSales = monthContracts.reduce(function(s, c) { return s + (Number(c.depositAmount) || 0); }, 0);
    var goalAmount = 10000000000; // 100억 (기본값)
    var rateVal = goalAmount > 0 ? Math.round((totalAmount / goalAmount) * 100) : 0;

    function toEok(val) {
      if (!val) return '0억';
      return (val / 100000000).toFixed(2) + '억';
    }

    var elTotal = document.getElementById('ceo-db-total-amount');
    var elExp = document.getElementById('ceo-db-expected-sales');
    var elRate = document.getElementById('ceo-db-rate');
    var elRateCard = document.getElementById('ceo-db-rate-card');
    if (elTotal) elTotal.textContent = toEok(totalAmount);
    if (elExp) elExp.textContent = toEok(expectedSales);
    if (elRate) elRate.textContent = rateVal + '%';
    if (elRateCard) {
      elRateCard.classList.remove('accent-green', 'accent-red', 'accent-orange');
      if (rateVal >= 100) elRateCard.classList.add('accent-green');
      else if (rateVal >= 60) elRateCard.classList.add('accent-orange');
      else elRateCard.classList.add('accent-red');
    }

    // 전체 진행 현황
    var allContracts = contracts;
    var designCount = allContracts.filter(function(c) { return c.status === '설계중' || c.designStatus === '진행중'; }).length;
    var constructionCount = allContracts.filter(function(c) { return c.status === '시공중' || c.constructionStatus === '진행중'; }).length;
    var pendingCount = allContracts.filter(function(c) { return c.status === '착공대기' || c.status === '계약완료'; }).length;

    var pC = document.getElementById('ceo-db-p-contracts');
    var pD = document.getElementById('ceo-db-p-design');
    var pCo = document.getElementById('ceo-db-p-construction');
    var pP = document.getElementById('ceo-db-p-pending');
    if (pC) pC.textContent = allContracts.length;
    if (pD) pD.textContent = designCount;
    if (pCo) pCo.textContent = constructionCount;
    if (pP) pP.textContent = pendingCount;

    // 전시장별 현황 (더미 + 실데이터 혼합)
    var showrooms = [
      { id: 'headquarters', name: '본사' },
      { id: 'showroom1', name: '1전시장' },
      { id: 'showroom3', name: '3전시장' },
      { id: 'showroom4', name: '4전시장' }
    ];
    var tbody = document.getElementById('ceo-db-showroom-tbody');
    if (tbody) {
      tbody.innerHTML = showrooms.map(function(sr) {
        var srContracts = allContracts.filter(function(c) {
          return c.showroomId === sr.id || c.showroom === sr.name;
        });
        var srTotal = srContracts.reduce(function(s, c) { return s + (Number(c.totalAmount) || 0); }, 0);
        var srDeposit = srContracts.reduce(function(s, c) { return s + (Number(c.depositAmount) || 0); }, 0);
        var srDesignDelay = srContracts.filter(function(c) { return c.designDelay || c.designDelayDays > 0; }).length;
        var srConstDelay = srContracts.filter(function(c) { return c.constructionDelay || c.constructionDelayDays > 0; }).length;
        return '<tr>' +
          '<td class="ceo-db-td-name">' + sr.name + '</td>' +
          '<td>' + toEok(srTotal) + '</td>' +
          '<td>' + toEok(srDeposit) + '</td>' +
          '<td class="' + (srDesignDelay > 0 ? 'accent-orange' : '') + '">' + srDesignDelay + '건</td>' +
          '<td class="' + (srConstDelay > 0 ? 'accent-red' : '') + '">' + srConstDelay + '건</td>' +
          '<td>' + srContracts.length + '건</td>' +
          '</tr>';
      }).join('');
    }

    // 지연 / 이슈 목록
    var today10 = today.toISOString().slice(0, 10);
    var designDelayed = allContracts.filter(function(c) {
      return c.designDelay || (c.designDueDate && c.designDueDate < today10 && c.status !== '시공완료');
    });
    var constDelayed = allContracts.filter(function(c) {
      return c.constructionDelay || (c.constructionDueDate && c.constructionDueDate < today10 && c.status !== '시공완료');
    });
    var paymentDelayed = allContracts.filter(function(c) {
      return c.paymentDelay || (c.paymentDueDate && c.paymentDueDate < today10 && !c.paymentCompleted);
    });

    function renderIssueList(listId, items, labelFn) {
      var el = document.getElementById(listId);
      if (!el) return;
      if (!items.length) {
        el.innerHTML = '<li class="ceo-db-issue-item ceo-db-issue-none">이슈 없음</li>';
        return;
      }
      el.innerHTML = items.slice(0, 5).map(function(c) {
        return '<li class="ceo-db-issue-item">' + labelFn(c) + '</li>';
      }).join('');
    }

    renderIssueList('ceo-db-issue-design', designDelayed, function(c) {
      return (c.customerName || c.name || '고객') + ' (' + (c.showroom || c.showroomId || '-') + ')';
    });
    renderIssueList('ceo-db-issue-construction', constDelayed, function(c) {
      return (c.customerName || c.name || '고객') + ' (' + (c.showroom || c.showroomId || '-') + ')';
    });
    renderIssueList('ceo-db-issue-payment', paymentDelayed, function(c) {
      return (c.customerName || c.name || '고객') + ' (' + (c.showroom || c.showroomId || '-') + ')';
    });

    // 오늘 시공 보고 (업무일지)
    var cwLogs = getConstructionWorklog();
    var cwToday10 = today.toISOString().slice(0, 10);
    var cwSites = {};
    cwLogs.forEach(function (l) {
      if (!l.siteName) return;
      if (!cwSites[l.siteName] || l.date > cwSites[l.siteName].date) cwSites[l.siteName] = l;
    });
    var cwSiteArr = Object.keys(cwSites).map(function (k) { return cwSites[k]; });
    var cwActiveCount = cwSiteArr.filter(function (l) { return l.process !== '완료'; }).length;
    var cwDoneCount = cwSiteArr.filter(function (l) { return l.process === '완료'; }).length;
    var cwIssueCount = cwSiteArr.filter(function (l) { return l.issues && l.issues.trim(); }).length;
    var cwTodayCount = cwLogs.filter(function (l) { return l.date === cwToday10; }).length;
    var elCwA = document.getElementById('ceo-db-cw-active'); if (elCwA) elCwA.textContent = cwActiveCount;
    var elCwD = document.getElementById('ceo-db-cw-done'); if (elCwD) elCwD.textContent = cwDoneCount;
    var elCwI = document.getElementById('ceo-db-cw-issues'); if (elCwI) elCwI.textContent = cwIssueCount;
    var elCwT = document.getElementById('ceo-db-cw-today'); if (elCwT) elCwT.textContent = cwTodayCount;

    var cwTodayLogs = cwLogs.filter(function (l) { return l.date === cwToday10; });
    var cwTbody = document.getElementById('ceo-db-cw-today-tbody');
    if (cwTbody) {
      if (!cwTodayLogs.length) {
        cwTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:1rem;">오늘 보고된 현장이 없습니다.</td></tr>';
      } else {
        cwTbody.innerHTML = cwTodayLogs.map(function (l) {
          var pct = Math.min(100, Math.max(0, Number(l.progress) || 0));
          return '<tr>' +
            '<td>' + escapeHtml(l.siteName || '-') + '</td>' +
            '<td>' + escapeHtml(l.process || '-') + '</td>' +
            '<td>' + pct + '%</td>' +
            '<td>' + (l.crew || '-') + '명</td>' +
            '<td>' + (l.issues && l.issues.trim() ? '<span style="color:#ef4444;font-weight:600;">⚠ ' + escapeHtml(l.issues.slice(0, 30)) + '</span>' : '-') + '</td>' +
          '</tr>';
        }).join('');
      }
    }

    // 더미 데이터: 실 데이터가 없을 때 예시 표시
    if (!allContracts.length) {
      if (elTotal) elTotal.textContent = '8.40억';
      if (elExp) elExp.textContent = '2.10억';
      if (elRate) elRate.textContent = '84%';
      if (pC) pC.textContent = '12';
      if (pD) pD.textContent = '5';
      if (pCo) pCo.textContent = '4';
      if (pP) pP.textContent = '3';
      if (tbody) {
        tbody.innerHTML = [
          { name: '본사', total: '3.20억', dep: '0.80억', dd: 1, cd: 0, cnt: 4 },
          { name: '1전시장', total: '2.50억', dep: '0.62억', dd: 0, cd: 1, cnt: 3 },
          { name: '3전시장', total: '1.50억', dep: '0.38억', dd: 2, cd: 0, cnt: 3 },
          { name: '4전시장', total: '1.20억', dep: '0.30억', dd: 0, cd: 0, cnt: 2 }
        ].map(function(r) {
          return '<tr>' +
            '<td class="ceo-db-td-name">' + r.name + '</td>' +
            '<td>' + r.total + '</td>' +
            '<td>' + r.dep + '</td>' +
            '<td class="' + (r.dd > 0 ? 'accent-orange' : '') + '">' + r.dd + '건</td>' +
            '<td class="' + (r.cd > 0 ? 'accent-red' : '') + '">' + r.cd + '건</td>' +
            '<td>' + r.cnt + '건</td>' +
            '</tr>';
        }).join('');
      }
      var dummyDesign = [
        { customerName: '홍길동', showroom: '3전시장' },
        { customerName: '김영희', showroom: '3전시장' }
      ];
      var dummyConst = [
        { customerName: '이철수', showroom: '1전시장' }
      ];
      var dummyPay = [];
      renderIssueList('ceo-db-issue-design', dummyDesign, function(c) {
        return c.customerName + ' (' + c.showroom + ')';
      });
      renderIssueList('ceo-db-issue-construction', dummyConst, function(c) {
        return c.customerName + ' (' + c.showroom + ')';
      });
      renderIssueList('ceo-db-issue-payment', dummyPay, function(c) {
        return c.customerName + ' (' + c.showroom + ')';
      });
    }
  }

  function renderCeoReport(type) {
    var reports = getCeoReports().filter(function (r) { return r.type === type; });
    reports.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var tbody = document.getElementById('tbody-ceo-' + type);
    if (!tbody) return;
    tbody.innerHTML = reports.map(function (r) {
      return '<tr>' +
        '<td>' + (r.date || '-') + '</td>' +
        '<td><button type="button" class="btn btn-sm btn-secondary" data-ceo-view="' + r.id + '" data-ceo-type="' + type + '">' + esc(r.title || '-') + '</button></td>' +
        '<td>' + esc(r.author || '-') + '</td>' +
        '<td>' + (r.createdAt ? r.createdAt.slice(0, 16).replace('T', ' ') : '-') + '</td>' +
        '<td><button type="button" class="btn btn-sm btn-secondary" data-ceo-delete="' + r.id + '" data-ceo-type="' + type + '">삭제</button></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5">보고 내역이 없습니다.</td></tr>';
  }

  function computeCeoAutoData(type) {
    var today = new Date().toISOString().slice(0, 10);
    var thisMonth = today.slice(0, 7);
    var d = new Date();
    var dow = d.getDay();
    var daysToMon = dow === 0 ? 6 : dow - 1;
    var weekStart = new Date(d.getTime() - daysToMon * 86400000).toISOString().slice(0, 10);

    var allContracts = getContracts();
    var allVisits = getVisits();

    var periodContracts, periodVisits;
    if (type === 'daily') {
      periodContracts = allContracts.filter(function (c) { return c.contractDate === today; });
      periodVisits = allVisits.filter(function (v) { return v.visitDate === today; });
    } else if (type === 'weekly') {
      periodContracts = allContracts.filter(function (c) { return c.contractDate >= weekStart && c.contractDate <= today; });
      periodVisits = allVisits.filter(function (v) { return v.visitDate >= weekStart && v.visitDate <= today; });
    } else {
      periodContracts = allContracts.filter(function (c) { return (c.contractDate || '').slice(0, 7) === thisMonth; });
      periodVisits = allVisits.filter(function (v) { return (v.visitDate || '').slice(0, 7) === thisMonth; });
    }

    var monthContracts = allContracts.filter(function (c) { return (c.contractDate || '').slice(0, 7) === thisMonth; });
    var monthSales = monthContracts.reduce(function (s, c) { var v = Number(c.totalAmount) || 0; return s + (c.amountUnit === 'manwon' ? v : Math.round(v / 10000)); }, 0);
    var monthVisits = allVisits.filter(function (v) { return (v.visitDate || '').slice(0, 7) === thisMonth; }).length;

    var goals = getKpiGoals ? getKpiGoals() : {};
    var goal = goals[thisMonth] || {};
    var goalC = Number(goal.goalContracts) || 0;
    var rateC = goalC ? ((monthContracts.length / goalC) * 100).toFixed(0) + '%' : '-';

    var srCounts = { headquarters: 0, showroom1: 0, showroom3: 0, showroom4: 0 };
    monthContracts.forEach(function (c) { if (srCounts[c.showroomId] !== undefined) srCounts[c.showroomId]++; });

    // 설계
    var designBase = allContracts.filter(function (c) { return c.depositReceivedAt; });
    var dNone = designBase.filter(function (c) { return (c.designStatus || 'none') === 'none'; }).length;
    var dInProg = designBase.filter(function (c) { return c.designStatus === 'in_progress'; }).length;
    var dNego = designBase.filter(function (c) { return c.designStatus === 'negotiating'; }).length;
    var dDone = designBase.filter(function (c) { return c.designStatus === 'done' || c.designStatus === 'negotiated'; }).length;
    var dNoDeposit = allContracts.filter(function (c) { return !c.depositReceivedAt; }).length;

    // 시공
    var cBefore = allContracts.filter(function (c) { return (c.constructionProgress || '착공전') === '착공전'; }).length;
    var cActive = allContracts.filter(function (c) { var p = c.constructionProgress || ''; return p === '착공' || p === '진행중'; }).length;
    var cDone = allContracts.filter(function (c) { return c.constructionProgress === '완료'; }).length;

    // 입금 건수
    var depOk = allContracts.filter(function (c) { return !!(c.depositConfirmed || c.depositReceivedAt); }).length;
    var progPend = allContracts.filter(function (c) {
      return (c.progress1Amount && !c.progress1Confirmed) || (c.progress2Amount && !c.progress2Confirmed) || (c.progress3Amount && !c.progress3Confirmed);
    }).length;
    var balPend = allContracts.filter(function (c) { return c.balanceAmount && !c.balanceConfirmed; }).length;
    var unpaid = allContracts.filter(function (c) { return c.depositAmount && !c.depositConfirmed; }).length;

    // 입금 금액 (paymentCellWithConfirm과 동일한 단위 정규화 사용)
    function _normPay(c, field) { var v = Number(c[field]) || 0; return c.amountUnit === 'manwon' ? v : Math.round(v / 10000); }
    // depositReceivedAt이 있으면 수령 완료로 간주 (paymentCellWithConfirm과 동일 로직)
    function _depConfirmed(c) { return !!(c.depositConfirmed || c.depositReceivedAt); }
    var depAmt = 0, depUnpaidAmt = 0, progPendAmt = 0, balPendAmt = 0, totalCollected = 0, totalUnpaid = 0;
    allContracts.forEach(function (c) {
      var dA = _normPay(c, 'depositAmount');
      if (_depConfirmed(c)) { depAmt += dA; totalCollected += dA; }
      else if (c.depositAmount) { depUnpaidAmt += dA; totalUnpaid += dA; }
      ['progress1', 'progress2', 'progress3'].forEach(function (p) {
        var pA = _normPay(c, p + 'Amount');
        if (pA) { if (c[p + 'Confirmed']) { totalCollected += pA; } else { progPendAmt += pA; totalUnpaid += pA; } }
      });
      var bA = _normPay(c, 'balanceAmount');
      if (bA) { if (c.balanceConfirmed) { totalCollected += bA; } else { balPendAmt += bA; totalUnpaid += bA; } }
    });

    return {
      periodContract: periodContracts.length + '건',
      monthContract: monthContracts.length + '건',
      monthSales: formatMoney(monthSales) + '만원',
      goalRate: rateC,
      srHq: srCounts.headquarters + '건',
      sr1: srCounts.showroom1 + '건',
      sr3: srCounts.showroom3 + '건',
      sr4: srCounts.showroom4 + '건',
      periodVisit: periodVisits.length + '명',
      monthVisit: monthVisits + '명',
      designWait: dNone + '건',
      designProgress: dInProg + '건',
      designRevision: dNego + '건',
      designDone: dDone + '건',
      designNone: dNoDeposit + '건',
      constWait: cBefore + '건',
      constActive: cActive + '건',
      constDone: cDone + '건',
      payDeposit: depOk + '건',
      payDepAmt: formatMoney(depAmt) + '만원',
      payProgress: progPend + '건',
      payProgAmt: formatMoney(progPendAmt) + '만원',
      payBalance: balPend + '건',
      payBalAmt: formatMoney(balPendAmt) + '만원',
      payUnpaid: unpaid + '건',
      payUnpaidAmt: formatMoney(depUnpaidAmt) + '만원',
      payMonthTotal: formatMoney(totalCollected) + '만원',
      payTotalUnpaid: formatMoney(totalUnpaid) + '만원'
    };
  }

  function setCeoField(type, field, val) {
    var el = document.getElementById('ceo-' + type + '-f-' + field);
    if (el) el.value = val;
  }

  function getCeoField(type, field) {
    var el = document.getElementById('ceo-' + type + '-f-' + field);
    return el ? (el.value || '-') : '-';
  }

  function autoFillCeoForm(type) {
    var data = computeCeoAutoData(type);
    setCeoField(type, 'period-contract', data.periodContract);
    setCeoField(type, 'month-contract', data.monthContract);
    setCeoField(type, 'month-sales', data.monthSales);
    setCeoField(type, 'goal-rate', data.goalRate);
    setCeoField(type, 'sr-hq', data.srHq);
    setCeoField(type, 'sr-1', data.sr1);
    setCeoField(type, 'sr-3', data.sr3);
    setCeoField(type, 'sr-4', data.sr4);
    setCeoField(type, 'period-visit', data.periodVisit);
    setCeoField(type, 'month-visit', data.monthVisit);
    setCeoField(type, 'design-wait', data.designWait);
    setCeoField(type, 'design-progress', data.designProgress);
    setCeoField(type, 'design-revision', data.designRevision);
    setCeoField(type, 'design-done', data.designDone);
    setCeoField(type, 'design-none', data.designNone);
    setCeoField(type, 'const-wait', data.constWait);
    setCeoField(type, 'const-active', data.constActive);
    setCeoField(type, 'const-done', data.constDone);
    setCeoField(type, 'pay-deposit', data.payDeposit);
    setCeoField(type, 'pay-dep-amt', data.payDepAmt);
    setCeoField(type, 'pay-progress', data.payProgress);
    setCeoField(type, 'pay-prog-amt', data.payProgAmt);
    setCeoField(type, 'pay-balance', data.payBalance);
    setCeoField(type, 'pay-bal-amt', data.payBalAmt);
    setCeoField(type, 'pay-unpaid', data.payUnpaid);
    setCeoField(type, 'pay-unpaid-amt', data.payUnpaidAmt);
    setCeoField(type, 'pay-month-total', data.payMonthTotal);
    setCeoField(type, 'pay-total-unpaid', data.payTotalUnpaid);
    showToast('대시보드 데이터가 자동 입력되었습니다.');
  }

  function generateCeoReportText(type) {
    var g = function (f) { return getCeoField(type, f); };
    var periodLabel = type === 'daily' ? '오늘 계약' : type === 'weekly' ? '이번주 계약' : '이달 계약';
    var visitLabel = type === 'daily' ? '오늘 방문' : type === 'weekly' ? '이번주 방문' : '이달 방문';
    var monthContractLabel = type === 'monthly' ? '전월 대비' : '이달 계약';
    var monthVisitLabel = type === 'monthly' ? '전월 대비' : '이달 방문';
    var issuesEl = document.getElementById('ceo-' + type + '-f-issues');
    var notesEl = document.getElementById('ceo-' + type + '-f-notes');
    var issues = issuesEl ? (issuesEl.value || '-') : '-';
    var notes = notesEl ? (notesEl.value || '-') : '-';
    return [
      '[세움 대표 보고]',
      '',
      '■ 계약 현황',
      periodLabel + ' : ' + g('period-contract'),
      monthContractLabel + ' : ' + g('month-contract'),
      '이달 매출 : ' + g('month-sales'),
      '목표 대비 : ' + g('goal-rate'),
      '',
      '전시장별',
      '본사 : ' + g('sr-hq'),
      '1전시장 : ' + g('sr-1'),
      '3전시장 : ' + g('sr-3'),
      '4전시장 : ' + g('sr-4'),
      '',
      '■ 방문 / 상담 현황',
      visitLabel + ' : ' + g('period-visit'),
      monthVisitLabel + ' : ' + g('month-visit'),
      '상담 진행 : ' + g('consult'),
      '계약 예정 : ' + g('contract-expected'),
      '견적 진행 : ' + g('estimate'),
      '',
      '■ 설계 진행 현황',
      '설계 대기 : ' + g('design-wait'),
      '설계 진행 : ' + g('design-progress'),
      '설계 완료 : ' + g('design-done'),
      '설계 수정 : ' + g('design-revision'),
      '계약 후 미설계 : ' + g('design-none'),
      '',
      '■ 시공 진행 현황',
      '착공 대기 : ' + g('const-wait'),
      '시공 중 : ' + g('const-active'),
      '시공 완료 : ' + g('const-done'),
      '지연 현장 : ' + g('const-delay'),
      '이슈 현장 : ' + g('const-issue'),
      '',
      '■ 입금 / 잔금 현황',
      '계약금 수령 : ' + g('pay-deposit') + ' / ' + g('pay-dep-amt'),
      '계약금 미수령 : ' + g('pay-unpaid') + ' / ' + g('pay-unpaid-amt'),
      '중도금 예정 : ' + g('pay-progress') + ' / ' + g('pay-prog-amt'),
      '잔금 예정 : ' + g('pay-balance') + ' / ' + g('pay-bal-amt'),
      '총 수금액 : ' + g('pay-month-total'),
      '전체 미수금 : ' + g('pay-total-unpaid'),
      '연체 : ' + g('pay-overdue'),
      '',
      '■ 매출 예측',
      '이번달 예상 계약 : ' + g('forecast-this'),
      '다음달 예상 계약 : ' + g('forecast-next'),
      '진행 중 계약 : ' + g('forecast-ongoing'),
      '',
      '■ 이슈 보고',
      issues,
      '',
      '■ 특이사항',
      notes
    ].join('\n');
  }

  function collectCeoFormFields(type) {
    var fields = ['period-contract', 'month-contract', 'month-sales', 'goal-rate',
      'sr-hq', 'sr-1', 'sr-3', 'sr-4',
      'period-visit', 'month-visit', 'consult', 'contract-expected', 'estimate',
      'design-wait', 'design-progress', 'design-done', 'design-revision', 'design-none',
      'const-wait', 'const-active', 'const-done', 'const-delay', 'const-issue',
      'pay-deposit', 'pay-dep-amt', 'pay-unpaid', 'pay-unpaid-amt', 'pay-progress', 'pay-prog-amt', 'pay-balance', 'pay-bal-amt', 'pay-month-total', 'pay-total-unpaid', 'pay-overdue',
      'forecast-this', 'forecast-next', 'forecast-ongoing'];
    var result = {};
    fields.forEach(function (f) { result[f] = getCeoField(type, f); });
    var issuesEl = document.getElementById('ceo-' + type + '-f-issues');
    var notesEl = document.getElementById('ceo-' + type + '-f-notes');
    result.issues = issuesEl ? issuesEl.value : '';
    result.notes = notesEl ? notesEl.value : '';
    return result;
  }

  function resetCeoForm(type) {
    var fields = ['period-contract', 'month-contract', 'month-sales', 'goal-rate',
      'sr-hq', 'sr-1', 'sr-3', 'sr-4',
      'period-visit', 'month-visit', 'consult', 'contract-expected', 'estimate',
      'design-wait', 'design-progress', 'design-done', 'design-revision', 'design-none',
      'const-wait', 'const-active', 'const-done', 'const-delay', 'const-issue',
      'pay-deposit', 'pay-dep-amt', 'pay-unpaid', 'pay-unpaid-amt', 'pay-progress', 'pay-prog-amt', 'pay-balance', 'pay-bal-amt', 'pay-month-total', 'pay-total-unpaid', 'pay-overdue',
      'forecast-this', 'forecast-next', 'forecast-ongoing'];
    fields.forEach(function (f) { setCeoField(type, f, ''); });
    var issuesEl = document.getElementById('ceo-' + type + '-f-issues');
    var notesEl = document.getElementById('ceo-' + type + '-f-notes');
    if (issuesEl) issuesEl.value = '';
    if (notesEl) notesEl.value = '';
    var titleEl = document.getElementById('ceo-' + type + '-title');
    if (titleEl) titleEl.value = '';
    var previewBox = document.getElementById('ceo-' + type + '-preview-box');
    if (previewBox) previewBox.classList.add('hidden');
  }

  // ========================
  // 지출결의서
  // ========================
  function getExpenseReports() {
    try { return JSON.parse(localStorage.getItem('seum_expense_reports') || '[]'); } catch (e) { return []; }
  }

  function saveExpenseReports(data) {
    localStorage.setItem('seum_expense_reports', JSON.stringify(data));
    try {
      var supa = window.seumSupabase;
      if (!supa || !Array.isArray(data)) return;
      var rows = data.map(function (r) {
        return {
          local_id: r.id || null,
          report_date: r.date || null,
          author: r.author || null,
          total_amount: r.totalAmount || 0,
          payload: r
        };
      });
      supa.from('expense_reports').upsert(rows, { onConflict: 'local_id' })
        .then(function (res) { if (res && res.error) console.error('Supabase expense_reports sync error:', res.error); })
        .catch(function (err) { console.error('Supabase expense_reports sync failed:', err); });
    } catch (e) { console.error('saveExpenseReports exception:', e); }
  }

  function deleteExpenseFromSupabase(localId) {
    try {
      var supa = window.seumSupabase;
      if (supa && localId) {
        supa.from('expense_reports').delete().eq('local_id', localId)
          .then(function (res) { if (res && res.error) console.error('Supabase expense delete error:', res.error); })
          .catch(function (err) { console.error('Supabase expense delete failed:', err); });
      }
    } catch (e) { console.error('deleteExpenseFromSupabase exception:', e); }
  }

  function syncExpenseReportsFromSupabase() {
    try {
      var supa = window.seumSupabase;
      if (!supa) return;
      supa.from('expense_reports').select('local_id,payload').order('created_at', { ascending: false })
        .then(function (res) {
          if (!res || res.error || !Array.isArray(res.data)) {
            if (res && res.error) console.error('Supabase expense_reports load error:', res.error);
            return;
          }
          var remote = res.data.map(function (row) {
            if (row.payload && typeof row.payload === 'object') return row.payload;
            try { return JSON.parse(row.payload); } catch (e) { return null; }
          }).filter(Boolean);
          var local = getExpenseReports();
          // 원격 기준으로 병합 (local_id로 중복 제거)
          var merged = {};
          remote.forEach(function (r) { if (r.id) merged[r.id] = r; });
          local.forEach(function (r) { if (r.id && !merged[r.id]) merged[r.id] = r; });
          var result = Object.values(merged);
          localStorage.setItem('seum_expense_reports', JSON.stringify(result));
          renderExpenseList();
        })
        .catch(function (err) { console.error('syncExpenseReportsFromSupabase failed:', err); });
    } catch (e) { console.error('syncExpenseReportsFromSupabase exception:', e); }
  }

  function numberToKorean(num) {
    num = Math.floor(Math.abs(Number(num) || 0));
    if (num === 0) return '영';
    var u = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    function g(n) {
      if (!n) return '';
      var th = Math.floor(n / 1000), h = Math.floor((n % 1000) / 100), t = Math.floor((n % 100) / 10), o = n % 10;
      return (th ? (th === 1 ? '' : u[th]) + '천' : '') + (h ? (h === 1 ? '' : u[h]) + '백' : '') + (t ? (t === 1 ? '' : u[t]) + '십' : '') + (o ? u[o] : '');
    }
    var jo = Math.floor(num / 1000000000000), eok = Math.floor((num % 1000000000000) / 100000000);
    var man = Math.floor((num % 100000000) / 10000), rest = num % 10000;
    return (jo ? g(jo) + '조' : '') + (eok ? g(eok) + '억' : '') + (man ? g(man) + '만' : '') + (rest ? g(rest) : '');
  }

  function calcExpenseTotal() {
    var total = 0;
    document.querySelectorAll('#expense-items-body .expense-amount').forEach(function (el) { total += Number(el.value.replace(/,/g, '')) || 0; });
    var sumCell = document.getElementById('expense-sum-cell');
    var dispEl = document.getElementById('expense-total-display');
    var korEl = document.getElementById('expense-total-korean');
    if (sumCell) sumCell.textContent = '₩' + total.toLocaleString();
    if (dispEl) dispEl.textContent = total.toLocaleString();
    if (korEl) korEl.textContent = total > 0 ? numberToKorean(total) + '원정' : '';
    return total;
  }

  function updateExpenseFooter() {
    var dateEl = document.getElementById('expense-date');
    var authorEl = document.getElementById('expense-author');
    var fd = document.getElementById('expense-footer-date');
    var fa = document.getElementById('expense-footer-author');
    if (fd && dateEl && dateEl.value) {
      var d = new Date(dateEl.value + 'T00:00:00');
      fd.textContent = d.getFullYear() + ' 년 \u2003' + (d.getMonth() + 1) + ' 월 \u2003' + d.getDate() + ' 일';
    }
    if (fa && authorEl) fa.textContent = authorEl.value;
  }

  function addExpenseRow(data) {
    data = data || {};
    var tbody = document.getElementById('expense-items-body');
    if (!tbody) return;
    var rowNum = data.rowNum || (tbody.querySelectorAll('tr').length + 1);
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><textarea class="expense-cell-input expense-desc" rows="2" placeholder="적/요 입력"></textarea></td>' +
      '<td><input type="text" inputmode="numeric" class="expense-cell-input expense-amount" style="text-align:right;" placeholder="0"></td>' +
      '<td><input type="text" class="expense-cell-input expense-note" placeholder="비고/계좌"></td>' +
      '<td class="no-print" style="text-align:center;"><button type="button" class="expense-del-btn" title="삭제">✕</button></td>';
    var descEl = tr.querySelector('.expense-desc');
    var amtEl = tr.querySelector('.expense-amount');
    var noteEl = tr.querySelector('.expense-note');
    if (data.description) descEl.value = data.description;
    if (data.amount) amtEl.value = Number(data.amount).toLocaleString();
    if (data.note) noteEl.value = data.note;
    amtEl.addEventListener('focus', function () { amtEl.value = amtEl.value.replace(/,/g, ''); });
    amtEl.addEventListener('blur', function () {
      var raw = Number(amtEl.value.replace(/,/g, '')) || 0;
      amtEl.value = raw > 0 ? raw.toLocaleString() : '';
      calcExpenseTotal();
    });
    amtEl.addEventListener('input', calcExpenseTotal);
    tr.querySelector('.expense-del-btn').addEventListener('click', function () { tr.remove(); calcExpenseTotal(); });
    tbody.appendChild(tr);
  }

  function collectExpenseItems() {
    var items = [], num = 1;
    document.querySelectorAll('#expense-items-body tr').forEach(function (tr) {
      var desc = tr.querySelector('.expense-desc');
      var amt = tr.querySelector('.expense-amount');
      var note = tr.querySelector('.expense-note');
      var a = Number(amt ? amt.value.replace(/,/g, '') : 0) || 0;
      var d = desc ? desc.value.trim() : '';
      if (d || a) items.push({ description: d, amount: a, note: note ? note.value.trim() : '', rowNum: num++ });
    });
    return items;
  }

  function loadExpenseToForm(r) {
    if (!r) return;
    var dateEl = document.getElementById('expense-date');
    var authorEl = document.getElementById('expense-author');
    if (dateEl) dateEl.value = r.date || '';
    if (authorEl) authorEl.value = r.author || '';
    var tbody = document.getElementById('expense-items-body');
    if (tbody) tbody.innerHTML = '';
    (r.items || []).forEach(function (item) { addExpenseRow(item); });
    // 빈 행 3개 추가
    for (var i = 0; i < 3; i++) addExpenseRow();
    calcExpenseTotal();
    updateExpenseFooter();
  }

  function renderExpenseList() {
    var tbody = document.getElementById('tbody-expense');
    if (!tbody) return;
    var reports = getExpenseReports().slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    if (!reports.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">저장된 지출결의서가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = reports.map(function (r) {
      return '<tr>' +
        '<td>' + (r.date || '-') + '</td>' +
        '<td>' + (r.author || '-') + '</td>' +
        '<td style="text-align:right;">₩' + (r.totalAmount || 0).toLocaleString() + '</td>' +
        '<td style="text-align:center;">' + (r.items ? r.items.length : 0) + '건</td>' +
        '<td>' + (r.createdAt ? r.createdAt.slice(0, 16).replace('T', ' ') : '-') + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<button class="btn btn-sm btn-secondary" data-exp-load="' + r.id + '">불러오기</button> ' +
          '<button class="btn btn-sm" style="background:none;border:none;color:#dc2626;cursor:pointer;" data-exp-del="' + r.id + '">삭제</button>' +
        '</td></tr>';
    }).join('');
  }

  function parseExpenseExcel(jsonData) {
    var dateVal = '', authorVal = '';
    var items = [];

    for (var i = 0; i < jsonData.length; i++) {
      var row = jsonData[i];
      // 발의일자 / 작성자 찾기
      for (var j = 0; j < row.length; j++) {
        var cell = String(row[j] || '');
        if (!dateVal && (cell.includes('발의일자') || cell.includes('발 의 일 자'))) {
          var dc = row[j + 1];
          if (dc != null && dc !== '') {
            if (typeof dc === 'number') {
              // Excel 날짜 시리얼
              try { var xd = window.XLSX.SSF.parse_date_code(dc); if (xd) dateVal = xd.y + '-' + String(xd.m).padStart(2,'0') + '-' + String(xd.d).padStart(2,'0'); } catch(e) {}
            } else {
              var ds = String(dc).replace(/년/g,'-').replace(/월/g,'-').replace(/일/g,'').replace(/\./g,'-').replace(/\s/g,'');
              var dm = ds.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
              if (dm) dateVal = dm[1] + '-' + String(dm[2]).padStart(2,'0') + '-' + String(dm[3]).padStart(2,'0');
            }
          }
        }
        if (!authorVal && (cell.includes('작성자') || cell.includes('작 성 자'))) {
          authorVal = String(row[j + 1] || '').trim();
        }
      }

      // 데이터 행: J열(인덱스9) 기준으로 숫자 금액 있는 행 파싱
      // 열 구성: A-C=적요(0-2), J=금액(9), K-M=비고(10-12), N=번호(13)
      var amtCol = -1;
      for (var k = 0; k < row.length; k++) {
        var v = row[k];
        if (typeof v === 'number' && v > 0 && v === Math.floor(v) && v < 1000000000) {
          amtCol = k; break;
        }
        if (typeof v === 'string' && /^[\d,]+$/.test(v.trim()) && Number(v.replace(/,/g,'')) > 0) {
          amtCol = k; break;
        }
      }
      if (amtCol < 0) continue;

      var descParts = [];
      for (var d = 0; d < amtCol && d < 10; d++) {
        var dc2 = String(row[d] || '').trim();
        if (dc2 && dc2.length > 1 && !/^(적|요|금액|비고|합계|결재|발의|작성|결재금액|번호|담당|부장|이사|대표)/.test(dc2)) descParts.push(dc2);
      }
      var descStr = descParts.join(' ').trim();
      if (!descStr || descStr.length < 3) continue;
      // 헤더/합계 행 제외
      if (/합계|금액|비고|발의|작성|결재/.test(descStr)) continue;

      var rawAmt = row[amtCol];
      var amt = typeof rawAmt === 'number' ? rawAmt : Number(String(rawAmt).replace(/,/g,'')) || 0;
      var noteParts = [];
      for (var n = amtCol + 1; n < row.length && n < amtCol + 5; n++) {
        var nc = String(row[n] || '').trim();
        if (nc) noteParts.push(nc);
      }

      items.push({ description: descStr, amount: amt, note: noteParts.join(' ').trim(), rowNum: items.length + 1 });
    }

    // 폼에 채우기
    var dateEl = document.getElementById('expense-date');
    var authorEl = document.getElementById('expense-author');
    if (dateEl && dateVal) dateEl.value = dateVal;
    if (authorEl && authorVal) authorEl.value = authorVal;
    var tbody = document.getElementById('expense-items-body');
    if (tbody) tbody.innerHTML = '';
    if (items.length) {
      items.forEach(function (item) { addExpenseRow(item); });
      for (var ei = 0; ei < 3; ei++) addExpenseRow();
      showToast(items.length + '개 항목을 불러왔습니다.');
    } else {
      for (var ei2 = 0; ei2 < 10; ei2++) addExpenseRow();
      showToast('항목을 자동 인식하지 못했습니다. 직접 입력해주세요.');
    }
    calcExpenseTotal();
    updateExpenseFooter();
  }

  function initExpenseReport() {
    var dateEl = document.getElementById('expense-date');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    var authorEl = document.getElementById('expense-author');
    if (authorEl && !authorEl.value && window.seumAuth && window.seumAuth.currentEmployee) {
      authorEl.value = window.seumAuth.currentEmployee.name || '';
    }
    // 초기 빈 행
    var tbody = document.getElementById('expense-items-body');
    if (tbody && !tbody.children.length) for (var i = 0; i < 10; i++) addExpenseRow();
    calcExpenseTotal();
    updateExpenseFooter();

    if (dateEl) dateEl.addEventListener('change', updateExpenseFooter);
    if (authorEl) authorEl.addEventListener('input', updateExpenseFooter);

    var btnAdd = document.getElementById('btn-expense-add-row');
    if (btnAdd) btnAdd.addEventListener('click', function () { addExpenseRow(); });

    var btnClear = document.getElementById('btn-expense-clear');
    if (btnClear) btnClear.addEventListener('click', function () {
      if (!confirm('입력 내용을 초기화하시겠습니까?')) return;
      if (tbody) tbody.innerHTML = '';
      if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
      if (authorEl) authorEl.value = (window.seumAuth && window.seumAuth.currentEmployee && window.seumAuth.currentEmployee.name) || '';
      for (var i = 0; i < 10; i++) addExpenseRow();
      calcExpenseTotal(); updateExpenseFooter();
    });

    var btnUpload = document.getElementById('btn-expense-upload-excel');
    var inputExcel = document.getElementById('input-expense-excel');
    if (btnUpload && inputExcel) {
      btnUpload.addEventListener('click', function () { inputExcel.click(); });
      inputExcel.addEventListener('change', function (e) {
        var file = e.target.files[0]; if (!file) return;
        if (!window.XLSX) { showToast('엑셀 라이브러리 로드 중입니다. 잠시 후 다시 시도해주세요.'); return; }
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var wb = window.XLSX.read(ev.target.result, { type: 'array', cellDates: true });
            var ws = wb.Sheets[wb.SheetNames[0]];
            var jsonData = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
            parseExpenseExcel(jsonData);
          } catch (err) { showToast('엑셀 파일 읽기 오류: ' + err.message); }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
      });
    }

    var form = document.getElementById('form-expense');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var dv = dateEl ? dateEl.value : '';
        if (!dv) { showToast('발의일자를 입력해주세요.'); return; }
        var items = collectExpenseItems().filter(function (it) { return it.description || it.amount; });
        var total = items.reduce(function (s, it) { return s + (it.amount || 0); }, 0);
        var reports = getExpenseReports();
        reports.push({ id: id(), date: dv, author: authorEl ? authorEl.value : '', totalAmount: total, items: items, createdAt: new Date().toISOString() });
        saveExpenseReports(reports);
        renderExpenseList();
        showToast('지출결의서가 저장되었습니다.');
      });
    }

    var tbodyEl = document.getElementById('tbody-expense');
    if (tbodyEl) {
      tbodyEl.addEventListener('click', function (e) {
        var loadBtn = e.target.closest('[data-exp-load]');
        var delBtn = e.target.closest('[data-exp-del]');
        if (loadBtn) {
          var r = getExpenseReports().find(function (x) { return x.id === loadBtn.getAttribute('data-exp-load'); });
          if (r) { loadExpenseToForm(r); document.getElementById('expense-print-area').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
        if (delBtn) {
          if (!confirm('삭제하시겠습니까?')) return;
          var delId = delBtn.getAttribute('data-exp-del');
          saveExpenseReports(getExpenseReports().filter(function (x) { return x.id !== delId; }));
          deleteExpenseFromSupabase(delId);
          renderExpenseList();
          showToast('삭제되었습니다.');
        }
      });
    }
    renderExpenseList();
    syncExpenseReportsFromSupabase();
  }

  function initCeoReports() {
    ['daily', 'weekly', 'monthly'].forEach(function (type) {
      // 날짜 초기값
      var dateInput = document.getElementById('ceo-' + type + '-date');
      if (dateInput) {
        dateInput.value = type === 'monthly' ? new Date().toISOString().slice(0, 7) : new Date().toISOString().slice(0, 10);
      }

      // 자동 채우기 버튼
      var autofillBtn = document.getElementById('btn-ceo-' + type + '-autofill');
      if (autofillBtn) {
        autofillBtn.addEventListener('click', function () { autoFillCeoForm(type); });
      }

      // 미리보기/복사 버튼
      var previewBtn = document.getElementById('btn-ceo-' + type + '-preview');
      if (previewBtn) {
        previewBtn.addEventListener('click', function () {
          var text = generateCeoReportText(type);
          var preEl = document.getElementById('ceo-' + type + '-preview-text');
          var box = document.getElementById('ceo-' + type + '-preview-box');
          if (preEl) preEl.textContent = text;
          if (box) { box.classList.remove('hidden'); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        });
      }

      // 복사 버튼
      var copyBtn = document.getElementById('btn-ceo-' + type + '-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var preEl = document.getElementById('ceo-' + type + '-preview-text');
          var text = preEl ? preEl.textContent : generateCeoReportText(type);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () { showToast('복사되었습니다.'); });
          } else {
            var ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
            showToast('복사되었습니다.');
          }
        });
      }

      // 폼 저장
      var form = document.getElementById('form-ceo-' + type);
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!canSeeCeoSection()) return;
          var cur = window.seumAuth && window.seumAuth.currentEmployee;
          var author = cur ? (cur.name || cur.email || '비서') : '비서';
          var dateVal = document.getElementById('ceo-' + type + '-date').value;
          var titleEl = document.getElementById('ceo-' + type + '-title');
          var titleVal = titleEl ? titleEl.value.trim() : '';
          if (!dateVal) { alert('날짜를 입력해 주세요.'); return; }
          var content = generateCeoReportText(type);
          var fields = collectCeoFormFields(type);
          if (!titleVal) {
            titleVal = dateVal + ' ' + (type === 'daily' ? '일일' : type === 'weekly' ? '주간' : '월간') + ' 보고';
          }
          var reports = getCeoReports();
          reports.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: type,
            date: dateVal,
            title: titleVal,
            content: content,
            fields: fields,
            author: author,
            createdAt: new Date().toISOString()
          });
          saveCeoReports(reports);
          resetCeoForm(type);
          if (dateInput) dateInput.value = type === 'monthly' ? new Date().toISOString().slice(0, 7) : new Date().toISOString().slice(0, 10);
          renderCeoReport(type);
          showToast('보고가 저장되었습니다.');
        });
      }

      // 목록 클릭 (보기/삭제)
      var tbody = document.getElementById('tbody-ceo-' + type);
      if (tbody) {
        tbody.addEventListener('click', function (e) {
          var viewBtn = e.target.closest('[data-ceo-view]');
          var deleteBtn = e.target.closest('[data-ceo-delete]');
          if (viewBtn) {
            var rid = viewBtn.getAttribute('data-ceo-view');
            var rtype = viewBtn.getAttribute('data-ceo-type');
            var report = getCeoReports().find(function (r) { return r.id === rid; });
            if (!report) return;
            var detail = document.getElementById('ceo-' + rtype + '-detail');
            if (detail) {
              document.getElementById('ceo-' + rtype + '-detail-title').textContent = report.title || '';
              document.getElementById('ceo-' + rtype + '-detail-meta').textContent = '작성자: ' + (report.author || '-') + '  |  ' + (report.createdAt ? report.createdAt.slice(0, 16).replace('T', ' ') : '');
              document.getElementById('ceo-' + rtype + '-detail-content').textContent = report.content || '';
              detail.classList.remove('hidden');
              detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          if (deleteBtn) {
            var did = deleteBtn.getAttribute('data-ceo-delete');
            var dtype = deleteBtn.getAttribute('data-ceo-type');
            if (!confirm('이 보고를 삭제하시겠습니까?')) return;
            saveCeoReports(getCeoReports().filter(function (r) { return r.id !== did; }));
            deleteCeoReportFromSupabase(did);
            renderCeoReport(dtype);
            var detail2 = document.getElementById('ceo-' + dtype + '-detail');
            if (detail2) detail2.classList.add('hidden');
            showToast('삭제되었습니다.');
          }
        });
      }

      // 닫기 버튼
      var closeBtn = document.getElementById('btn-ceo-' + type + '-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          var detail = document.getElementById('ceo-' + type + '-detail');
          if (detail) detail.classList.add('hidden');
        });
      }
    });
  }

  function showConstructionDetailPanel(contractId, forceRefresh) {
    var tbody = document.getElementById('tbody-construction');
    if (!tbody) return;
    var row = tbody.querySelector('.construction-row[data-contract-id="' + contractId + '"]');
    if (!row) return;
    var next = row.nextElementSibling;
    var isDetailOpen = next && next.classList && next.classList.contains('construction-detail-row') && next.getAttribute('data-detail-for') === contractId;
    if (!forceRefresh && isDetailOpen) {
      next.remove();
      row.classList.remove('construction-row-expanded');
      expandedConstructionId = null;
      return;
    }
    row.classList.remove('construction-row-expanded');
    tbody.querySelectorAll('.construction-detail-row').forEach(function (r) { r.remove(); });
    tbody.querySelectorAll('.construction-row-expanded').forEach(function (r) { r.classList.remove('construction-row-expanded'); });
    insertConstructionDetailRowAfter(row, contractId);
    row.classList.add('construction-row-expanded');
    expandedConstructionId = contractId;
  }

  function updateConstructionDetailPanelIfOpen() {
    if (!expandedConstructionId) return;
    var tbody = document.getElementById('tbody-construction');
    var detail = tbody && tbody.querySelector('.construction-detail-row[data-detail-for="' + expandedConstructionId + '"]');
    if (detail) {
      var td = detail.querySelector('td.construction-detail-cell');
      if (td) td.innerHTML = buildConstructionDetailContent(expandedConstructionId);
    }
  }

  function openConstructionStagesModal(contractId) {
    if (isSalesReadonly()) {
      // ??????? ??? ??? ??? ??????????? (???????
      return;
    }
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    document.getElementById('construction-stages-contract-id').value = c.id;
    document.getElementById('construction-stages-customer').textContent = c.customerName || '-';
    document.getElementById('construction-start-date').value = c.constructionStartDate || '';
    document.getElementById('construction-end-date').value = c.constructionEndDate || '';
    var stages = getConstructionStages(c);
    var tbody = document.getElementById('tbody-construction-stages');
    if (tbody) {
      tbody.innerHTML = stages.map(function (s) {
        var stageName = escapeAttr(s.name || '');
        return '<tr><td>' + (s.name || '-') + '</td>' +
          '<td><input type="date" class="stage-modal-start" data-stage="' + stageName + '" value="' + escapeAttr(s.startDate || '') + '"></td>' +
          '<td><input type="date" class="stage-modal-end" data-stage="' + stageName + '" value="' + escapeAttr(s.endDate || '') + '"></td>' +
          '<td><input type="text" class="stage-responsible-name" data-stage="' + stageName + '" value="' + escapeAttr(s.responsibleName || '') + '" placeholder="????></td>' +
          '<td><input type="text" class="stage-modal-worker-list" data-stage="' + stageName + '" value="' + escapeAttr(s.workerList || '') + '" placeholder="????? ???, ?????></td>' +
          '<td><input type="text" class="stage-responsible-phone" data-stage="' + stageName + '" value="' + escapeAttr(s.responsiblePhone || '') + '" placeholder="?????></td>' +
          '<td><input type="number" class="stage-modal-labor-cost" data-stage="' + stageName + '" value="' + escapeAttr(s.laborCost || '') + '" placeholder="????????" min="0" step="1"></td>' +
          '<td><input type="number" class="stage-modal-extra-cost" data-stage="' + stageName + '" value="' + escapeAttr(s.extraCost || '') + '" placeholder="????? ???" min="0" step="1"></td>' +
          '<td><textarea class="stage-modal-memo" data-stage="' + stageName + '" placeholder="??????" rows="2">' + escapeAttr(s.memo || '') + '</textarea></td></tr>';
      }).join('');
    }
    document.getElementById('modal-construction-stages').classList.remove('hidden');
  }

  function initConstructionStagesModal() {
    var form = document.getElementById('form-construction-stages');
    var modal = document.getElementById('modal-construction-stages');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-construction-stages"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('construction-stages-contract-id').value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        c.constructionStartDate = document.getElementById('construction-start-date').value || '';
        c.constructionEndDate = document.getElementById('construction-end-date').value || '';
        var stages = CONSTRUCTION_STAGE_NAMES.map(function (name) {
          var startEl = document.querySelector('.stage-modal-start[data-stage="' + name + '"]');
          var endEl = document.querySelector('.stage-modal-end[data-stage="' + name + '"]');
          var nameEl = document.querySelector('.stage-responsible-name[data-stage="' + name + '"]');
          var workerEl = document.querySelector('.stage-modal-worker-list[data-stage="' + name + '"]');
          var phoneEl = document.querySelector('.stage-responsible-phone[data-stage="' + name + '"]');
          var laborEl = document.querySelector('.stage-modal-labor-cost[data-stage="' + name + '"]');
          var extraEl = document.querySelector('.stage-modal-extra-cost[data-stage="' + name + '"]');
          var memoEl = document.querySelector('.stage-modal-memo[data-stage="' + name + '"]');
          return {
            name: name,
            startDate: startEl ? (startEl.value || '').trim() : '',
            endDate: endEl ? (endEl.value || '').trim() : '',
            responsibleName: nameEl ? nameEl.value.trim() : '',
            workerList: workerEl ? workerEl.value.trim() : '',
            responsiblePhone: phoneEl ? phoneEl.value.trim() : '',
            laborCost: laborEl ? (laborEl.value || '').trim() : '',
            extraCost: extraEl ? (extraEl.value || '').trim() : '',
            memo: memoEl ? memoEl.value.trim() : ''
          };
        });
        c.constructionStages = stages;
        saveContracts(contracts);
        modal.classList.add('hidden');
        renderConstruction();
        updateConstructionDetailPanelIfOpen();
      });
    }
  }

  function openDesignPermitModal(contractId) {
    if (isSalesReadonly()) return;
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    document.getElementById('design-contract-id').value = c.id;
    document.getElementById('design-project-type').value = c.projectType || '';
    document.getElementById('design-drawing-attachment').value = c.designDrawingAttachment || '';
    document.getElementById('design-construction-drawing-attachment').value = c.constructionDrawingAttachment || '';
    document.getElementById('design-architect').value = c.architectInfo || '';
    document.getElementById('design-contact-name').value = c.designContactName || '';
    document.getElementById('design-contact-phone').value = c.designContactPhone || '';
    document.getElementById('design-has-permit').checked = !!c.hasPermitCert;
    document.getElementById('design-permit-attachment').value = c.permitAttachment || '';
    document.getElementById('design-has-construction-report').checked = !!c.hasConstructionStartReport;
    document.getElementById('design-has-completion-cert').checked = !!c.hasCompletionCert;
    document.getElementById('design-construction-start-ok').checked = !!c.constructionStartOk;
    // ?????? 1??2??3???? ????? ???
    var memo1DesignEl = document.getElementById('design-drawing-1-memo-design');
    if (memo1DesignEl) memo1DesignEl.value = c.designDrawing1DesignMemo || '';
    var memo1SalesEl = document.getElementById('design-drawing-1-memo-sales');
    if (memo1SalesEl) memo1SalesEl.value = c.designDrawing1SalesMemo || '';
    var final1El = document.getElementById('design-drawing-1-final');
    var final1Badge = document.getElementById('design-drawing-1-final-badge');
    var isFinal1 = !!c.designDrawing1Final;
    if (final1El) final1El.checked = isFinal1;
    if (final1Badge) final1Badge.style.display = isFinal1 ? 'inline-block' : 'none';
    var att2El = document.getElementById('design-drawing-attachment-2');
    if (att2El) att2El.value = c.designDrawing2Attachment || '';
    var memo2DesignEl = document.getElementById('design-drawing-2-memo-design');
    if (memo2DesignEl) memo2DesignEl.value = c.designDrawing2DesignMemo || '';
    var memo2SalesEl = document.getElementById('design-drawing-2-memo-sales');
    if (memo2SalesEl) memo2SalesEl.value = c.designDrawing2SalesMemo || '';
    var final2El = document.getElementById('design-drawing-2-final');
    var final2Badge = document.getElementById('design-drawing-2-final-badge');
    var isFinal2 = !!c.designDrawing2Final;
    if (final2El) final2El.checked = isFinal2;
    if (final2Badge) final2Badge.style.display = isFinal2 ? 'inline-block' : 'none';
    var att3El = document.getElementById('design-drawing-attachment-3');
    if (att3El) att3El.value = c.designDrawing3Attachment || '';
    var memo3DesignEl = document.getElementById('design-drawing-3-memo-design');
    if (memo3DesignEl) memo3DesignEl.value = c.designDrawing3DesignMemo || '';
    var memo3SalesEl = document.getElementById('design-drawing-3-memo-sales');
    if (memo3SalesEl) memo3SalesEl.value = c.designDrawing3SalesMemo || '';
    var final3El = document.getElementById('design-drawing-3-final');
    var final3Badge = document.getElementById('design-drawing-3-final-badge');
    var isFinal3 = !!c.designDrawing3Final;
    if (final3El) final3El.checked = isFinal3;
    if (final3Badge) final3Badge.style.display = isFinal3 ? 'inline-block' : 'none';
    // ??? ??? ?????????
    refreshDrawingFileListForInput(
      document.getElementById('design-drawing-attachment'),
      document.getElementById('design-drawing-list-1')
    );
    refreshDrawingFileListForInput(
      document.getElementById('design-drawing-attachment-2'),
      document.getElementById('design-drawing-list-2')
    );
    refreshDrawingFileListForInput(
      document.getElementById('design-drawing-attachment-3'),
      document.getElementById('design-drawing-list-3')
    );
    refreshDrawingFileListForInput(
      document.getElementById('design-construction-drawing-attachment'),
      document.getElementById('design-construction-drawing-list')
    );
    var houseFields = document.getElementById('design-house-fields');
    if (houseFields) houseFields.classList.toggle('hidden', (c.contractModel || '') !== '전원주택');
    document.getElementById('modal-design-permit').classList.remove('hidden');
  }

  function initDesignPermitModal() {
    var form = document.getElementById('form-design-permit');
    var modal = document.getElementById('modal-design-permit');
    var projectTypeEl = document.getElementById('design-project-type');
    var houseFields = document.getElementById('design-house-fields');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-design-permit"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
    if (projectTypeEl && houseFields) {
      projectTypeEl.addEventListener('change', function () {
        houseFields.classList.toggle('hidden', projectTypeEl.value !== '전원주택');
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('design-contract-id').value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        c.projectType = document.getElementById('design-project-type').value || '';
        c.designDrawingAttachment = document.getElementById('design-drawing-attachment').value.trim();
        // ?????? 1??2??3???? ?????
        var memo1DesignEl = document.getElementById('design-drawing-1-memo-design');
        var memo1SalesEl = document.getElementById('design-drawing-1-memo-sales');
        var final1El = document.getElementById('design-drawing-1-final');
        c.designDrawing1DesignMemo = memo1DesignEl && memo1DesignEl.value ? memo1DesignEl.value.trim() : '';
        c.designDrawing1SalesMemo = memo1SalesEl && memo1SalesEl.value ? memo1SalesEl.value.trim() : '';
        c.designDrawing1Final = !!(final1El && final1El.checked);
        var att2El = document.getElementById('design-drawing-attachment-2');
        var memo2DesignEl = document.getElementById('design-drawing-2-memo-design');
        var memo2SalesEl = document.getElementById('design-drawing-2-memo-sales');
        var final2El = document.getElementById('design-drawing-2-final');
        c.designDrawing2Attachment = att2El && att2El.value ? att2El.value.trim() : '';
        c.designDrawing2DesignMemo = memo2DesignEl && memo2DesignEl.value ? memo2DesignEl.value.trim() : '';
        c.designDrawing2SalesMemo = memo2SalesEl && memo2SalesEl.value ? memo2SalesEl.value.trim() : '';
        c.designDrawing2Final = !!(final2El && final2El.checked);
        var att3El = document.getElementById('design-drawing-attachment-3');
        var memo3DesignEl = document.getElementById('design-drawing-3-memo-design');
        var memo3SalesEl = document.getElementById('design-drawing-3-memo-sales');
        var final3El = document.getElementById('design-drawing-3-final');
        c.designDrawing3Attachment = att3El && att3El.value ? att3El.value.trim() : '';
        c.designDrawing3DesignMemo = memo3DesignEl && memo3DesignEl.value ? memo3DesignEl.value.trim() : '';
        c.designDrawing3SalesMemo = memo3SalesEl && memo3SalesEl.value ? memo3SalesEl.value.trim() : '';
        c.designDrawing3Final = !!(final3El && final3El.checked);
        c.constructionDrawingAttachment = document.getElementById('design-construction-drawing-attachment').value.trim();
        c.architectInfo = document.getElementById('design-architect').value.trim();
        c.designContactName = document.getElementById('design-contact-name').value.trim();
        c.designContactPhone = document.getElementById('design-contact-phone').value.trim();
        c.hasPermitCert = document.getElementById('design-has-permit').checked;
        c.permitAttachment = document.getElementById('design-permit-attachment').value.trim();
        c.hasConstructionStartReport = document.getElementById('design-has-construction-report').checked;
        c.hasCompletionCert = document.getElementById('design-has-completion-cert').checked;
        c.constructionStartOk = document.getElementById('design-construction-start-ok').checked;
        saveContracts(contracts);
        modal.classList.add('hidden');
        renderDesign();
        window.alert('허가 현황이 저장되었습니다.');
      });
    }
    var drawingFileEl = document.getElementById('design-drawing-attachment-file');
    var drawingUploadBtn = document.getElementById('btn-design-drawing-upload');
    var drawingOpenBtn = document.getElementById('btn-design-drawing-open');
    if (drawingUploadBtn && drawingFileEl) {
      drawingUploadBtn.addEventListener('click', function () {
        drawingFileEl.click();
      });
      drawingFileEl.addEventListener('change', function () {
        var contractId = document.getElementById('design-contract-id').value;
        var files = Array.prototype.slice.call(drawingFileEl.files || []);
        if (!contractId) { window.alert('계약 ID 없음'); drawingFileEl.value = ''; return; }
        if (!files.length) return;
        var inputEl = document.getElementById('design-drawing-attachment');
        var existingUrls = parseDrawingUrls(inputEl && inputEl.value ? inputEl.value : '');
        Promise.all(files.map(function (file) { return uploadDesignDrawingAttachment(contractId, file); }))
          .then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) { window.alert('업로드에 실패했습니다.'); return; }
            existingUrls = existingUrls.concat(urls);
            if (inputEl) {
              inputEl.value = serializeDrawingUrls(existingUrls);
              refreshDrawingFileListForInput(inputEl, document.getElementById('design-drawing-list-1'));
            }
          })
          .finally(function () { drawingFileEl.value = ''; });
      });
    }
    if (drawingOpenBtn) {
      drawingOpenBtn.addEventListener('click', function () {
        openUrlFromInput('design-drawing-attachment');
      });
    }
    // ?????? 2??????????
    var drawingFileEl2 = document.getElementById('design-drawing-attachment-file-2');
    var drawingUploadBtn2 = document.getElementById('btn-design-drawing-upload-2');
    var drawingOpenBtn2 = document.getElementById('btn-design-drawing-open-2');
    if (drawingUploadBtn2 && drawingFileEl2) {
      drawingUploadBtn2.addEventListener('click', function () {
        drawingFileEl2.click();
      });
      drawingFileEl2.addEventListener('change', function () {
        var contractId = document.getElementById('design-contract-id').value;
        var files = Array.prototype.slice.call(drawingFileEl2.files || []);
        if (!contractId) { window.alert('계약 ID 없음'); drawingFileEl2.value = ''; return; }
        if (!files.length) return;
        var inputEl = document.getElementById('design-drawing-attachment-2');
        var existingUrls = parseDrawingUrls(inputEl && inputEl.value ? inputEl.value : '');
        Promise.all(files.map(function (file) { return uploadDesignDrawingAttachment(contractId, file); }))
          .then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) { window.alert('업로드에 실패했습니다.'); return; }
            existingUrls = existingUrls.concat(urls);
            if (inputEl) {
              inputEl.value = serializeDrawingUrls(existingUrls);
              refreshDrawingFileListForInput(inputEl, document.getElementById('design-drawing-list-2'));
            }
          })
          .finally(function () { drawingFileEl2.value = ''; });
      });
    }
    if (drawingOpenBtn2) {
      drawingOpenBtn2.addEventListener('click', function () {
        openUrlFromInput('design-drawing-attachment-2');
      });
    }
    // ?????? 3??????????
    var drawingFileEl3 = document.getElementById('design-drawing-attachment-file-3');
    var drawingUploadBtn3 = document.getElementById('btn-design-drawing-upload-3');
    var drawingOpenBtn3 = document.getElementById('btn-design-drawing-open-3');
    if (drawingUploadBtn3 && drawingFileEl3) {
      drawingUploadBtn3.addEventListener('click', function () {
        drawingFileEl3.click();
      });
      drawingFileEl3.addEventListener('change', function () {
        var contractId = document.getElementById('design-contract-id').value;
        var files = Array.prototype.slice.call(drawingFileEl3.files || []);
        if (!contractId) { window.alert('계약 ID 없음'); drawingFileEl3.value = ''; return; }
        if (!files.length) return;
        var inputEl = document.getElementById('design-drawing-attachment-3');
        var existingUrls = parseDrawingUrls(inputEl && inputEl.value ? inputEl.value : '');
        Promise.all(files.map(function (file) { return uploadDesignDrawingAttachment(contractId, file); }))
          .then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) { window.alert('업로드에 실패했습니다.'); return; }
            existingUrls = existingUrls.concat(urls);
            if (inputEl) {
              inputEl.value = serializeDrawingUrls(existingUrls);
              refreshDrawingFileListForInput(inputEl, document.getElementById('design-drawing-list-3'));
            }
          })
          .finally(function () { drawingFileEl3.value = ''; });
      });
    }
    if (drawingOpenBtn3) {
      drawingOpenBtn3.addEventListener('click', function () {
        openUrlFromInput('design-drawing-attachment-3');
      });
    }
    var constructionFileEl = document.getElementById('design-construction-drawing-attachment-file');
    var constructionUploadBtn = document.getElementById('btn-design-construction-drawing-upload');
    var constructionOpenBtn = document.getElementById('btn-design-construction-drawing-open');
    if (constructionUploadBtn && constructionFileEl) {
      constructionUploadBtn.addEventListener('click', function () {
        constructionFileEl.click();
      });
      constructionFileEl.addEventListener('change', function () {
        var contractId = document.getElementById('design-contract-id').value;
        var files = Array.prototype.slice.call(constructionFileEl.files || []);
        if (!contractId) { window.alert('계약 ID 없음'); constructionFileEl.value = ''; return; }
        if (!files.length) return;
        var inputEl = document.getElementById('design-construction-drawing-attachment');
        var existingUrls = parseDrawingUrls(inputEl && inputEl.value ? inputEl.value : '');
        Promise.all(files.map(function (file) { return uploadConstructionDrawingAttachment(contractId, file); }))
          .then(function (results) {
            var urls = results.filter(function (res) { return res && res.url; }).map(function (res) { return res.url; });
            if (!urls.length) { window.alert('업로드에 실패했습니다.'); return; }
            existingUrls = existingUrls.concat(urls);
            if (inputEl) {
              inputEl.value = serializeDrawingUrls(existingUrls);
              refreshDrawingFileListForInput(inputEl, document.getElementById('design-construction-drawing-list'));
            }
          })
          .finally(function () { constructionFileEl.value = ''; });
      });
    }
    if (constructionOpenBtn) {
      constructionOpenBtn.addEventListener('click', function () {
        openUrlFromInput('design-construction-drawing-attachment');
      });
    }
  }

  function showSection(sectionId) {
    // ??? ??? ???: admin/master/??????????? ???
    if (sectionId && sectionId.indexOf('admin-') === 0 && !isAdmin() && !isSuperAdmin()) {
      return;
    }
    if ((sectionId === 'hr' || sectionId === 'kpi') && !canSeeManageSection()) {
      return;
    }
    if ((sectionId === 'ceo-daily' || sectionId === 'ceo-weekly' || sectionId === 'ceo-monthly' || sectionId === 'ceo-dashboard' || sectionId === 'ceo-expense') && !canSeeCeoSection()) {
      return;
    }
    if ((sectionId === 'marketing' || sectionId === 'design' || sectionId === 'construction' ||
      sectionId === 'sales-leads' || sectionId === 'sales-customers' || sectionId === 'sales-contracts' ||
      sectionId === 'settlement-payment' || sectionId === 'settlement-incentive' ||
      sectionId === 'procurement' || sectionId === 'design-worklog' || sectionId === 'design-schedule' ||
      sectionId === 'design-priority' || sectionId === 'construction-worklog') &&
      !canAccessTeamSection(sectionId)) {
      window.alert('접근 권한이 없습니다.');
      return;
    }
    document.querySelectorAll('.content-section').forEach(function (el) {
      el.classList.toggle('active', el.id === 'section-' + sectionId);
    });
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-section') === sectionId);
    });
    if (sectionId === 'procurement') renderProcurement();
    if (sectionId === 'design-worklog') renderDesignWorklog();
    if (sectionId === 'design-schedule') renderDesignSchedule();
    if (sectionId === 'design-priority') renderDesignPriority();
    if (sectionId === 'announcements') renderAnnouncementsPage();
    if (sectionId === 'admin-approval') renderAdminApproval();
    if (sectionId === 'admin-employees') renderAdminEmployees();
    if (sectionId === 'admin-showrooms') renderAdminShowrooms();
    if (sectionId === 'admin-customers') renderAdminCustomers();
    if (sectionId === 'admin-contracts') renderAdminContracts();
    if (sectionId === 'admin-payments') renderAdminPayments();
    if (sectionId === 'admin-reservations') renderAdminReservations();
    if (sectionId === 'admin-presence') renderAdminPresence();
    if (sectionId === 'admin-activity-logs') {
      fetchActivityLogsForAdmin().then(function (rows) { renderAdminActivityLogs(rows); });
    }
    if (sectionId === 'team-calendar') renderTeamCalendar();
    if (sectionId === 'construction-worklog') renderConstructionWorklog();
    if (sectionId === 'ceo-dashboard') renderCeoDashboard();
    if (sectionId === 'ceo-daily') renderCeoReport('daily');
    if (sectionId === 'ceo-weekly') renderCeoReport('weekly');
    if (sectionId === 'ceo-monthly') renderCeoReport('monthly');
    if (sectionId === 'ceo-expense') renderExpenseList();
    if (sectionId === 'ceo-daily' || sectionId === 'ceo-weekly' || sectionId === 'ceo-monthly' || sectionId === 'ceo-expense') {
      var ceoSub = document.getElementById('nav-ceo-sub');
      var ceoGroup = document.getElementById('sidebar-group-ceo');
      var ceoBtn = document.getElementById('nav-ceo-toggle');
      if (ceoSub && ceoGroup) {
        ceoSub.classList.remove('collapsed');
        ceoGroup.classList.add('expanded');
        if (ceoBtn) ceoBtn.setAttribute('aria-expanded', 'true');
      }
    }
    if (sectionId && sectionId.indexOf('admin-') === 0) {
      var adminSub = document.getElementById('nav-admin-sub');
      var adminGroup = document.getElementById('sidebar-group-admin');
      var adminBtn = document.getElementById('nav-admin-toggle');
      if (adminSub && adminGroup) {
        adminSub.classList.remove('collapsed');
        adminGroup.classList.add('expanded');
        if (adminBtn) adminBtn.setAttribute('aria-expanded', 'true');
      }
    }
    if (sectionId === 'design' || sectionId === 'design-worklog' || sectionId === 'design-schedule' || sectionId === 'design-priority') {
      var desSub = document.getElementById('nav-design-sub');
      var desGroup = document.getElementById('sidebar-group-design');
      if (desSub && desGroup) {
        desSub.classList.remove('collapsed');
        desGroup.classList.add('expanded');
        var desBtn = document.getElementById('nav-design-toggle');
        if (desBtn) desBtn.setAttribute('aria-expanded', 'true');
      }
    }
    if (sectionId === 'construction' || sectionId === 'procurement' || sectionId === 'construction-worklog') {
      var conSub = document.getElementById('nav-construction-sub');
      var conGroup = document.getElementById('sidebar-group-construction');
      if (conSub && conGroup) {
        conSub.classList.remove('collapsed');
        conGroup.classList.add('expanded');
        var conBtn = document.getElementById('nav-construction-toggle');
        if (conBtn) conBtn.setAttribute('aria-expanded', 'true');
      }
    }
    if (sectionId === 'settlement-payment' || sectionId === 'settlement-incentive') {
      var sub = document.getElementById('nav-settlement-sub');
      var group = document.getElementById('sidebar-group-settlement');
      if (sub && group) {
        sub.classList.remove('collapsed');
        group.classList.add('expanded');
        var btn = document.getElementById('nav-settlement-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
    }
    if (sectionId === 'sales-leads' || sectionId === 'sales-contracts' || sectionId === 'sales-customers') {
      var salesSub = document.getElementById('nav-sales-sub');
      var salesGroup = document.getElementById('sidebar-group-sales');
      if (salesSub && salesGroup) {
        salesSub.classList.remove('collapsed');
        salesGroup.classList.add('expanded');
        var salesBtn = document.getElementById('nav-sales-toggle');
        if (salesBtn) salesBtn.setAttribute('aria-expanded', 'true');
      }
    }
  }

  function closeMobileSidebar() {
    document.body.classList.remove('sidebar-open');
  }

  function initMobileSidebar() {
    var btn = document.getElementById('mobile-menu-btn');
    var overlay = document.getElementById('sidebar-overlay');
    if (btn) {
      btn.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-open');
      });
    }
    if (overlay) {
      overlay.addEventListener('click', closeMobileSidebar);
    }
  }

  function initNav() {
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var section = el.getAttribute('data-section');
        if (section) showSection(section);
        closeMobileSidebar();
      });
    });
    var designToggle = document.getElementById('nav-design-toggle');
    var designSub = document.getElementById('nav-design-sub');
    var designGroup = document.getElementById('sidebar-group-design');
    if (designToggle && designSub && designGroup) {
      designToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        designSub.classList.toggle('collapsed');
        designGroup.classList.toggle('expanded');
        designToggle.setAttribute('aria-expanded', designSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
    var constructionToggle = document.getElementById('nav-construction-toggle');
    var constructionSub = document.getElementById('nav-construction-sub');
    var constructionGroup = document.getElementById('sidebar-group-construction');
    if (constructionToggle && constructionSub && constructionGroup) {
      constructionToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        constructionSub.classList.toggle('collapsed');
        constructionGroup.classList.toggle('expanded');
        constructionToggle.setAttribute('aria-expanded', constructionSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
    var settlementToggle = document.getElementById('nav-settlement-toggle');
    var settlementSub = document.getElementById('nav-settlement-sub');
    var settlementGroup = document.getElementById('sidebar-group-settlement');
    if (settlementToggle && settlementSub && settlementGroup) {
      settlementToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        settlementSub.classList.toggle('collapsed');
        settlementGroup.classList.toggle('expanded');
        settlementToggle.setAttribute('aria-expanded', settlementSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
    var salesToggle = document.getElementById('nav-sales-toggle');
    var salesSub = document.getElementById('nav-sales-sub');
    var salesGroup = document.getElementById('sidebar-group-sales');
    if (salesToggle && salesSub && salesGroup) {
      salesToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        salesSub.classList.toggle('collapsed');
        salesGroup.classList.toggle('expanded');
        salesToggle.setAttribute('aria-expanded', salesSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
    var adminToggle = document.getElementById('nav-admin-toggle');
    var adminSub = document.getElementById('nav-admin-sub');
    var adminGroup = document.getElementById('sidebar-group-admin');
    if (adminToggle && adminSub && adminGroup) {
      adminToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        adminSub.classList.toggle('collapsed');
        adminGroup.classList.toggle('expanded');
        adminToggle.setAttribute('aria-expanded', adminSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
    var ceoToggle = document.getElementById('nav-ceo-toggle');
    var ceoSub = document.getElementById('nav-ceo-sub');
    var ceoGroup = document.getElementById('sidebar-group-ceo');
    if (ceoToggle && ceoSub && ceoGroup) {
      ceoToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        ceoSub.classList.toggle('collapsed');
        ceoGroup.classList.toggle('expanded');
        ceoToggle.setAttribute('aria-expanded', ceoSub.classList.contains('collapsed') ? 'false' : 'true');
      });
    }
  }

  function initVisitForm() {
    var form = document.getElementById('form-visit');
    var toggle = document.getElementById('btn-toggle-visit-form');
    if (toggle) {
      toggle.addEventListener('click', function () {
        form.classList.toggle('hidden');
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var showroomId = document.getElementById('visit-showroom').value;
        var name = document.getElementById('visit-name').value.trim();
        var phone = document.getElementById('visit-phone').value.trim();
        var visitDate = document.getElementById('visit-date').value;
        var visitTime = document.getElementById('visit-time').value;
        var visitCount = document.getElementById('visit-count').value.trim();
        var source = document.getElementById('visit-source').value;
        var interestType = document.getElementById('visit-interest').value;
        var desiredPyeong = document.getElementById('visit-pyeong').value.trim();
        var budgetRange = document.getElementById('visit-budget').value.trim();
        var hasLand = document.getElementById('visit-hasland').value;
        var landAddress = document.getElementById('visit-land').value.trim();
        var lgEvent = document.getElementById('visit-lgevent').checked;
        var need3d = document.getElementById('visit-3d').checked;
        var memo = document.getElementById('visit-memo').value.trim();
        if (!showroomId) return;
        var visits = getVisits();
        visits.push({
          id: id(),
          showroomId: showroomId,
          name: name,
          phone: phone,
          visitDate: visitDate,
          visitTime: visitTime,
          visitCount: visitCount,
          source: source,
          interestType: interestType,
          desiredPyeong: desiredPyeong,
          budgetRange: budgetRange,
          hasLand: hasLand,
          landAddress: landAddress,
          lgEvent: lgEvent,
          need3d: need3d,
          memo: memo,
          createdAt: new Date().toISOString().slice(0, 10),
          status: '신규'
        });
        saveVisits(visits);
        form.reset();
        form.classList.add('hidden');
        renderMarketing();
        renderDashboard();
      });
    }
    var btnCancel = document.getElementById('btn-cancel-visit');
    if (btnCancel) btnCancel.addEventListener('click', function () { form.classList.add('hidden'); });
  }

  function assignToSales(visitId) {
    var targetShowroomId = getAssignShowroomValue(visitId);
    var visits = getVisits();
    var v = visits.find(function (x) { return x.id === visitId; });
    if (!v) return;
    if (targetShowroomId) v.showroomId = targetShowroomId;
    v.status = '영업배정';
    v.assignedToSalesAt = new Date().toISOString().slice(0, 10);
    saveVisits(visits);
    renderMarketing();
    renderSales();
  }

  function assignSelectedToSales() {
    var checked = document.querySelectorAll('.visit-row-check:checked');
    if (!checked.length) {
      alert('선택된 방문이 없습니다.');
      return;
    }
    var visits = getVisits();
    var updated = 0;
    checked.forEach(function (el) {
      var visitId = el.value;
      var targetShowroomId = getAssignShowroomValue(visitId);
      var v = visits.find(function (x) { return x.id === visitId; });
      if (v && v.status !== '영업배정') {
        if (targetShowroomId) v.showroomId = targetShowroomId;
        v.status = '영업배정';
        v.assignedToSalesAt = new Date().toISOString().slice(0, 10);
        updated++;
      }
    });
    saveVisits(visits);
    renderMarketing();
    renderSales();
    if (updated) alert(updated + '건 영업배정이 완료되었습니다.');
  }

  function initVisitAssign() {
    var btn = document.getElementById('btn-assign-selected');
    if (btn) btn.addEventListener('click', assignSelectedToSales);
    var checkAll = document.getElementById('visit-check-all');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        var on = checkAll.checked;
        document.querySelectorAll('.visit-row-check').forEach(function (cb) { cb.checked = on; });
      });
    }
  }

  function getContractModelNameFromForm() {
    var nameInput = document.getElementById('contract-model-name');
    return nameInput ? (nameInput.value || '').trim() : '';
  }

  function updateContractModelNamePreview() {
    var seriesSel = document.getElementById('contract-model-series');
    var sizeSel = document.getElementById('contract-model-size');
    var colorSel = document.getElementById('contract-model-color');
    var nameInput = document.getElementById('contract-model-name');
    if (!seriesSel || !sizeSel || !colorSel || !nameInput) return;
    var series = (seriesSel.value || '').trim();
    var size = (sizeSel.value || '').trim();
    var color = (colorSel.value || '').trim();
    if (!series || !size) {
      nameInput.value = '';
      return;
    }
    var colorSuffix = '';
    if (color) {
      colorSuffix = color.length === 2 ? color.toUpperCase() : color.charAt(0).toUpperCase();
    }
    var code = series + size + colorSuffix;
    nameInput.value = '세움' + code;
  }

  function openContractForm(visitId) {
    var visits = getVisits();
    var v = visits.find(function (x) { return x.id === visitId; });
    var wrap = document.getElementById('contract-form-wrap');
    var showroomEl = document.getElementById('contract-showroom');
    document.getElementById('contract-visit-id').value = visitId || '';
    if (showroomEl) {
      showroomEl.value = v ? (v.showroomId || '') : '';
      // ?????????? ???????????? ??????????? ???
      if (!showroomEl.value && typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
        var cur = window.seumAuth.currentEmployee;
        if ((cur.team || '').trim() === '영업' && cur.showroom) {
          showroomEl.value = cur.showroom;
        }
      }
    }
    var seriesSel = document.getElementById('contract-model-series');
    var sizeSel = document.getElementById('contract-model-size');
    var colorSel = document.getElementById('contract-model-color');
    var nameInput = document.getElementById('contract-model-name');
    if (seriesSel) seriesSel.value = '';
    if (sizeSel) sizeSel.value = '';
    if (colorSel) colorSel.value = '';
    if (nameInput) nameInput.value = '';
    document.getElementById('contract-sales-person').value = '';
    document.getElementById('contract-name').value = v ? v.name : '';
    document.getElementById('contract-phone').value = v ? v.phone : '';
    document.getElementById('contract-total').value = '';
    document.getElementById('contract-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('contract-deposit-amount').value = '';
    document.getElementById('contract-deposit-date').value = '';
    document.getElementById('contract-progress1-amount').value = '';
    document.getElementById('contract-progress2-amount').value = '';
    document.getElementById('contract-progress3-amount').value = '';
    document.getElementById('contract-balance-amount').value = '';
    if (wrap) wrap.classList.remove('hidden');
  }

  function linkOrText(val) {
    if (!val) return '-';
    var raw = String(val).trim();
    if (!raw) return '-';
    var urls = parseDrawingUrls(raw);
    if (urls.length > 0) {
      return urls.map(function (url) {
        var name = url.split('/').pop().replace(/^\d+_/, '');
        return '<div style="margin-bottom:2px"><a href="' + url + '" target="_blank" rel="noopener">' + name + '</a></div>';
      }).join('');
    }
    return val;
  }

  function openUrlFromInput(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return;
    var raw = (el.value || '').trim();
    if (!raw) {
      window.alert('파일이 없습니다.');
      return;
    }
    // ?????? ??? URL???????? ??
    var urls = parseDrawingUrls(raw);
    var val = urls.length ? urls[urls.length - 1] : raw;
    if (!/^https?:\/\//i.test(val)) {
      window.alert('URL ???????????. ????????????????????? ????');
      return;
    }
    window.open(val, '_blank');
  }

  var expandedContractId = null;

  function syncDesignRequestRoomModes() {
    ['bedroom', 'living', 'kitchen', 'bath'].forEach(function (room) {
      var r = document.querySelector('input[name="contract-inline-room-' + room + '"]:checked');
      var memo = document.getElementById('contract-inline-memo-' + room);
      if (memo) {
        memo.disabled = !r || r.value !== 'change';
      }
    });
  }

  function syncDesignRequestExternalModes() {
    ['deck', 'porch', 'yard', 'parking'].forEach(function (ext) {
      var r = document.querySelector('input[name="contract-inline-external-' + ext + '"]:checked');
      var memo = document.getElementById('contract-inline-external-' + ext + '-memo');
      if (memo) {
        memo.disabled = !r || r.value !== 'add';
      }
    });
  }

  function updateDesignHandoverSummary() {
    var summaryEl = document.getElementById('contract-inline-design-handover-summary');
    if (!summaryEl) return;
    var lines = [];
    var roomLabels = { bedroom: '침실/방', living: '거실', kitchen: '주방', bath: '욕실' };
    ['bedroom', 'living', 'kitchen', 'bath'].forEach(function (room) {
      var r = document.querySelector('input[name="contract-inline-room-' + room + '"]:checked');
      var memo = document.getElementById('contract-inline-memo-' + room);
      var txt = memo && memo.value ? (memo.value || '').trim() : '';
      if (r && r.value === 'change' && txt) {
        lines.push(roomLabels[room] + ' : ' + txt);
      }
    });
    var extLabels = { deck: '데크', porch: '포치', yard: '마당', parking: '주차' };
    ['deck', 'porch', 'yard', 'parking'].forEach(function (ext) {
      var r = document.querySelector('input[name="contract-inline-external-' + ext + '"]:checked');
      var memo = document.getElementById('contract-inline-external-' + ext + '-memo');
      var txt = memo && memo.value ? (memo.value || '').trim() : '';
      if (r && r.value === 'add') {
        lines.push('외부공간 ' + extLabels[ext] + ' : ' + (txt || '메모 없음'));
      }
    });
    var winAdd = document.getElementById('contract-inline-window-add-memo');
    var winPos = document.getElementById('contract-inline-window-position-memo');
    var winSize = document.getElementById('contract-inline-window-size-memo');
    var winParts = [];
    if (winAdd && (winAdd.value || '').trim()) winParts.push('창 추가: ' + (winAdd.value || '').trim());
    if (winPos && (winPos.value || '').trim()) winParts.push('창 위치 변경: ' + (winPos.value || '').trim());
    if (winSize && (winSize.value || '').trim()) winParts.push('창 크기 변경: ' + (winSize.value || '').trim());
    if (winParts.length) lines.push('창호 : ' + winParts.join(', '));
    var extMatR = document.querySelector('input[name="contract-inline-exterior-material"]:checked');
    if (extMatR && extMatR.value !== 'default') {
      var matLabels = { ceramic: '세라믹사이딩', longbrick: '롱브릭', smart: '스마트사이딩' };
      lines.push('외장재: ' + (matLabels[extMatR.value] || extMatR.value));
    }
    var facCf = document.getElementById('contract-inline-facility-ceiling-fan');
    var facAc = document.getElementById('contract-inline-facility-aircon');
    var facOut = document.getElementById('contract-inline-facility-outlet');
    var facLight = document.getElementById('contract-inline-facility-lighting');
    var facParts = [];
    if (facCf && (facCf.value || '').trim()) facParts.push('실링팬: ' + (facCf.value || '').trim());
    if (facAc && (facAc.value || '').trim()) facParts.push('에어컨: ' + (facAc.value || '').trim());
    if (facOut && (facOut.value || '').trim()) facParts.push('콘센트: ' + (facOut.value || '').trim());
    if (facLight && (facLight.value || '').trim()) facParts.push('조명 ' + (facLight.value || '').trim());
    if (facParts.length) lines.push('설비/전기 : ' + facParts.join(', '));
    var etc = document.getElementById('contract-inline-memo-etc');
    if (etc && (etc.value || '').trim()) lines.push('기타 : ' + (etc.value || '').trim());
    var extNote = document.getElementById('contract-inline-exterior');
    if (extNote && (extNote.value || '').trim()) lines.push('외장재 메모 : ' + (extNote.value || '').trim());
    var extra = document.getElementById('contract-inline-extra');
    if (extra && (extra.value || '').trim()) lines.push('추가 내용 : ' + (extra.value || '').trim());
    var header = '[설계팀 인계 메모]\n\n';
    summaryEl.value = lines.length ? header + lines.join('\n') : '';
  }

  function showContractDetailPanel(contractId, forceRefresh) {
    var tbody = document.getElementById('tbody-contracts');
    var panel = document.getElementById('contract-detail-panel');
    if (!tbody || !panel) return;
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;

    var detailRow = tbody.querySelector('.contract-detail-row');
    var isOpenForSame = detailRow && !detailRow.classList.contains('hidden') && expandedContractId === contractId;

    if (!forceRefresh && isOpenForSame) {
      detailRow.classList.add('hidden');
      document.querySelectorAll('.contract-row.selected').forEach(function (r) { r.classList.remove('selected'); });
      expandedContractId = null;
      return;
    }

    if (!detailRow) {
      detailRow = document.createElement('tr');
      detailRow.className = 'contract-detail-row';
      var td = document.createElement('td');
      td.colSpan = 13;
      td.className = 'contract-detail-cell';
      td.appendChild(panel);
      detailRow.appendChild(td);
    }
    var row = tbody.querySelector('.contract-row[data-contract-id="' + contractId + '"]');
    if (!row) return;
    tbody.insertBefore(detailRow, row.nextSibling);
    detailRow.classList.remove('hidden');

    var titleEl = document.getElementById('contract-detail-customer');
    var subtitleEl = document.getElementById('contract-detail-subtitle');
    if (titleEl) titleEl.textContent = (c.customerName || '-') + ' 계약 상세';
    if (subtitleEl) subtitleEl.textContent = getShowroomName(c.showroomId) + ' | ' + (c.contractModelName || c.contractModel || '-') + ' | ' + formatMoney(Math.round(Number(c.totalAmount) / (c.amountUnit === 'manwon' ? 1 : 10000))) + '만원';
    document.getElementById('contract-inline-id').value = c.id;
    document.getElementById('contract-inline-showroom').value = c.showroomId || '';
    var inlineModelShowroomEl = document.getElementById('contract-inline-model-showroom');
    if (inlineModelShowroomEl) inlineModelShowroomEl.value = c.modelShowroomId || '';
    document.getElementById('contract-inline-model').value = c.contractModel || '';
    document.getElementById('contract-inline-model-name').value = c.contractModelName || '';
    document.getElementById('contract-inline-sales-person').value = c.salesPerson || '';
    var inlinePhoneEl = document.getElementById('contract-inline-phone');
    if (inlinePhoneEl) inlinePhoneEl.value = c.phone || '';
    document.getElementById('contract-inline-attachment').value = c.contractAttachment || '';
    if (typeof window.syncContractAttachCard === 'function') window.syncContractAttachCard();
    if (typeof window.syncExtraAttachList === 'function') window.syncExtraAttachList();
    document.getElementById('contract-inline-site-address').value = c.siteAddress || '';
    var inlineInstall = document.querySelector('input[name="contract-inline-install-type"][value="' + (c.installType || '현장시공') + '"]');
    if (inlineInstall) inlineInstall.checked = true;
    document.getElementById('contract-inline-foundation-pyeong').value = c.foundationPyeong != null && c.foundationPyeong !== '' ? c.foundationPyeong : '';
    document.getElementById('contract-inline-house-pyeong').value = c.housePyeong != null && c.housePyeong !== '' ? c.housePyeong : '';
    var opt = c.options || {};
    ['porch', 'deck', 'sunroom', 'demolition', 'repair', 'interior'].forEach(function (key) {
      var o = opt[key] || {};
      var optRow = document.querySelector('#form-contract-inline .option-row[data-option="' + key + '"]');
      if (optRow) {
        var cb = optRow.querySelector('.option-toggle');
        var inp = optRow.querySelector('.option-pyeong-input');
        if (cb) { cb.checked = !!o.enabled; }
        if (inp) { inp.disabled = !o.enabled; inp.value = (o.pyeong != null && o.pyeong !== '') ? o.pyeong : ''; }
      }
    });
    var memoBedroomEl = document.getElementById('contract-inline-memo-bedroom');
    if (memoBedroomEl) memoBedroomEl.value = c.memoBedroom || '';
    var memoLivingEl = document.getElementById('contract-inline-memo-living');
    if (memoLivingEl) memoLivingEl.value = c.memoLiving || '';
    var memoKitchenEl = document.getElementById('contract-inline-memo-kitchen');
    if (memoKitchenEl) memoKitchenEl.value = c.memoKitchen || '';
    var memoBathEl = document.getElementById('contract-inline-memo-bath');
    if (memoBathEl) memoBathEl.value = c.memoBath || '';
    var memoEtcEl = document.getElementById('contract-inline-memo-etc');
    if (memoEtcEl) memoEtcEl.value = c.memoEtc || '';
    var exteriorEl = document.getElementById('contract-inline-exterior');
    if (exteriorEl) exteriorEl.value = c.exteriorNote || '';
    var extraEl = document.getElementById('contract-inline-extra');
    if (extraEl) extraEl.value = c.extraNote || '';
    // ??? ???: ?? ??/???
    ['bedroom', 'living', 'kitchen', 'bath'].forEach(function (room) {
      var key = room + 'Mode';
      var mode = (c[key] || 'basic');
      var radio = document.querySelector('input[name="contract-inline-room-' + room + '"][value="' + mode + '"]');
      if (radio) radio.checked = true;
    });
    // ????: ???/???/??/??
    ['deck', 'porch', 'yard', 'parking'].forEach(function (ext) {
      var key = 'external' + ext.charAt(0).toUpperCase() + ext.slice(1);
      var val = (c[key] || 'none');
      var radio = document.querySelector('input[name="contract-inline-external-' + ext + '"][value="' + (val || 'none') + '"]');
      if (radio) radio.checked = true;
      var memoEl = document.getElementById('contract-inline-external-' + ext + '-memo');
      if (memoEl) {
        memoEl.value = (c[key + 'Memo'] || '');
        memoEl.disabled = val !== 'add';
      }
    });
    var winAdd = document.getElementById('contract-inline-window-add-memo');
    if (winAdd) winAdd.value = c.windowAddMemo || '';
    var winPos = document.getElementById('contract-inline-window-position-memo');
    if (winPos) winPos.value = c.windowPositionMemo || '';
    var winSize = document.getElementById('contract-inline-window-size-memo');
    if (winSize) winSize.value = c.windowSizeMemo || '';
    var extMat = document.querySelector('input[name="contract-inline-exterior-material"][value="' + (c.exteriorMaterialType || 'default') + '"]');
    if (extMat) extMat.checked = true;
    var facCf = document.getElementById('contract-inline-facility-ceiling-fan');
    if (facCf) facCf.value = c.facilityCeilingFan || '';
    var facAc = document.getElementById('contract-inline-facility-aircon');
    if (facAc) facAc.value = c.facilityAircon || '';
    var facOut = document.getElementById('contract-inline-facility-outlet');
    if (facOut) facOut.value = c.facilityOutlet || '';
    var facLight = document.getElementById('contract-inline-facility-lighting');
    if (facLight) facLight.value = c.facilityLighting || '';
    var summaryEl = document.getElementById('contract-inline-design-handover-summary');
    if (summaryEl) summaryEl.value = c.designHandoverSummary || '';
    syncDesignRequestRoomModes();
    syncDesignRequestExternalModes();
    // ??? ???????? ?????? ???? ????(?? ????? ???)
    panel.setAttribute('data-current-id', contractId);
    // ??? hidden ???????? (?? ??? ??? ???????????
    panel.classList.remove('hidden');
    document.querySelectorAll('.contract-row.selected').forEach(function (r) { r.classList.remove('selected'); });
    if (row) row.classList.add('selected');
    expandedContractId = contractId;
  }

  function saveContractInline() {
    var contractId = document.getElementById('contract-inline-id').value;
    if (!contractId) return;
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    c.showroomId = document.getElementById('contract-inline-showroom').value || '';
    var inlineModelShowroom = document.getElementById('contract-inline-model-showroom');
    c.modelShowroomId = inlineModelShowroom ? (inlineModelShowroom.value || '') : (c.modelShowroomId || '');
    c.contractModel = document.getElementById('contract-inline-model').value || '';
    c.contractModelName = document.getElementById('contract-inline-model-name').value.trim();
    c.salesPerson = document.getElementById('contract-inline-sales-person').value.trim();
    var inlinePhoneSave = document.getElementById('contract-inline-phone');
    if (inlinePhoneSave) c.phone = inlinePhoneSave.value.trim();
    c.contractAttachment = document.getElementById('contract-inline-attachment').value.trim();
    c.siteAddress = document.getElementById('contract-inline-site-address').value.trim();
    var inlineInstallChecked = document.querySelector('input[name="contract-inline-install-type"]:checked');
    c.installType = inlineInstallChecked ? inlineInstallChecked.value : '현장시공';
    c.foundationPyeong = (document.getElementById('contract-inline-foundation-pyeong').value || '').trim();
    c.housePyeong = (document.getElementById('contract-inline-house-pyeong').value || '').trim();
    c.options = c.options || { porch: { enabled: false, pyeong: '' }, deck: { enabled: false, pyeong: '' }, sunroom: { enabled: false, pyeong: '' }, demolition: { enabled: false, pyeong: '' }, repair: { enabled: false, pyeong: '' }, interior: { enabled: false, pyeong: '' } };
    ['porch', 'deck', 'sunroom', 'demolition', 'repair', 'interior'].forEach(function (key) {
      var row = document.querySelector('#form-contract-inline .option-row[data-option="' + key + '"]');
      if (row) {
        var cb = row.querySelector('.option-toggle');
        var inp = row.querySelector('.option-pyeong-input');
        c.options[key] = { enabled: cb ? cb.checked : false, pyeong: (inp && !inp.disabled ? inp.value : '') ? (inp.value || '').trim() : '' };
      }
    });
    var memoBedroomIn = document.getElementById('contract-inline-memo-bedroom');
    var memoLivingIn = document.getElementById('contract-inline-memo-living');
    var memoKitchenIn = document.getElementById('contract-inline-memo-kitchen');
    var memoBathIn = document.getElementById('contract-inline-memo-bath');
    var memoEtcIn = document.getElementById('contract-inline-memo-etc');
    c.memoBedroom = memoBedroomIn ? (memoBedroomIn.value || '').trim() : '';
    c.memoLiving = memoLivingIn ? (memoLivingIn.value || '').trim() : '';
    c.memoKitchen = memoKitchenIn ? (memoKitchenIn.value || '').trim() : '';
    c.memoBath = memoBathIn ? (memoBathIn.value || '').trim() : '';
    c.memoEtc = memoEtcIn ? (memoEtcIn.value || '').trim() : '';
    var exteriorIn = document.getElementById('contract-inline-exterior');
    var extraIn = document.getElementById('contract-inline-extra');
    c.exteriorNote = exteriorIn ? (exteriorIn.value || '').trim() : '';
    c.extraNote = extraIn ? (extraIn.value || '').trim() : '';
    ['bedroom', 'living', 'kitchen', 'bath'].forEach(function (room) {
      var r = document.querySelector('input[name="contract-inline-room-' + room + '"]:checked');
      c[room + 'Mode'] = r ? r.value : 'basic';
    });
    ['deck', 'porch', 'yard', 'parking'].forEach(function (ext) {
      var r = document.querySelector('input[name="contract-inline-external-' + ext + '"]:checked');
      var val = r ? r.value : 'none';
      c['external' + ext.charAt(0).toUpperCase() + ext.slice(1)] = val;
      var m = document.getElementById('contract-inline-external-' + ext + '-memo');
      c['external' + ext.charAt(0).toUpperCase() + ext.slice(1) + 'Memo'] = m ? (m.value || '').trim() : '';
    });
    var winAdd = document.getElementById('contract-inline-window-add-memo');
    c.windowAddMemo = winAdd ? (winAdd.value || '').trim() : '';
    var winPos = document.getElementById('contract-inline-window-position-memo');
    c.windowPositionMemo = winPos ? (winPos.value || '').trim() : '';
    var winSize = document.getElementById('contract-inline-window-size-memo');
    c.windowSizeMemo = winSize ? (winSize.value || '').trim() : '';
    var extMatR = document.querySelector('input[name="contract-inline-exterior-material"]:checked');
    c.exteriorMaterialType = extMatR ? extMatR.value : 'default';
    var facCf = document.getElementById('contract-inline-facility-ceiling-fan');
    c.facilityCeilingFan = facCf ? (facCf.value || '').trim() : '';
    var facAc = document.getElementById('contract-inline-facility-aircon');
    c.facilityAircon = facAc ? (facAc.value || '').trim() : '';
    var facOut = document.getElementById('contract-inline-facility-outlet');
    c.facilityOutlet = facOut ? (facOut.value || '').trim() : '';
    var facLight = document.getElementById('contract-inline-facility-lighting');
    c.facilityLighting = facLight ? (facLight.value || '').trim() : '';
    var summaryIn = document.getElementById('contract-inline-design-handover-summary');
    c.designHandoverSummary = summaryIn ? (summaryIn.value || '').trim() : '';
    saveContracts(contracts);
    showToast('계약 상세 정보가 저장됐습니다.');
    renderSales();
    showContractDetailPanel(contractId, true);
  }

  function initContractDetailPanel() {
    var form = document.getElementById('form-contract-inline');
    var panel = document.getElementById('contract-detail-panel');
    var modalBtn = document.getElementById('contract-detail-modal-btn');

    document.addEventListener('click', function (e) {
      var header = e.target.closest('.design-request-accordion-header');
      if (!header) return;
      e.preventDefault();
      var item = header.closest('.design-request-accordion-item');
      var bodyId = header.getAttribute('data-accordion');
      var body = bodyId ? document.getElementById('accordion-' + bodyId) : item && item.querySelector('.design-request-accordion-body');
      if (!item || !body) return;
      var isOpen = item.classList.contains('open');
      if (isOpen) {
        item.classList.remove('open');
        body.setAttribute('hidden', '');
        header.setAttribute('aria-expanded', 'false');
        var icon = header.querySelector('.design-request-accordion-icon');
        if (icon) icon.textContent = '\u25B6';
      } else {
        item.classList.add('open');
        body.removeAttribute('hidden');
        header.setAttribute('aria-expanded', 'true');
        var icon = header.querySelector('.design-request-accordion-icon');
        if (icon) icon.textContent = '\u25BC';
      }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveContractInline();
      });
    }
    var saveBtn = document.getElementById('btn-contract-inline-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function (e) {
        e.preventDefault();
        saveContractInline();
      });
    }
    var inlineDeleteBtn = document.getElementById('btn-contract-inline-delete');
    if (inlineDeleteBtn) {
      inlineDeleteBtn.addEventListener('click', function () {
        var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
        if (!contractId) return;
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee ? window.seumAuth.currentEmployee : null;
        var team = cur ? (cur.team || '').trim() : '';
        var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        var canSalesDeleteOwn = cur && team === '영업' && (cur.name || '').trim() && String(c.salesPerson || '').trim() === (cur.name || '').trim();
        if (!isAdminRole && !canSalesDeleteOwn) {
          window.alert('계약 삭제 권한이 없습니다. 관리자에게 문의하세요.');
          return;
        }
        if (!window.confirm('이 계약을 삭제하시겠습니까?')) return;
        deleteContractById(contractId);
      });
    }
    // 계약서 첨부: 플레이스홀더 클릭으로 파일 선택 (btn-contract-inline-attach 없음)
    var inlineFileInput = document.getElementById('contract-inline-attachment-file');
    var inlineUploadBtn = document.getElementById('btn-contract-inline-attach');
    if (inlineUploadBtn) inlineUploadBtn.addEventListener('click', function () { inlineFileInput && inlineFileInput.click(); });
    if (inlineFileInput) {
      inlineFileInput.addEventListener('change', function () {
        var file = inlineFileInput.files && inlineFileInput.files[0];
        if (!file) return;
        var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
        if (!contractId) {
          inlineFileInput.value = '';
          window.alert('계약을 먼저 선택하거나 저장한 뒤 계약서를 업로드해 주세요.');
          return;
        }
        var placeholder = document.getElementById('contract-attach-card-placeholder');
        var fileBlock = document.getElementById('contract-attach-card-file');
        var filenameEl = document.getElementById('contract-attach-card-filename');
        var viewLink = document.getElementById('contract-attach-card-view');
        if (placeholder && fileBlock && filenameEl) {
          placeholder.classList.add('hidden');
          fileBlock.classList.remove('hidden');
          filenameEl.textContent = '업로드 중... ' + (file.name || '');
          if (viewLink) viewLink.style.display = 'none';
        }
        uploadContractAttachment(contractId, file).then(function (res) {
          inlineFileInput.value = '';
          if (!res || !res.url) {
            if (placeholder && fileBlock) {
              placeholder.classList.remove('hidden');
              fileBlock.classList.add('hidden');
            }
            window.alert('파일 업로드에 실패했습니다.');
            return;
          }
          var input = document.getElementById('contract-inline-attachment');
          if (input) input.value = res.url;
          var contracts = getContracts();
          var contract = contracts.find(function (x) { return x.id === contractId; });
          if (contract) {
            contract.contractAttachment = res.url;
            saveContracts(contracts);
          }
          if (placeholder && fileBlock && filenameEl) {
            placeholder.classList.add('hidden');
            fileBlock.classList.remove('hidden');
            var displayName = (res.name || res.url.replace(/^.*\//, '')).replace(/^\d+_/, '');
            filenameEl.textContent = displayName || '첨부됨';
            if (viewLink) {
              viewLink.href = res.url;
              viewLink.style.display = '';
            }
          }
          if (typeof syncContractAttachCard === 'function') {
            syncContractAttachCard();
            setTimeout(syncContractAttachCard, 50);
          }
        });
      });
    }
    function syncContractAttachCard() {
      var input = document.getElementById('contract-inline-attachment');
      var placeholder = document.getElementById('contract-attach-card-placeholder');
      var fileBlock = document.getElementById('contract-attach-card-file');
      var filenameEl = document.getElementById('contract-attach-card-filename');
      var viewLink = document.getElementById('contract-attach-card-view');
      if (!input || !placeholder || !fileBlock) return;
      var val = (input.value || '').trim();
      if (!val) {
        placeholder.classList.remove('hidden');
        fileBlock.classList.add('hidden');
        if (viewLink) viewLink.removeAttribute('href');
        return;
      }
      placeholder.classList.add('hidden');
      fileBlock.classList.remove('hidden');
      var displayName = val.indexOf('/') !== -1 ? val.replace(/^.*\//, '') : val;
      if (displayName && /^\d+_/.test(displayName)) displayName = displayName.replace(/^\d+_/, '');
      if (filenameEl) filenameEl.textContent = displayName || '첨부됨';
      if (viewLink) {
        viewLink.href = /^https?:\/\//i.test(val) ? val : '#';
        viewLink.style.display = /^https?:\/\//i.test(val) ? '' : 'none';
      }
    }
    if (typeof window !== 'undefined') window.syncContractAttachCard = syncContractAttachCard;
    var attachCard = document.getElementById('contract-attach-card');
    var attachPlaceholder = document.getElementById('contract-attach-card-placeholder');
    if (attachCard && attachPlaceholder && inlineFileInput) {
      attachPlaceholder.addEventListener('click', function () { inlineFileInput.click(); });
    }
    var attachViewLink = document.getElementById('contract-attach-card-view');
    if (attachViewLink) {
      attachViewLink.addEventListener('click', function (e) {
        if (this.getAttribute('href') === '#') e.preventDefault();
      });
    }
    var attachRemoveBtn = document.getElementById('contract-attach-card-remove');
    if (attachRemoveBtn) {
      attachRemoveBtn.addEventListener('click', function () {
        var input = document.getElementById('contract-inline-attachment');
        if (input) input.value = '';
        var fileInput = document.getElementById('contract-inline-attachment-file');
        if (fileInput) fileInput.value = '';
        if (typeof syncContractAttachCard === 'function') syncContractAttachCard();
        // 저장된 계약에도 즉시 반영
        var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
        if (contractId) {
          var contracts = getContracts();
          var c = contracts.find(function (x) { return x.id === contractId; });
          if (c) { c.contractAttachment = ''; saveContracts(contracts); }
        }
      });
    }

    // 추가 자료 첨부 핸들러
    var extraFileInput = document.getElementById('contract-extra-attachment-file');
    var extraCard = document.getElementById('contract-extra-attach-card');
    var extraPlaceholder = document.getElementById('contract-extra-attach-placeholder');
    var extraList = document.getElementById('contract-extra-attach-list');

    function renderExtraAttachList(attachments) {
      if (!extraList) return;
      extraList.innerHTML = '';
      if (!attachments || !attachments.length) {
        if (extraPlaceholder) extraPlaceholder.style.display = '';
        return;
      }
      if (extraPlaceholder) extraPlaceholder.style.display = 'none';
      attachments.forEach(function (item, idx) {
        var li = document.createElement('li');
        var nameSpan = document.createElement('span');
        nameSpan.className = 'extra-file-name';
        var displayName = (item.name || item.url.replace(/^.*\//, '')).replace(/^\d+_/, '');
        nameSpan.textContent = displayName || '첨부됨';
        var viewA = document.createElement('a');
        viewA.className = 'extra-file-view';
        viewA.href = item.url;
        viewA.target = '_blank';
        viewA.rel = 'noopener';
        viewA.textContent = '보기';
        var removeBtn = document.createElement('button');
        removeBtn.className = 'extra-file-remove';
        removeBtn.textContent = '✕';
        removeBtn.title = '삭제';
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
          if (!contractId) return;
          var contracts = getContracts();
          var contract = contracts.find(function (x) { return x.id === contractId; });
          if (contract && Array.isArray(contract.extraAttachments)) {
            contract.extraAttachments.splice(idx, 1);
            saveContracts(contracts);
            renderExtraAttachList(contract.extraAttachments);
          }
        });
        li.appendChild(nameSpan);
        li.appendChild(viewA);
        li.appendChild(removeBtn);
        extraList.appendChild(li);
      });
      // 추가 업로드 버튼 (목록 있을 때도 클릭 가능하게)
      if (extraPlaceholder) extraPlaceholder.style.display = '';
      if (extraPlaceholder) {
        extraPlaceholder.querySelector('.contract-attach-card-placeholder-text').textContent = '+ 추가 자료 업로드';
      }
    }

    function syncExtraAttachList() {
      var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
      if (!contractId) { renderExtraAttachList([]); return; }
      var contracts = getContracts();
      var contract = contracts.find(function (x) { return x.id === contractId; });
      renderExtraAttachList(contract && contract.extraAttachments || []);
    }
    if (typeof window !== 'undefined') window.syncExtraAttachList = syncExtraAttachList;

    if (extraCard && extraPlaceholder && extraFileInput) {
      extraPlaceholder.addEventListener('click', function () { extraFileInput.click(); });
    }

    if (extraFileInput) {
      extraFileInput.addEventListener('change', function () {
        var files = extraFileInput.files;
        if (!files || !files.length) return;
        var contractId = document.getElementById('contract-inline-id') && document.getElementById('contract-inline-id').value;
        if (!contractId) {
          extraFileInput.value = '';
          window.alert('계약을 먼저 선택하거나 저장한 뒤 추가 자료를 업로드해 주세요.');
          return;
        }
        var uploads = Array.prototype.slice.call(files).map(function (file) {
          return uploadContractExtraFile(contractId, file);
        });
        Promise.all(uploads).then(function (results) {
          extraFileInput.value = '';
          var succeeded = results.filter(Boolean);
          if (!succeeded.length) {
            window.alert('파일 업로드에 실패했습니다.');
            return;
          }
          var contracts = getContracts();
          var contract = contracts.find(function (x) { return x.id === contractId; });
          if (contract) {
            if (!Array.isArray(contract.extraAttachments)) contract.extraAttachments = [];
            succeeded.forEach(function (res) {
              contract.extraAttachments.push({ url: res.url, name: res.name });
            });
            saveContracts(contracts);
            renderExtraAttachList(contract.extraAttachments);
          }
        });
      });
    }

    if (modalBtn && panel) {
      modalBtn.addEventListener('click', function () {
        var id = panel.getAttribute('data-current-id');
        if (id) openContractDetail(id);
      });
    }
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('option-toggle')) {
        var row = e.target.closest('.option-row');
        if (!row) return;
        var opt = e.target.getAttribute('data-option');
        var inp = row.querySelector('.option-pyeong-input[data-option="' + opt + '"]');
        if (inp) {
          inp.disabled = !e.target.checked;
          if (!e.target.checked) inp.value = '';
        }
      }
      if (e.target.classList.contains('design-request-room-mode')) {
        syncDesignRequestRoomModes();
        updateDesignHandoverSummary();
      }
      if (e.target.classList.contains('design-request-external-mode')) {
        syncDesignRequestExternalModes();
        updateDesignHandoverSummary();
      }
      if (e.target.classList.contains('design-request-exterior-material')) {
        updateDesignHandoverSummary();
      }
      if (e.target.closest('.design-request-section')) {
        if (e.target.id && (e.target.id.indexOf('contract-inline-memo-') === 0 || e.target.id.indexOf('contract-inline-external-') === 0 || e.target.id.indexOf('contract-inline-window-') === 0 || e.target.id.indexOf('contract-inline-facility-') === 0 || e.target.id === 'contract-inline-exterior' || e.target.id === 'contract-inline-extra' || e.target.id === 'contract-inline-design-handover-summary')) {
          if (e.target.id !== 'contract-inline-design-handover-summary') {
            updateDesignHandoverSummary();
          }
        }
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.closest('.design-request-section') && e.target.id !== 'contract-inline-design-handover-summary') {
        if (e.target.id && (e.target.id.indexOf('contract-inline-memo-') === 0 || e.target.id.indexOf('contract-inline-external-') === 0 || e.target.id.indexOf('contract-inline-window-') === 0 || e.target.id.indexOf('contract-inline-facility-') === 0 || e.target.id === 'contract-inline-exterior' || e.target.id === 'contract-inline-extra')) {
          updateDesignHandoverSummary();
        }
      }
    });
  }

  function openContractDetail(contractId) {
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    document.getElementById('detail-contract-id').value = c.id;
    var designView = document.getElementById('detail-design-full-view');
    if (designView) {
      var rows = [
        ['유형', c.projectType || '-'],
        ['계약서 파일', linkOrText(c.contractAttachment)],
        ['설계 도면 URL', linkOrText(c.designDrawingAttachment)],
        ['시공 도면 URL', linkOrText(c.constructionDrawingAttachment)]
      ];
      if ((c.contractModel || '') === '전원주택') {
        rows.push(['건축사 정보', c.architectInfo || '-']);
        rows.push(['담당자 이름', c.designContactName || '-']);
        rows.push(['담당자 연락처', c.designContactPhone || '-']);
        rows.push(['건축허가서 수령', c.hasPermitCert ? '완료' : '미완']);
        rows.push(['건축허가서 URL', linkOrText(c.permitAttachment)]);
        rows.push(['착공신고서', c.hasConstructionStartReport ? '완료' : '미완']);
        rows.push(['사용승인서', c.hasCompletionCert ? '완료' : '미완']);
        rows.push(['착공 준비완료 (시공팀 인계 준비)', c.constructionStartOk ? 'Y' : '-']);
      }
      var html = '<table class="detail-table"><tbody>' + rows.map(function (r) {
        return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table>';
      designView.innerHTML = html;
    }
    document.getElementById('detail-showroom').value = c.showroomId || '';
    var detailModelShowroomEl = document.getElementById('detail-model-showroom');
    if (detailModelShowroomEl) detailModelShowroomEl.value = c.modelShowroomId || '';
    document.getElementById('detail-model').value = c.contractModel || '';
    document.getElementById('detail-model-name').value = c.contractModelName || '';
    document.getElementById('detail-sales-person').value = c.salesPerson || '';
    document.getElementById('detail-contract-attachment').value = c.contractAttachment || '';
    document.getElementById('detail-site-address').value = c.siteAddress || '';
    var detailInstall = document.querySelector('input[name="detail-install-type"][value="' + (c.installType || '현장시공') + '"]');
    if (detailInstall) detailInstall.checked = true;
    document.getElementById('detail-foundation-pyeong').value = c.foundationPyeong != null && c.foundationPyeong !== '' ? c.foundationPyeong : '';
    document.getElementById('detail-house-pyeong').value = c.housePyeong != null && c.housePyeong !== '' ? c.housePyeong : '';
    var opt = c.options || {};
    ['porch', 'deck', 'sunroom'].forEach(function (key) {
      var o = opt[key] || {};
      var row = document.querySelector('#form-contract-detail .option-row[data-option="' + key + '"]');
      if (row) {
        var cb = row.querySelector('.option-toggle');
        var inp = row.querySelector('.option-pyeong-input');
        if (cb) cb.checked = !!o.enabled;
        if (inp) { inp.disabled = !o.enabled; inp.value = (o.pyeong != null && o.pyeong !== '') ? o.pyeong : ''; }
      }
    });
    var memoBedroomEl = document.getElementById('detail-memo-bedroom');
    if (memoBedroomEl) memoBedroomEl.value = c.memoBedroom || '';
    var memoLivingEl = document.getElementById('detail-memo-living');
    if (memoLivingEl) memoLivingEl.value = c.memoLiving || '';
    var memoKitchenEl = document.getElementById('detail-memo-kitchen');
    if (memoKitchenEl) memoKitchenEl.value = c.memoKitchen || '';
    var memoBathEl = document.getElementById('detail-memo-bath');
    if (memoBathEl) memoBathEl.value = c.memoBath || '';
    var memoExteriorEl = document.getElementById('detail-memo-exterior');
    if (memoExteriorEl) memoExteriorEl.value = c.memoExterior || '';
    var memoEtcEl = document.getElementById('detail-memo-etc');
    if (memoEtcEl) memoEtcEl.value = c.memoEtc || '';
    document.getElementById('modal-contract-detail').classList.remove('hidden');

    // ??????? ?????(??? ??)
    var detailFileInput = document.getElementById('detail-contract-attachment-file');
    var detailBtn = document.getElementById('btn-detail-contract-attach');
    if (detailFileInput && detailBtn && !detailFileInput._seumBound) {
      detailFileInput._seumBound = true;
      detailBtn.addEventListener('click', function () {
        detailFileInput.click();
      });
      detailFileInput.addEventListener('change', function () {
        var file = detailFileInput.files && detailFileInput.files[0];
        if (!file) return;
        var cid = document.getElementById('detail-contract-id') && document.getElementById('detail-contract-id').value;
        if (!cid) {
          window.alert('계약 ID를 찾을 수 없습니다.');
          detailFileInput.value = '';
          return;
        }
        var detailInput = document.getElementById('detail-contract-attachment');
        if (detailInput) detailInput.placeholder = '업로드 중... ' + (file.name || '');
        uploadContractAttachment(cid, file).then(function (res) {
          detailFileInput.value = '';
          if (detailInput) detailInput.placeholder = '파일 URL 또는 파일명';
          if (!res || !res.url) {
            window.alert('파일 업로드에 실패했습니다.');
            return;
          }
          if (detailInput) detailInput.value = res.url;
          var contracts = getContracts();
          var contract = contracts.find(function (x) { return x.id === cid; });
          if (contract) {
            contract.contractAttachment = res.url;
            saveContracts(contracts);
          }
        });
      });
    }

    // ??????? ??? (??? ??)
    var detailOpenBtn = document.getElementById('btn-detail-contract-open');
    if (detailOpenBtn && !detailOpenBtn._seumBound) {
      detailOpenBtn._seumBound = true;
      detailOpenBtn.addEventListener('click', function () {
        openUrlFromInput('detail-contract-attachment');
      });
    }
  }

  function initCustomerForm() {
    var form = document.getElementById('form-customer');
    var toggleBtn = document.getElementById('btn-toggle-customer-form');
    var cancelBtn = document.getElementById('btn-cancel-customer');
    if (toggleBtn && form) {
      toggleBtn.addEventListener('click', function () {
        document.getElementById('customer-id').value = '';
        if (form) form.reset();
        form.classList.toggle('hidden');
      });
    }
    if (cancelBtn && form) cancelBtn.addEventListener('click', function () { form.classList.add('hidden'); });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var custId = document.getElementById('customer-id').value;
        var customers = getCustomers();
        var payload = {
          name: document.getElementById('customer-name').value.trim(),
          phone: document.getElementById('customer-phone').value.trim(),
          visitDate: document.getElementById('customer-visit-date').value || '',
          salesPerson: document.getElementById('customer-sales-person').value.trim(),
          showroomId: document.getElementById('customer-showroom').value || '',
          memo: document.getElementById('customer-memo').value.trim(),
          createdAt: todayStr()
        };
        if (custId) {
          var idx = customers.findIndex(function (x) { return x.id === custId; });
          if (idx !== -1) {
            payload.createdAt = customers[idx].createdAt;
            customers[idx] = Object.assign({}, customers[idx], payload);
          }
        } else {
          payload.id = id();
          customers.push(payload);
        }
        saveCustomers(customers);
        if (typeof logActivity === 'function') {
          logActivity({
            actionType: custId ? 'update' : 'create',
            targetType: 'customer',
            targetId: payload.id,
            targetName: payload.name,
            description: custId ? '?? ???' : '?? ???'
          });
        }
        renderSalesCustomers();
        form.classList.add('hidden');
      });
    }
  }

  function initContractForm() {
    var form = document.getElementById('form-contract');
    var wrap = document.getElementById('contract-form-wrap');
    var btnOpen = document.getElementById('btn-open-contract-form');
    var seriesSel = document.getElementById('contract-model-series');
    var sizeSel = document.getElementById('contract-model-size');
    var colorSel = document.getElementById('contract-model-color');
    var supplyInput = document.getElementById('contract-supply');
    var vatInput = document.getElementById('contract-vat');
    var totalInput = document.getElementById('contract-total');
    var typeSel = document.getElementById('contract-model');
    if (seriesSel) seriesSel.addEventListener('change', updateContractModelNamePreview);
    if (sizeSel) sizeSel.addEventListener('change', updateContractModelNamePreview);
    if (colorSel) colorSel.addEventListener('change', updateContractModelNamePreview);
    if (supplyInput && vatInput && totalInput) {
      var recalcAmounts = function () {
        var supply = Number(supplyInput.value || 0);
        if (supply < 0 || !isFinite(supply)) supply = 0;
        var vat = Math.round(supply * 0.1);
        vatInput.value = String(vat);
        totalInput.value = String(supply + vat);
      };
      supplyInput.addEventListener('input', recalcAmounts);
      // ?? ?? ???? ?? ?????????????
      recalcAmounts();
    }
    if (typeSel && seriesSel) {
      typeSel.addEventListener('change', function () {
        var v = typeSel.value;
        if (v === '???????') {
          seriesSel.value = 'FOREST';
        } else if (v === '?????' || v === '????????' || v === '??') {
          seriesSel.value = 'STAY';
        } else if (v === '??????????') {
          seriesSel.value = 'CUBE';
        }
        updateContractModelNamePreview();
      });
    }
    if (btnOpen) {
      btnOpen.addEventListener('click', function () {
        openContractForm(null);
      });
    }
    document.querySelectorAll('.btn-cancel-contract').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (wrap) wrap.classList.add('hidden');
      });
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var visitId = document.getElementById('contract-visit-id').value.trim() || null;
        var showroomId = document.getElementById('contract-showroom').value;
        var modelShowroomId = document.getElementById('contract-model-showroom') ? document.getElementById('contract-model-showroom').value : '';
        var contractModel = document.getElementById('contract-model') ? document.getElementById('contract-model').value : '';
        var salesPerson = document.getElementById('contract-sales-person').value.trim();
        var customerName = document.getElementById('contract-name').value.trim();
        var phone = document.getElementById('contract-phone').value.trim();
        var supplyAmount = document.getElementById('contract-supply').value || null;
        var vatAmount = document.getElementById('contract-vat').value || null;
        var totalAmount = document.getElementById('contract-total').value || null;
        var contractDate = document.getElementById('contract-date').value;
        var depositAmount = document.getElementById('contract-deposit-amount').value || null;
        var depositDate = document.getElementById('contract-deposit-date').value || null;
        var progress1Amount = document.getElementById('contract-progress1-amount').value || null;
        var progress2Amount = document.getElementById('contract-progress2-amount').value || null;
        var progress3Amount = document.getElementById('contract-progress3-amount').value || null;
        var balanceAmount = document.getElementById('contract-balance-amount').value || null;
        // ??????? ???? ?? ?????????????????showroom ??
        if (typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee) {
          var cur = window.seumAuth.currentEmployee;
          if ((cur.team || '').trim() === '영업' && cur.showroom) {
            showroomId = cur.showroom;
            var showroomSelect = document.getElementById('contract-showroom');
            if (showroomSelect) showroomSelect.value = showroomId;
          }
        }
        if (!showroomId) return;
        var contracts = getContracts();
        contracts.push({
          id: id(),
          visitId: visitId,
          showroomId: showroomId,
          modelShowroomId: modelShowroomId || '',
          salesPerson: salesPerson,
          contractAttachment: '',
          contractModel: contractModel || '',
          contractModelName: getContractModelNameFromForm(),
          siteAddress: '',
          installType: '현장시공',
          foundationPyeong: '',
          housePyeong: '',
          options: { porch: { enabled: false, pyeong: '' }, deck: { enabled: false, pyeong: '' }, sunroom: { enabled: false, pyeong: '' } },
          interiorNote: '',
          exteriorNote: '',
          extraNote: '',
          customerName: customerName,
          phone: phone,
          amountUnit: 'manwon',
          supplyAmount: supplyAmount,
          vatAmount: vatAmount,
          totalAmount: totalAmount,
          contractDate: contractDate,
          depositAmount: depositAmount,
          depositReceivedAt: depositAmount ? (depositDate || null) : null,
          progress1Amount: progress1Amount,
          progress1ReceivedAt: null,
          progress2Amount: progress2Amount,
          progress2ReceivedAt: null,
          progress3Amount: progress3Amount,
          progress3ReceivedAt: null,
          balanceAmount: balanceAmount,
          balanceReceivedAt: null,
          designStatus: 'none',
          projectType: '',
          architectInfo: '',
          designContactName: '',
          designContactPhone: '',
          isUrgent: false,
          priorityDone: false,
          hasPermitCert: false,
          permitCertDate: '',
          permitAttachment: '',
          completionCertAttachment: '',
          hasConstructionStartReport: false,
          hasCompletionCert: false,
          constructionStartOk: false,
          designPermitDesigner: '',
          designStatusMemoDesign: '',
          designStatusMemoSales: '',
          designStatusMemoConstruction: '',
          // ??? ??? ??? (?? ??, ???????????? ?? ?????????)
          designDrawingAttachment: '',
          constructionDrawingAttachment: '',
          // ?????? 1??2??3???? ????? ???? (?? ???)
          designDrawing1DesignMemo: '',
          designDrawing1SalesMemo: '',
          designDrawing1Final: false,
          designDrawing2Attachment: '',
          designDrawing2DesignMemo: '',
          designDrawing2SalesMemo: '',
          designDrawing2Final: false,
          designDrawing3Attachment: '',
          designDrawing3DesignMemo: '',
          designDrawing3SalesMemo: '',
          designDrawing3Final: false,
          discussionDrawings: [],
          constructionDrawings: [],
          constructionProgress: '착공전',
          constructionStartDate: '',
          constructionEndDate: '',
          constructionManager: '',
          constructionStages: [],
          depositConfirmed: false,
          progress1Confirmed: false,
          progress2Confirmed: false,
          progress3Confirmed: false,
          balanceConfirmed: false,
          salesConfirmed: false,
          designConfirmed: false,
          constructionConfirmed: false,
          finalApproved: false
        });
        saveContracts(contracts);
        var newContract = contracts[contracts.length - 1];
        if (newContract && typeof ensureContractChatRoom === 'function') {
          ensureContractChatRoom(newContract.id);
        }
        if (newContract && typeof window.openContractChatModal === 'function') {
          setTimeout(function () { window.openContractChatModal(newContract.id); }, 100);
        }
        // 설계팀에 계약 생성 알림 전송
        if (newContract && window.seumNotifications && typeof window.seumNotifications.send === 'function') {
          window.seumNotifications.send({
            contractId: newContract.id,
            customerName: newContract.customerName || customerName,
            salesPerson: newContract.salesPerson || salesPerson,
            recipientTeam: '설계'
          });
        }
        if (typeof logActivity === 'function') {
          logActivity({
            actionType: 'create',
            targetType: 'contract',
            targetId: newContract && newContract.id,
            targetName: customerName,
            description: '?? ???'
          });
        }
        if (wrap) wrap.classList.add('hidden');
        form.reset();
        renderSales();
        renderDesign();
        renderConstruction();
        renderSettlement();
        renderDashboard();
        if (newContract && typeof showContractDetailPanel === 'function') {
          expandedContractId = newContract.id;
          // setTimeout으로 DOM 렌더링 완료 후 상세패널을 열어 패널 소멸 방지
          setTimeout(function () {
            showContractDetailPanel(newContract.id, true);
          }, 0);
        }
      });
    }
  }

  function paymentSummaryHtml(c) {
    var nums = getPaymentSummaryNumbers(c);
    if (nums.total <= 0) return '<span class="payment-none">-</span>';
    var _sDivisor = (c && c.amountUnit === 'manwon') ? 1 : 10000;
    var pct = Math.min(100, Math.max(0, nums.receivedPct));
    return '<div class="payment-status">' +
      '<div class="payment-total">총액 ' + formatMoney(String(Math.round(nums.total / _sDivisor))) + '만원</div>' +
      '<div class="payment-rate"><span class="payment-rate-label">입금율</span><div class="payment-rate-bar"><div class="payment-rate-fill" style="width:' + pct + '%"></div></div><span class="payment-rate-pct">' + pct + '%</span></div>' +
      '<div class="payment-row received"><span>입금액</span><span class="amount">' + formatMoney(String(Math.round(nums.received / _sDivisor))) + '만원</span><span class="percent">(' + nums.receivedPct + '%)</span></div>' +
      '<div class="payment-row remaining"><span>잔액</span><span class="amount">' + formatMoney(String(Math.round(nums.remaining / _sDivisor))) + '만원</span><span class="percent">(' + nums.remainingPct + '%)</span></div>' +
      '</div>';
  }

  function paymentCellWithConfirm(c, type) {
    var map = {
      deposit: { receivedAt: 'depositReceivedAt', amount: 'depositAmount', confirmed: 'depositConfirmed' },
      progress1: { receivedAt: 'progress1ReceivedAt', amount: 'progress1Amount', confirmed: 'progress1Confirmed' },
      progress2: { receivedAt: 'progress2ReceivedAt', amount: 'progress2Amount', confirmed: 'progress2Confirmed' },
      progress3: { receivedAt: 'progress3ReceivedAt', amount: 'progress3Amount', confirmed: 'progress3Confirmed' },
      balance: { receivedAt: 'balanceReceivedAt', amount: 'balanceAmount', confirmed: 'balanceConfirmed' }
    };
    var m = map[type];
    var receivedAt = c[m.receivedAt];
    var amount = c[m.amount];
    var confirmed = !!c[m.confirmed];
    // ????deposit)?? ?????????? ????????????? ????????? ??
    if (type === 'deposit') {
      confirmed = true;
      c[m.confirmed] = true;
    }
    if (!amount && !receivedAt) return '<span class="payment-none">-</span>';
    var label = '';
    var _payDivisor = c.amountUnit === 'manwon' ? 1 : 10000;
    if (amount != null && String(amount).trim() !== '') {
      label = formatMoney(Math.round(Number(amount) / _payDivisor)) + '만원';
    }
    if (receivedAt) {
      label += (label ? ' ' : '') + '(' + formatDate(receivedAt) + ')';
    }
    var check = '';
    if (amount != null && String(amount).trim() !== '') {
      check = ' <label class="payment-confirm-label"><input type="checkbox" class="payment-confirm-check" data-contract-id="' + c.id + '" data-type="' + type + '"' + (confirmed ? ' checked' : '') + '> 입금 확인</label>';
    }
    return '<span class="payment-amount">' + (label || '-') + '</span>' + check;
  }

  function togglePaymentConfirmed(contractId, type, checked) {
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    var key = type === 'deposit' ? 'depositConfirmed' : type === 'progress1' ? 'progress1Confirmed' : type === 'progress2' ? 'progress2Confirmed' : type === 'progress3' ? 'progress3Confirmed' : 'balanceConfirmed';
    c[key] = checked;
    saveContracts(contracts);
    renderSales();
    renderConstruction();
    renderSettlement();
    updateConstructionDetailPanelIfOpen();
  }

  function openPaymentModal(contractId, type) {
    var labels = { deposit: '계약금', progress1: '중도금1차', progress2: '중도금2차', progress3: '중도금3차', balance: '잔금' };
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; }) || null;
    var map = {
      deposit: { receivedAt: 'depositReceivedAt', amount: 'depositAmount' },
      progress1: { receivedAt: 'progress1ReceivedAt', amount: 'progress1Amount' },
      progress2: { receivedAt: 'progress2ReceivedAt', amount: 'progress2Amount' },
      progress3: { receivedAt: 'progress3ReceivedAt', amount: 'progress3Amount' },
      balance: { receivedAt: 'balanceReceivedAt', amount: 'balanceAmount' }
    };
    var cfg = map[type] || null;
    var currentAmount = '';
    var currentDate = '';
    if (c && cfg) {
      if (c[cfg.amount] != null && String(c[cfg.amount]).trim() !== '') {
        currentAmount = String(c[cfg.amount]);
      }
      if (c[cfg.receivedAt]) {
        currentDate = c[cfg.receivedAt];
      }
    }
    var dateWrap = document.getElementById('payment-date-wrap');
    var dateInput = document.getElementById('payment-date');
    var showDate = (type === 'deposit');
    if (dateWrap) {
      dateWrap.style.display = showDate ? '' : 'none';
    }
    if (!showDate) {
      currentDate = '';
    } else if (!currentDate) {
      currentDate = new Date().toISOString().slice(0, 10);
    }
    document.getElementById('payment-contract-id').value = contractId;
    document.getElementById('payment-type').value = type;
    document.querySelector('#modal-payment .modal-header h3').textContent = labels[type] + ' ???';
    document.getElementById('payment-amount').value = currentAmount;
    if (dateInput) dateInput.value = currentDate;
    document.getElementById('modal-payment').classList.remove('hidden');
  }

  function openContractFieldModal(contractId, field) {
    var fieldMeta = {
      showroomId:        { label: '전시장', type: 'select' },
      contractModel:     { label: '주택유형', type: 'text' },
      contractModelName: { label: '모델', type: 'text' },
      contractDate:      { label: '계약일', type: 'date' },
      customerName:      { label: '건축주', type: 'text' },
      salesPerson:       { label: '영업담당', type: 'text' },
      totalAmount:       { label: '공사금액(만원)', type: 'number' }
    };
    var meta = fieldMeta[field];
    if (!meta) return;
    var contracts = getContracts();
    var c = contracts.find(function (x) { return x.id === contractId; });
    if (!c) return;
    var currentValue = (c[field] != null) ? String(c[field]) : '';
    document.getElementById('contract-field-contract-id').value = contractId;
    document.getElementById('contract-field-name').value = field;
    document.getElementById('modal-contract-field-title').textContent = meta.label + ' 수정';
    var wrap = document.getElementById('contract-field-input-wrap');
    if (meta.type === 'select') {
      var opts = SHOWROOMS.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id === currentValue ? ' selected' : '') + '>' + s.name + '</option>';
      }).join('');
      wrap.innerHTML = '<label>' + meta.label + '<select id="contract-field-value">' + opts + '</select></label>';
    } else {
      var inputType = meta.type;
      wrap.innerHTML = '<label>' + meta.label + ' <input type="' + inputType + '" id="contract-field-value" value="' + currentValue + '"' + (inputType === 'number' ? ' min="0" step="1"' : '') + ' required></label>';
    }
    document.getElementById('modal-contract-field').classList.remove('hidden');
  }

  function initContractFieldModal() {
    var modal = document.getElementById('modal-contract-field');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-contract-field"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
    var form = document.getElementById('form-contract-field');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('contract-field-contract-id').value;
        var field = document.getElementById('contract-field-name').value;
        var valueEl = document.getElementById('contract-field-value');
        if (!valueEl) return;
        var newValue = valueEl.value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        c[field] = newValue;
        saveContracts(contracts);
        modal.classList.add('hidden');
        renderSales();
        renderDesign();
        renderDashboard();
        renderConstruction();
        renderSettlement();
      });
    }
  }

  function initContractDetailModal() {
    var form = document.getElementById('form-contract-detail');
    var modal = document.getElementById('modal-contract-detail');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-contract-detail"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('detail-contract-id').value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        c.showroomId = document.getElementById('detail-showroom').value || '';
        var detailModelShowroomSel = document.getElementById('detail-model-showroom');
        c.modelShowroomId = detailModelShowroomSel ? (detailModelShowroomSel.value || '') : (c.modelShowroomId || '');
        c.contractModel = document.getElementById('detail-model').value || '';
        c.contractModelName = document.getElementById('detail-model-name').value.trim();
        c.salesPerson = document.getElementById('detail-sales-person').value.trim();
        c.contractAttachment = document.getElementById('detail-contract-attachment').value.trim();
        c.siteAddress = document.getElementById('detail-site-address').value.trim();
        var detailInstallChecked = document.querySelector('input[name="detail-install-type"]:checked');
        c.installType = detailInstallChecked ? detailInstallChecked.value : '현장시공';
        c.foundationPyeong = (document.getElementById('detail-foundation-pyeong').value || '').trim();
        c.housePyeong = (document.getElementById('detail-house-pyeong').value || '').trim();
        c.options = c.options || { porch: { enabled: false, pyeong: '' }, deck: { enabled: false, pyeong: '' }, sunroom: { enabled: false, pyeong: '' } };
        ['porch', 'deck', 'sunroom'].forEach(function (key) {
          var row = document.querySelector('#form-contract-detail .option-row[data-option="' + key + '"]');
          if (row) {
            var cb = row.querySelector('.option-toggle');
            var inp = row.querySelector('.option-pyeong-input');
            c.options[key] = { enabled: cb ? cb.checked : false, pyeong: (inp && !inp.disabled ? inp.value : '') ? (inp.value || '').trim() : '' };
          }
        });
        c.memoBedroom = (document.getElementById('detail-memo-bedroom').value || '').trim();
        c.memoLiving = (document.getElementById('detail-memo-living').value || '').trim();
        c.memoKitchen = (document.getElementById('detail-memo-kitchen').value || '').trim();
        c.memoBath = (document.getElementById('detail-memo-bath').value || '').trim();
        c.memoExterior = (document.getElementById('detail-memo-exterior').value || '').trim();
        c.memoEtc = (document.getElementById('detail-memo-etc').value || '').trim();
        saveContracts(contracts);
        if (typeof logActivity === 'function') {
          logActivity({ actionType: 'update', targetType: 'contract', targetId: contractId, targetName: c.customerName, description: '?? ???' });
        }
        modal.classList.add('hidden');
        renderSales();
        if (expandedContractId === contractId) showContractDetailPanel(contractId, true);
      });
    }
  }

  function initPaymentModal() {
    var form = document.getElementById('form-payment');
    var modal = document.getElementById('modal-payment');
    document.querySelectorAll('[data-close="modal-payment"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('payment-contract-id').value;
        var type = document.getElementById('payment-type').value;
        var amount = document.getElementById('payment-amount').value || '';
        var dateInput = document.getElementById('payment-date');
        var date = dateInput ? dateInput.value : '';
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (!c) return;
        if (type === 'deposit') {
          c.depositAmount = amount;
          c.depositReceivedAt = date || null;
        } else if (type === 'progress1') {
          c.progress1Amount = amount;
          c.progress1ReceivedAt = null;
        } else if (type === 'progress2') {
          c.progress2Amount = amount;
          c.progress2ReceivedAt = null;
        } else if (type === 'progress3') {
          c.progress3Amount = amount;
          c.progress3ReceivedAt = null;
        } else if (type === 'balance') {
          c.balanceAmount = amount;
          c.balanceReceivedAt = null;
        }
        saveContracts(contracts);
        modal.classList.add('hidden');
        renderSales();
        renderDesign();
        renderDashboard();
        renderConstruction();
        renderSettlement();
      });
    }
  }

  function initDelegation() {
    document.addEventListener('click', function (e) {
      var bannerBtn = e.target.closest && e.target.closest('.dashboard-announcement-banner[data-announcement-id]');
      if (bannerBtn) {
        var id = bannerBtn.getAttribute('data-announcement-id');
        if (id) openAnnouncementDetail(id);
        return;
      }
      var goto = e.target.closest && e.target.closest('[data-dashboard-goto]');
      if (goto) {
        e.preventDefault();
        showSection(goto.getAttribute('data-dashboard-goto'));
        return;
      }
      var teamEventBtn = e.target.closest && e.target.closest('.team-calendar-event[data-team-event-id]');
      if (teamEventBtn) {
        var evId = teamEventBtn.getAttribute('data-team-event-id');
        if (evId) openTeamEventModal(evId);
        return;
      }
      var editEmp = e.target.getAttribute('data-edit-employee');
      if (editEmp) {
        var employees = getEmployees();
        var emp = employees.find(function (x) { return x.id === editEmp; });
        if (emp) {
          document.getElementById('employee-id').value = emp.id;
          document.getElementById('employee-name').value = emp.name || '';
          document.getElementById('employee-team').value = emp.team || '';
          document.getElementById('employee-showroom').value = emp.showroomId || '';
          var empPermEl = document.getElementById('employee-permission');
          if (empPermEl) empPermEl.value = emp.permission || '';
          document.getElementById('employee-phone').value = emp.phone || '';
          document.getElementById('employee-join-date').value = emp.joinDate || '';
          document.getElementById('employee-memo').value = emp.memo || '';
          document.getElementById('form-employee').classList.remove('hidden');
        }
        return;
      }
      var deleteEmp = e.target.getAttribute('data-delete-employee');
      if (deleteEmp && confirm('직원을 삭제하시겠습니까?')) {
        var employees = getEmployees().filter(function (x) { return x.id !== deleteEmp; });
        saveEmployees(employees);
        renderHR();
        return;
      }
      var deleteLeave = e.target.getAttribute('data-delete-leave');
      if (deleteLeave && confirm('휴가 기록을 삭제하시겠습니까?')) {
        var leaves = getLeaves().filter(function (x) { return x.id !== deleteLeave; });
        saveLeaves(leaves);
        renderHR();
        return;
      }
      var editCust = e.target.getAttribute('data-edit-customer');
      if (editCust) {
        var customers = getCustomers();
        var cust = customers.find(function (x) { return x.id === editCust; });
        if (cust) {
          document.getElementById('customer-id').value = cust.id;
          document.getElementById('customer-name').value = cust.name || '';
          document.getElementById('customer-phone').value = cust.phone || '';
          document.getElementById('customer-visit-date').value = cust.visitDate || '';
          document.getElementById('customer-sales-person').value = cust.salesPerson || '';
          document.getElementById('customer-showroom').value = cust.showroomId || '';
          document.getElementById('customer-memo').value = cust.memo || '';
          document.getElementById('form-customer').classList.remove('hidden');
          showSection('sales-customers');
        }
        return;
      }
      var deleteCust = e.target.getAttribute('data-delete-customer');
      if (deleteCust && confirm('고객을 삭제하시겠습니까?')) {
        var customers = getCustomers().filter(function (x) { return x.id !== deleteCust; });
        saveCustomers(customers);
        renderSalesCustomers();
        return;
      }
      var assign = e.target.getAttribute('data-assign-visit');
      if (assign) {
        assignToSales(assign);
        return;
      }
      var createContract = e.target.getAttribute('data-create-contract');
      if (createContract) {
        showSection('sales-contracts');
        openContractForm(createContract);
        return;
      }
      var contractFieldType = e.target.getAttribute('data-contract-field');
      var contractFieldId = e.target.getAttribute('data-id');
      if (contractFieldType && contractFieldId) {
        openContractFieldModal(contractFieldId, contractFieldType);
        return;
      }
      var paymentType = e.target.getAttribute('data-payment');
      var paymentId = e.target.getAttribute('data-id');
      if (paymentType && paymentId) {
        openPaymentModal(paymentId, paymentType);
        return;
      }
      var detailId = e.target.getAttribute('data-contract-detail');
      if (detailId) {
        showContractDetailPanel(detailId, true);
        return;
      }
      var contractDeleteBtn = e.target.closest('.btn-contract-delete');
      if (contractDeleteBtn) {
        var delId = contractDeleteBtn.getAttribute('data-contract-id');
        if (!delId) return;
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        var team = (cur && (cur.team || '').trim()) || '';
        var isConstructionTeam = (team === '시공' || team === '시공팀');
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === delId; });
        if (!c) return;
        var isAdminRole = (typeof isAdmin === 'function' && isAdmin()) || (typeof isSuperAdmin === 'function' && isSuperAdmin());
        var fromConstruction = !!contractDeleteBtn.closest('#tbody-construction');
        if (fromConstruction) {
          if (!isAdminRole && !isConstructionTeam) {
            window.alert('시공팀 또는 관리자만 삭제할 수 있습니다.');
            return;
          }
        } else {
          var canSalesDeleteOwn = false;
          if (cur) {
            var name = (cur.name || '').trim();
            if (team === '영업' && name && String(c.salesPerson || '').trim() === name) {
              canSalesDeleteOwn = true;
            }
          }
          if (!isAdminRole && !canSalesDeleteOwn) {
            window.alert('계약 삭제 권한이 없습니다. 관리자에게 문의하세요.');
            return;
          }
        }
        if (!window.confirm('이 계약을 삭제하시겠습니까?')) return;
        deleteContractById(delId);
        return;
      }
      var contractRow = e.target.closest('.contract-row');
      if (contractRow && !e.target.closest('button')) {
        var cid = contractRow.getAttribute('data-contract-id');
        if (cid) showContractDetailPanel(cid, false);
        return;
      }
      var visitDetailId = e.target.getAttribute('data-visit-detail');
      if (visitDetailId) {
        openVisitDetail(visitDetailId);
        return;
      }
      var designPermitId = e.target.getAttribute('data-design-permit');
      if (designPermitId) {
        if (!isSalesReadonly()) {
          openDesignPermitModal(designPermitId);
        }
        return;
      }
      var approveBtn = e.target.closest('.approve-btn');
      if (approveBtn && !approveBtn.disabled) {
        if (isSalesReadonly()) return;
        var approvalContractId = approveBtn.getAttribute('data-contract-id');
        if (approvalContractId) {
          var contracts = getContracts();
          var ac = contracts.find(function (x) { return x.id === approvalContractId; });
          if (ac) {
            ac.finalApproved = !ac.finalApproved;
            ac.constructionStartOk = !!(ac.salesConfirmed && ac.designConfirmed && ac.constructionConfirmed && ac.finalApproved);
            saveContracts(contracts);
            renderDesign();
            renderConstruction();
          }
        }
        return;
      }
      var designRow = e.target.closest('.design-row');
      if (designRow && !e.target.closest('select') && !e.target.closest('button') && !e.target.closest('.review-check-cell')) {
        var designCid = designRow.getAttribute('data-contract-id');
        if (designCid) showDesignDetailPanel(designCid);
        return;
      }
      var constructionStagesId = e.target.getAttribute('data-construction-stages');
      if (constructionStagesId) {
        showConstructionDetailPanel(constructionStagesId);
        return;
      }
      var editBtn = e.target.closest('.construction-detail-edit-btn');
      if (editBtn) {
        var editId = editBtn.getAttribute('data-contract-id');
        if (editId) openConstructionStagesModal(editId);
        return;
      }
      var row = e.target.closest('.construction-row');
      if (row && !e.target.closest('select') && !e.target.closest('button') && !e.target.closest('input')) {
        var cid = row.getAttribute('data-contract-id');
        if (cid) showConstructionDetailPanel(cid);
        return;
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('design-designer-input')) {
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        var userTeam = (cur && (cur.team || '').trim()) || '';
        if (userTeam !== '설계') return;
        var contractId = e.target.getAttribute('data-contract-id');
        if (!contractId) return;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.designPermitDesigner = (e.target.value || '').trim();
          saveContracts(contracts);
          if (c.designPermitDesigner && typeof window.addContractInviteMessage === 'function') {
            window.addContractInviteMessage(c.id, 'design', c.designPermitDesigner);
          }
          renderDesign();
        }
        return;
      }
      if (e.target.classList.contains('design-construction-manager-input')) {
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        var userTeam = (cur && (cur.team || '').trim()) || '';
        if (userTeam !== '시공') return;
        var contractId = e.target.getAttribute('data-contract-id');
        if (!contractId) return;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.constructionManager = (e.target.value || '').trim();
          saveContracts(contracts);
          if (c.constructionManager && typeof window.addContractInviteMessage === 'function') {
            window.addContractInviteMessage(c.id, 'construction', c.constructionManager);
          }
          renderDesign();
        }
        return;
      }
      if (e.target.classList.contains('construction-manager-input')) {
        if (isSalesReadonly()) return;
        var contractId = e.target.getAttribute('data-contract-id');
        if (!contractId) return;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.constructionManager = (e.target.value || '').trim();
          saveContracts(contracts);
          if (c.constructionManager && typeof window.addContractInviteMessage === 'function') {
            window.addContractInviteMessage(c.id, 'construction', c.constructionManager);
          }
          renderConstruction();
        }
        return;
      }
      if (e.target.classList.contains('urgent-check')) {
        var contractId = e.target.getAttribute('data-contract-id');
        if (!contractId) return;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.isUrgent = e.target.checked;
          saveContracts(contracts);
          renderDesign();
          renderDesignPriority();
        }
        return;
      }
      if (e.target.classList.contains('review-check')) {
        var contractId = e.target.getAttribute('data-contract-id');
        if (!contractId) return;
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        var userTeam = (cur && (cur.team || '').trim()) || '';
        var isConstructionTeam = (userTeam === '시공' || userTeam === '시공팀');
        var isSalesOnlyTeam = (userTeam === '영업' || userTeam === '영업팀');
        if (isSalesReadonly() && !e.target.classList.contains('sales-check')) {
          renderDesign();
          return;
        }
        if (userTeam === '설계' && !e.target.classList.contains('design-check')) {
          renderDesign();
          return;
        }
        if (isConstructionTeam && !e.target.classList.contains('construction-check')) {
          renderDesign();
          return;
        }
        if (isSalesOnlyTeam && !e.target.classList.contains('sales-check')) {
          renderDesign();
          return;
        }
        if (isSalesOnlyTeam && e.target.classList.contains('sales-check')) {
          var myNameSales = (cur && (cur.name || '').trim()) || '';
          var allContracts = getContracts();
          var targetContract = allContracts.find(function (x) { return x.id === contractId; });
          if (!targetContract || (targetContract.salesPerson || '').trim() !== myNameSales) {
            renderDesign();
            return;
          }
        }
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          if (e.target.classList.contains('sales-check')) c.salesConfirmed = e.target.checked;
          else if (e.target.classList.contains('design-check')) c.designConfirmed = e.target.checked;
          else if (e.target.classList.contains('construction-check')) c.constructionConfirmed = e.target.checked;
          var allChecked = !!c.salesConfirmed && !!c.designConfirmed && !!c.constructionConfirmed;
          if (!allChecked) { c.finalApproved = false; }
          c.constructionStartOk = !!(allChecked && c.finalApproved);
          saveContracts(contracts);
          renderDesign();
          renderConstruction();
        }
        return;
      }
      if (e.target.classList.contains('design-status-select')) {
        if (isSalesReadonly()) {
          // ??????? ??? ??? ??? ???
          renderDesign();
          return;
        }
        var contractId = e.target.getAttribute('data-id');
        var value = e.target.value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.designStatus = value;
          saveContracts(contracts);
          renderDesign();
        }
        return;
      }
      if (e.target.classList.contains('construction-progress-select')) {
        if (isSalesReadonly()) {
          renderConstruction();
          return;
        }
        var contractId = e.target.getAttribute('data-id');
        var value = e.target.value;
        var contracts = getContracts();
        var c = contracts.find(function (x) { return x.id === contractId; });
        if (c) {
          c.constructionProgress = value;
          saveContracts(contracts);
          renderConstruction();
          updateConstructionDetailPanelIfOpen();
        }
        return;
      }
      if (e.target.classList.contains('payment-confirm-check')) {
        var contractId = e.target.getAttribute('data-contract-id');
        var type = e.target.getAttribute('data-type');
        if (contractId && type) togglePaymentConfirmed(contractId, type, e.target.checked);
      }
    });

    function getStageFieldFromClass(className) {
      if (className.indexOf('stage-start-date') !== -1) return 'startDate';
      if (className.indexOf('stage-end-date') !== -1) return 'endDate';
      if (className.indexOf('stage-manager') !== -1) return 'responsibleName';
      if (className.indexOf('stage-worker-list') !== -1) return 'workerList';
      if (className.indexOf('stage-phone') !== -1) return 'responsiblePhone';
      if (className.indexOf('stage-labor-cost') !== -1) return 'laborCost';
      if (className.indexOf('stage-extra-cost') !== -1) return 'extraCost';
      if (className.indexOf('stage-memo') !== -1) return 'memo';
      return null;
    }
    document.addEventListener('change', function (e) {
      if (isSalesReadonly()) return;
      var contractId = e.target.getAttribute('data-contract-id');
      var stageName = e.target.getAttribute('data-stage');
      var field = getStageFieldFromClass(e.target.className || '');
      if (contractId && stageName && field) {
        updateConstructionStageField(contractId, stageName, field, e.target.value);
        updateConstructionDetailPanelIfOpen();
        return;
      }
    });
    document.addEventListener('input', function (e) {
      var contractId = e.target.getAttribute('data-contract-id');
      var stageName = e.target.getAttribute('data-stage');
      var field = getStageFieldFromClass(e.target.className || '');
      if (!contractId || !stageName || !field) return;
      if (e.target.classList.contains('stage-memo') || e.target.classList.contains('stage-manager') || e.target.classList.contains('stage-phone') || e.target.classList.contains('stage-worker-list')) {
        updateConstructionStageField(contractId, stageName, field, e.target.value);
      }
    });
  }

  function renderAdminApproval() {
    var tbody = document.getElementById('tbody-pending-approval');
    var emptyEl = document.getElementById('admin-pending-empty');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="6">Supabase ??????????????</td></tr>';
      if (emptyEl) emptyEl.classList.add('hidden');
      return;
    }
    supabase.from('employees')
      .select('id, name, email, team, showroom, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(function (res) {
        var list = (res.data || []);
        if (emptyEl) emptyEl.classList.toggle('hidden', list.length > 0);
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6">승인 대기 중인 직원이 없습니다.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (emp) {
          var dateStr = emp.created_at ? new Date(emp.created_at).toLocaleDateString('ko-KR') : '-';
          var showroomName = getShowroomName(emp.showroom);
          return '<tr><td>' + (emp.name || '-') + '</td><td>' + (emp.email || '-') + '</td><td>' + (emp.team || '-') + '</td><td>' + showroomName + '</td><td>' + dateStr + '</td><td><button type="button" class="btn btn-primary btn-sm btn-approve-employee" data-id="' + emp.id + '">승인</button> <button type="button" class="btn btn-secondary btn-sm btn-block-employee" data-id="' + emp.id + '">거부</button></td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="6">데이터를 불러오지 못했습니다.</td></tr>';
        if (emptyEl) emptyEl.classList.add('hidden');
        console.error('??? ?????? ?? ???:', err);
      });
  }

  function initAdminApproval() {
    var tbody = document.getElementById('tbody-pending-approval');
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;
      var btn = e.target && e.target.closest && e.target.closest('.btn-approve-employee');
      if (btn) {
        var id = btn.getAttribute('data-id');
        if (!id) return;
        btn.disabled = true;
        supabase.from('employees').update({ status: 'approved' }).eq('id', id)
          .then(function (res) {
            if (res.error) throw res.error;
            renderAdminApproval();
          })
          .catch(function (err) {
            btn.disabled = false;
            alert('??? ?????????????.');
            console.error(err);
          });
        return;
      }
      btn = e.target && e.target.closest && e.target.closest('.btn-block-employee');
      if (btn) {
        var id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('??? ???????????????')) return;
        btn.disabled = true;
        supabase.from('employees').update({ status: 'blocked' }).eq('id', id)
          .then(function (res) {
            if (res.error) throw res.error;
            renderAdminApproval();
          })
          .catch(function (err) {
            btn.disabled = false;
            alert('?? ?????????????.');
            console.error(err);
          });
      }
    });
  }

  var TEAM_OPTIONS = ['마케팅', '영업', '설계', '시공', '정산', '경영', '사무', '본사'];
  var ROLE_OPTIONS = ['staff', 'manager', 'admin', 'master'];

  function renderAdminEmployees() {
    var tbody = document.getElementById('tbody-admin-employees');
    var countEl = document.getElementById('admin-employees-count');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="7">Supabase를 사용할 수 없습니다.</td></tr>';
      return;
    }
    supabase.from('employees').select('id, name, email, team, role, showroom, status')
      .order('id', { ascending: true })
      .then(function (res) {
        var list = res.data || [];
        if (countEl) {
          var total = list.length || 0;
          countEl.textContent = total ? '총 ' + total + '명' : '';
        }
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7">등록된 직원이 없습니다.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (emp, idx) {
          var teamOpts = TEAM_OPTIONS.map(function (t) {
            return '<option value="' + t + '"' + ((emp.team || '') === t ? ' selected' : '') + '>' + t + '</option>';
          }).join('');
          var roleOpts = ROLE_OPTIONS.map(function (r) {
            return '<option value="' + r + '"' + ((emp.role || '') === r ? ' selected' : '') + '>' + r + '</option>';
          }).join('');
          var srOpts = SHOWROOMS.map(function (s) {
            var val = emp.showroom || '';
            var isSelected = (val === s.id) || (val === s.name);
            return '<option value="' + (s.id || '') + '"' + (isSelected ? ' selected' : '') + '>' + (s.name || s.id) + '</option>';
          }).join('');
          var numberLabel = (idx + 1) + '. ';
          return '<tr data-id="' + emp.id + '"><td>' + numberLabel + (emp.name || '-') + '</td><td>' + (emp.email || '-') + '</td><td><select class="admin-emp-team">' + teamOpts + '</select></td><td><select class="admin-emp-role">' + roleOpts + '</select></td><td><select class="admin-emp-showroom">' + srOpts + '</select></td><td>' + (emp.status || '-') + '</td><td><button type="button" class="btn btn-primary btn-sm btn-admin-emp-save" data-id="' + emp.id + '">저장</button> <button type="button" class="btn btn-secondary btn-sm btn-admin-emp-delete" data-id="' + emp.id + '">삭제</button></td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="7">직원 목록을 불러오지 못했습니다.</td></tr>';
        console.error(err);
      });
  }

  function formatKoreanDateTime(value) {
    if (!value) return '-';
    try {
      var d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('ko-KR', { hour12: false });
    } catch (e) {
      return String(value);
    }
  }

  function computePresenceStatus(row) {
    var now = Date.now();
    var lastSeen = row && row.last_seen ? new Date(row.last_seen).getTime() : 0;
    if (!lastSeen) return 'offline';
    var diffMs = now - lastSeen;
    var diffMin = diffMs / 60000;
    if (diffMin <= 3) return 'online';
    if (diffMin <= 30) return 'idle';
    return 'offline';
  }

  function getPresenceBadgeHtml(row) {
    var status = computePresenceStatus(row);
    var label = 'offline';
    var cls = 'presence-badge presence-offline';
    if (status === 'online') {
      label = 'online';
      cls = 'presence-badge presence-online';
    } else if (status === 'idle') {
      label = 'idle';
      cls = 'presence-badge presence-idle';
    }
    return '<span class="' + cls + '">' + label + '</span>';
  }

  function getTeamEventStatusLabel(status) {
    if (!status) return '';
    if (status === 'planned') return '예정';
    if (status === 'in_progress') return '진행중';
    if (status === 'done') return '완료';
    if (status === 'canceled') return '취소';
    return status;
  }

  function getTeamEventPriorityLabel(priority) {
    if (!priority) return '';
    if (priority === 'normal') return '보통';
    if (priority === 'important') return '중요';
    if (priority === 'urgent') return '긴급';
    return priority;
  }

  function getTeamEventTypeLabel(type) {
    if (!type) return '';
    if (type === 'consulting') return '상담';
    if (type === 'visit') return '방문';
    if (type === 'design') return '설계';
    if (type === 'construction') return '시공';
    if (type === 'meeting') return '미팅';
    if (type === 'marketing') return '마케팅';
    if (type === 'etc') return '기타';
    return type;
  }

  function getPriorityBadgeHtml(priority) {
    if (!priority) return '-';
    var key = String(priority);
    var label = getTeamEventPriorityLabel(key);
    var cls = 'priority-badge priority-normal';
    if (key === 'important') cls = 'priority-badge priority-important';
    if (key === 'urgent') cls = 'priority-badge priority-urgent';
    return '<span class="' + cls + '">' + label + '</span>';
  }

  function renderAdminPresence() {
    var tbody = document.getElementById('tbody-admin-presence');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="8">Supabase ??????????????</td></tr>';
      return;
    }
    // employees?? user_presence??????? ?? (user_presence.user_id -> employees.id)
    supabase.from('user_presence')
      .select('user_id,status,last_seen,last_login_at,last_logout_at,employees(name,team,showroom,role,permission)')
      .then(function (res) {
        if (res.error) {
          console.error('user_presence ?? ???:', res.error);
          tbody.innerHTML = '<tr><td colspan="8">?? ??? ??????????? ???????</td></tr>';
          return;
        }
        var rows = res.data || [];
        // ??? ??? (?? / ?????
        var teamFilterEl = document.getElementById('admin-presence-filter-team');
        var showroomFilterEl = document.getElementById('admin-presence-filter-showroom');
        var teamFilter = teamFilterEl && teamFilterEl.value ? String(teamFilterEl.value).trim() : '';
        var showroomFilter = showroomFilterEl && showroomFilterEl.value ? String(showroomFilterEl.value).trim() : '';
        if (teamFilter || showroomFilter) {
          rows = rows.filter(function (row) {
            var p = row.employees || {};
            var t = (p.team || '').trim();
            var s = (p.showroom || '').trim();
            if (teamFilter && t !== teamFilter) return false;
            if (showroomFilter && s !== showroomFilter) return false;
            return true;
          });
        }
        if (rows.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8">??? ??????????.</td></tr>';
          return;
        }
        tbody.innerHTML = rows.map(function (row) {
          var p = row.employees || {};
          var name = p.name || '-';
          var team = p.team || '-';
          var showroomName = getShowroomName(p.showroom || '');
          var role = p.role || '-';
          var statusBadge = getPresenceBadgeHtml(row);
          var lastSeen = formatKoreanDateTime(row.last_seen);
          var lastLogin = formatKoreanDateTime(row.last_login_at);
          var lastLogout = formatKoreanDateTime(row.last_logout_at);
          return '<tr>' +
            '<td>' + escapeHtml(name) + '</td>' +
            '<td>' + escapeHtml(team) + '</td>' +
            '<td>' + escapeHtml(showroomName) + '</td>' +
            '<td>' + escapeHtml(role) + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + escapeHtml(lastSeen) + '</td>' +
            '<td>' + escapeHtml(lastLogin) + '</td>' +
            '<td>' + escapeHtml(lastLogout) + '</td>' +
            '</tr>';
        }).join('');
      })
      .catch(function (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="8">?? ??? ??????????? ???????</td></tr>';
      });
  }

  function initAdminEmployees() {
    var tbody = document.getElementById('tbody-admin-employees');
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;

      var saveBtn = e.target && e.target.closest && e.target.closest('.btn-admin-emp-save');
      if (saveBtn) {
        var id = saveBtn.getAttribute('data-id');
        var row = tbody.querySelector('tr[data-id="' + id + '"]');
        if (!row || !id) return;
        var team = row.querySelector('.admin-emp-team') && row.querySelector('.admin-emp-team').value;
        var role = row.querySelector('.admin-emp-role') && row.querySelector('.admin-emp-role').value;
        var showroom = row.querySelector('.admin-emp-showroom') && row.querySelector('.admin-emp-showroom').value;
        saveBtn.disabled = true;
        supabase.from('employees').update({ team: team || null, role: role || null, showroom: showroom || null, permission: role || null }).eq('id', id)
          .then(function (res) {
            if (res.error) throw res.error;
            renderAdminEmployees();
            alert('저장되었습니다.');
          })
          .catch(function (err) {
            saveBtn.disabled = false;
            alert('저장에 실패했습니다.');
            console.error(err);
          });
        return;
      }

      var delBtn = e.target && e.target.closest && e.target.closest('.btn-admin-emp-delete');
      if (delBtn) {
        var idDel = delBtn.getAttribute('data-id');
        if (!idDel) return;
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        if (cur && String(cur.id) === String(idDel)) {
          window.alert('?? ???? ???????????????????.');
          return;
        }
        if (!window.confirm('??? ????????????????? ??????? Supabase employees??????????????')) return;
        delBtn.disabled = true;
        supabase.from('employees').delete().eq('id', idDel)
          .then(function (res) {
            if (res.error) throw res.error;
            renderAdminEmployees();
          })
          .catch(function (err) {
            delBtn.disabled = false;
            alert('???????????????.');
            console.error(err);
          });
      }
    });
  }

  function initAdminPresence() {
    var tbody = document.getElementById('tbody-admin-presence');
    if (!tbody) return;
    var teamFilterEl = document.getElementById('admin-presence-filter-team');
    var showroomFilterEl = document.getElementById('admin-presence-filter-showroom');
    if (teamFilterEl) {
      teamFilterEl.addEventListener('change', function () { renderAdminPresence(); });
    }
    if (showroomFilterEl) {
      showroomFilterEl.addEventListener('change', function () { renderAdminPresence(); });
    }
    renderAdminPresence();
  }

  var adminActivityLogsCache = [];

  function fetchActivityLogsForAdmin() {
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) return Promise.resolve([]);
    return supabase.from('activity_logs').select('id,user_id,user_name,department,showroom,action_type,target_type,target_id,target_name,description,created_at').order('created_at', { ascending: false }).limit(500)
      .then(function (res) {
        if (res && res.error) return [];
        adminActivityLogsCache = res.data || [];
        return adminActivityLogsCache;
      })
      .catch(function () { return []; });
  }

  function renderAdminActivityLogs(rows) {
    var tbody = document.getElementById('tbody-admin-activity-logs');
    if (!tbody) return;
    var data = rows || adminActivityLogsCache;
    var userFilter = document.getElementById('admin-activity-filter-user');
    var actionFilter = document.getElementById('admin-activity-filter-action');
    var dateFromEl = document.getElementById('admin-activity-filter-date-from');
    var dateToEl = document.getElementById('admin-activity-filter-date-to');
    var userQ = (userFilter && userFilter.value) ? String(userFilter.value).trim().toLowerCase() : '';
    var actionQ = (actionFilter && actionFilter.value) ? String(actionFilter.value).trim() : '';
    var dateFrom = (dateFromEl && dateFromEl.value) ? dateFromEl.value : '';
    var dateTo = (dateToEl && dateToEl.value) ? dateToEl.value : '';
    var filtered = data.filter(function (row) {
      if (userQ && (!row.user_name || String(row.user_name).toLowerCase().indexOf(userQ) === -1)) return false;
      if (actionQ && (row.action_type || '') !== actionQ) return false;
      var created = row.created_at ? String(row.created_at).slice(0, 10) : '';
      if (dateFrom && created < dateFrom) return false;
      if (dateTo && created > dateTo) return false;
      return true;
    });
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">?????? ??? ??? ??????.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(function (row) {
      var createdAt = row.created_at ? String(row.created_at).replace('T', ' ').slice(0, 16) : '-';
      var user = escapeHtml(row.user_name || '-');
      var dept = escapeHtml(row.department || '-');
      var showroom = escapeHtml(row.showroom || '-');
      var action = escapeHtml(row.action_type || '-');
      var target = escapeHtml(row.target_name || '-');
      var desc = escapeHtml(row.description || '-');
      return '<tr><td>' + createdAt + '</td><td>' + user + '</td><td>' + dept + '</td><td>' + showroom + '</td><td>' + action + '</td><td>' + target + '</td><td>' + desc + '</td></tr>';
    }).join('');
  }

  function initAdminActivityLogs() {
    var userEl = document.getElementById('admin-activity-filter-user');
    var actionEl = document.getElementById('admin-activity-filter-action');
    var dateFromEl = document.getElementById('admin-activity-filter-date-from');
    var dateToEl = document.getElementById('admin-activity-filter-date-to');
    var refreshBtn = document.getElementById('admin-activity-btn-refresh');
    function applyFilters() { renderAdminActivityLogs(); }
    if (userEl) userEl.addEventListener('input', applyFilters);
    if (userEl) userEl.addEventListener('change', applyFilters);
    if (actionEl) actionEl.addEventListener('change', applyFilters);
    if (dateFromEl) dateFromEl.addEventListener('change', applyFilters);
    if (dateToEl) dateToEl.addEventListener('change', applyFilters);
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchActivityLogsForAdmin().then(function (rows) { renderAdminActivityLogs(rows); });
      });
    }
  }

  function renderAdminShowrooms() {
    var tbody = document.getElementById('tbody-admin-showrooms');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="3">Supabase ??????????????</td></tr>';
      return;
    }
    supabase.from('showrooms').select('id, code, name').order('id', { ascending: true })
      .then(function (res) {
        var list = res.data || [];
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3">?????? ??????.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (s) {
          return '<tr data-id="' + s.id + '"><td>' + (s.code || '-') + '</td><td>' + (s.name || '-') + '</td><td><button type="button" class="btn btn-secondary btn-sm btn-admin-showroom-edit" data-id="' + s.id + '" data-code="' + (s.code || '') + '" data-name="' + (s.name || '') + '">???</button> <button type="button" class="btn btn-secondary btn-sm btn-admin-showroom-del" data-id="' + s.id + '">????</button></td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="3">?????????? ??????? showrooms ????? ???? ????????</td></tr>';
        console.error(err);
      });
  }

  function initAdminShowrooms() {
    var btnAdd = document.getElementById('btn-admin-showroom-add');
    var form = document.getElementById('form-admin-showroom');
    var btnCancel = document.getElementById('btn-admin-showroom-cancel');
    if (btnAdd && form) {
      btnAdd.addEventListener('click', function () {
        document.getElementById('admin-showroom-id').value = '';
        document.getElementById('admin-showroom-code').value = '';
        document.getElementById('admin-showroom-code').removeAttribute('readonly');
        document.getElementById('admin-showroom-name').value = '';
        form.classList.remove('hidden');
      });
    }
    if (btnCancel && form) btnCancel.addEventListener('click', function () { form.classList.add('hidden'); });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var idEl = document.getElementById('admin-showroom-id');
        var code = document.getElementById('admin-showroom-code').value.trim();
        var name = document.getElementById('admin-showroom-name').value.trim();
        if (!code || !name) return;
        var supabase = typeof window !== 'undefined' && window.seumSupabase;
        if (!supabase) return;
        var id = idEl.value;
        if (id) {
          supabase.from('showrooms').update({ code: code, name: name }).eq('id', id)
            .then(function (res) {
              if (res.error) throw res.error;
              form.classList.add('hidden');
              renderAdminShowrooms();
            })
            .catch(function (err) { alert(err.message || '??? ???'); });
        } else {
          supabase.from('showrooms').insert({ code: code, name: name })
            .then(function (res) {
              if (res.error) throw res.error;
              form.classList.add('hidden');
              renderAdminShowrooms();
            })
            .catch(function (err) { alert(err.message || '??? ???'); });
        }
      });
    }
    var tbody = document.getElementById('tbody-admin-showrooms');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var supabase = typeof window !== 'undefined' && window.seumSupabase;
        if (!supabase) return;
        var btnEdit = e.target && e.target.closest && e.target.closest('.btn-admin-showroom-edit');
        if (btnEdit) {
          var id = btnEdit.getAttribute('data-id');
          document.getElementById('admin-showroom-id').value = id || '';
          document.getElementById('admin-showroom-code').value = btnEdit.getAttribute('data-code') || '';
          document.getElementById('admin-showroom-code').setAttribute('readonly', 'readonly');
          document.getElementById('admin-showroom-name').value = btnEdit.getAttribute('data-name') || '';
          form.classList.remove('hidden');
          return;
        }
        var btnDel = e.target && e.target.closest && e.target.closest('.btn-admin-showroom-del');
        if (btnDel) {
          if (!confirm('???????? ?????????????')) return;
          var id = btnDel.getAttribute('data-id');
          supabase.from('showrooms').delete().eq('id', id)
            .then(function (res) {
              if (res.error) throw res.error;
              renderAdminShowrooms();
            })
            .catch(function (err) { alert(err.message || '???? ???'); });
        }
      });
    }
  }

  function renderAdminCustomers() {
    var tbody = document.getElementById('tbody-admin-customers');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="7">Supabase ??????????????</td></tr>';
      return;
    }
    supabase.from('customers').select('id, name, phone, address, source, status, sales_person')
      .order('id', { ascending: false })
      .then(function (res) {
        var list = res.data || [];
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7">??????????.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (c) {
          return '<tr data-id="' + c.id + '"><td>' + (c.name || '-') + '</td><td>' + (c.phone || '-') + '</td><td>' + (c.address || '-') + '</td><td>' + (c.source || '-') + '</td><td>' + (c.status || '-') + '</td><td>' + (c.sales_person || '-') + '</td><td><button type="button" class="btn btn-primary btn-sm btn-admin-customer-edit" data-id="' + c.id + '">???</button></td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="7">?????????? ???????</td></tr>';
        console.error(err);
      });
  }

  function initAdminCustomers() {
    var tbody = document.getElementById('tbody-admin-customers');
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.btn-admin-customer-edit');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var row = tbody.querySelector('tr[data-id="' + id + '"]');
      if (!row || !id) return;
      var cells = row.querySelectorAll('td');
      var name = cells[0] && cells[0].textContent;
      var phone = cells[1] && cells[1].textContent;
      var address = cells[2] && cells[2].textContent;
      var source = cells[3] && cells[3].textContent;
      var status = cells[4] && cells[4].textContent;
      var salesPerson = cells[5] && cells[5].textContent;
      var newName = window.prompt('이름', name === '-' ? '' : name);
      if (newName === null) return;
      var newPhone = window.prompt('연락처', phone === '-' ? '' : phone);
      if (newPhone === null) return;
      var newAddress = window.prompt('주소', address === '-' ? '' : address);
      if (newAddress === null) return;
      var newSource = window.prompt('유입경로', source === '-' ? '' : source);
      if (newSource === null) return;
      var newStatus = window.prompt('상태', status === '-' ? '' : status);
      if (newStatus === null) return;
      var newSales = window.prompt('담당 영업사원', salesPerson === '-' ? '' : salesPerson);
      if (newSales === null) return;
      var supabase = typeof window !== 'undefined' && window.seumSupabase;
      if (!supabase) return;
      supabase.from('customers').update({
        name: newName || null,
        phone: newPhone || null,
        address: newAddress || null,
        source: newSource || null,
        status: newStatus || null,
        sales_person: newSales || null
      }).eq('id', id)
        .then(function (res) {
          if (res.error) throw res.error;
          renderAdminCustomers();
        })
        .catch(function (err) { alert('??? ???: ' + (err.message || err)); });
    });
  }

  function renderAdminContracts() {
    var tbody = document.getElementById('tbody-admin-contracts');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="8">Supabase ??????????????</td></tr>';
      return;
    }
    supabase.from('contracts').select('id, customer_id, sales_person, contract_amount, deposit, middle_payment, balance, status, created_at')
      .order('id', { ascending: false })
      .then(function (res) {
        var list = res.data || [];
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8">??????????.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (c) {
          var dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '-';
          return '<tr><td>' + (c.id || '-') + '</td><td>' + (c.customer_id || '-') + '</td><td>' + (c.sales_person || '-') + '</td><td>' + (c.contract_amount != null ? Number(c.contract_amount).toLocaleString() : '-') + '</td><td>' + (c.deposit != null ? Number(c.deposit).toLocaleString() : '-') + '</td><td>' + (c.balance != null ? Number(c.balance).toLocaleString() : '-') + '</td><td>' + (c.status || '-') + '</td><td>' + dateStr + '</td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="8">?????????? ???????</td></tr>';
        console.error(err);
      });
  }

  function renderAdminPayments() {
    var tbody = document.getElementById('tbody-admin-payments');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="5">Supabase ??????????????</td></tr>';
      return;
    }
    supabase.from('payments').select('id, contract_id, type, amount, payment_date')
      .order('id', { ascending: false })
      .then(function (res) {
        var list = res.data || [];
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5">??? ???????????.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (p) {
          var dateStr = p.payment_date || '-';
          return '<tr><td>' + (p.id || '-') + '</td><td>' + (p.contract_id || '-') + '</td><td>' + (p.type || '-') + '</td><td>' + (p.amount != null ? Number(p.amount).toLocaleString() : '-') + '</td><td>' + dateStr + '</td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="5">?????????? ???????</td></tr>';
        console.error(err);
      });
  }

  function renderAdminReservations() {
    var tbody = document.getElementById('tbody-admin-reservations');
    if (!tbody) return;
    var supabase = typeof window !== 'undefined' && window.seumSupabase;
    if (!supabase) {
      tbody.innerHTML = '<tr><td colspan="6">Supabase ??????????????</td></tr>';
      return;
    }
    supabase.from('reservations').select('id, name, phone, visit_date, showroom, manager, created_at')
      .order('id', { ascending: false })
      .then(function (res) {
        var list = res.data || [];
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6">?????????????.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(function (r) {
          var visitStr = r.visit_date || '-';
          var createdStr = r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : '-';
          return '<tr><td>' + (r.name || '-') + '</td><td>' + (r.phone || '-') + '</td><td>' + visitStr + '</td><td>' + (r.showroom || '-') + '</td><td>' + (r.manager || '-') + '</td><td>' + createdStr + '</td></tr>';
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="6">데이터를 불러오지 못했습니다.</td></tr>';
        console.error(err);
      });
  }

  function initHR() {
    var btnAdd = document.getElementById('btn-add-employee');
    var form = document.getElementById('form-employee');
    var btnCancel = document.getElementById('btn-cancel-employee');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        document.getElementById('employee-id').value = '';
        if (form) form.reset();
        if (form) form.classList.remove('hidden');
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var empId = document.getElementById('employee-id').value;
        var employees = getEmployees();
        var empPermSave = document.getElementById('employee-permission');
        var payload = {
          name: document.getElementById('employee-name').value.trim(),
          team: document.getElementById('employee-team').value,
          showroomId: document.getElementById('employee-showroom').value,
          permission: empPermSave ? empPermSave.value : '',
          phone: document.getElementById('employee-phone').value.trim(),
          joinDate: document.getElementById('employee-join-date').value,
          memo: document.getElementById('employee-memo').value.trim()
        };
        if (empId) {
          var idx = employees.findIndex(function (x) { return x.id === empId; });
          if (idx !== -1) {
            employees[idx] = Object.assign({}, employees[idx], payload);
          }
        } else {
          payload.id = id();
          employees.push(payload);
        }
        saveEmployees(employees);
        renderHR();
        form.classList.add('hidden');
      });
    }
    if (btnCancel && form) btnCancel.addEventListener('click', function () { form.classList.add('hidden'); });

    var btnAddLeave = document.getElementById('btn-add-leave');
    var formLeave = document.getElementById('form-leave');
    var btnCancelLeave = document.getElementById('btn-cancel-leave');
    if (btnAddLeave && formLeave) {
      btnAddLeave.addEventListener('click', function () {
        formLeave.reset();
        formLeave.classList.remove('hidden');
      });
    }
    if (formLeave) {
      formLeave.addEventListener('submit', function (e) {
        e.preventDefault();
        var employeeId = document.getElementById('leave-employee-id').value;
        if (!employeeId) return;
        var leaves = getLeaves();
        leaves.push({
          id: id(),
          employeeId: employeeId,
          startDate: document.getElementById('leave-start').value,
          endDate: document.getElementById('leave-end').value,
          reason: document.getElementById('leave-reason').value.trim()
        });
        saveLeaves(leaves);
        renderHR();
        formLeave.classList.add('hidden');
      });
    }
    if (btnCancelLeave && formLeave) btnCancelLeave.addEventListener('click', function () { formLeave.classList.add('hidden'); });
  }

  function initTeamCalendar() {
    var btnAdd = document.getElementById('btn-team-calendar-add');
    var prevBtn = document.getElementById('team-calendar-prev');
    var nextBtn = document.getElementById('team-calendar-next');
    var form = document.getElementById('team-calendar-form');
    var deleteBtn = document.getElementById('btn-team-calendar-delete');
    var modal = document.getElementById('modal-team-calendar');
    ensureTeamCalendarTimeOptions();
    if (btnAdd && modal) {
      btnAdd.addEventListener('click', function () {
        var today = new Date();
        setTeamCalendarMonth(today.getFullYear(), today.getMonth());
        openTeamEventModal(today.toISOString().slice(0, 10));
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        ensureTeamCalendarMonth();
        var y = teamCalendarYear;
        var m = teamCalendarMonth - 1;
        if (m < 0) {
          m = 11;
          y -= 1;
        }
        setTeamCalendarMonth(y, m);
        renderTeamCalendar();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        ensureTeamCalendarMonth();
        var y = teamCalendarYear;
        var m = teamCalendarMonth + 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
        setTeamCalendarMonth(y, m);
        renderTeamCalendar();
      });
    }
    ['team-calendar-grid-month', 'team-calendar-grid-week'].forEach(function (id) {
      var grid = document.getElementById(id);
      if (grid) {
        grid.addEventListener('click', function (e) {
          var cell = e.target.closest('[data-calendar-date]');
          if (!cell) return;
          var date = cell.getAttribute('data-calendar-date');
          openTeamEventModal(date);
        });
      }
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var idInput = document.getElementById('team-calendar-id');
        var titleInput = document.getElementById('team-calendar-title');
        var teamSelect = document.getElementById('team-calendar-team');
        var assigneeInput = document.getElementById('assignee_name');
        var showroomSelect = document.getElementById('team-calendar-showroom');
        var typeSelect = document.getElementById('team-calendar-type');
        var statusSelect = document.getElementById('team-calendar-status');
        var prioritySelect = document.getElementById('team-calendar-priority');
        var dateStartInput = document.getElementById('team-calendar-date-start');
        var dateEndInput = document.getElementById('team-calendar-date-end');
        var timeStartInput = document.getElementById('team-calendar-time-start');
        var timeEndInput = document.getElementById('team-calendar-time-end');
        var allDayInput = document.getElementById('team-calendar-all-day');
        var locationInput = document.getElementById('team-calendar-location');
        var contentInput = document.getElementById('team-calendar-content');
        if (!titleInput.value.trim() || !teamSelect.value || !dateStartInput.value) {
          return;
        }
        var startStr = dateStartInput.value;
        var endStr = dateEndInput.value || startStr;
        if (endStr < startStr) {
          var tmpStr = startStr;
          startStr = endStr;
          endStr = tmpStr;
        }
        var startTime = timeStartInput.value || '';
        var endTime = timeEndInput.value || '';
        var isAllDay = allDayInput ? !!allDayInput.checked : false;
        if (!isAllDay) {
          if (!startTime || !endTime) {
            window.alert('?? ?????????????/?? ??????? ?????????');
            return;
          }
          if (endTime < startTime) {
            window.alert('?? ???????? ????? ??? ????????.');
            return;
          }
        } else {
          startTime = '';
          endTime = '';
        }
        var events = getTeamEvents();
        var existingId = idInput.value;
        var cur = typeof window !== 'undefined' && window.seumAuth && window.seumAuth.currentEmployee;
        var creatorName = cur && cur.name ? String(cur.name).trim() : '';
        var creatorTeam = cur && cur.team ? String(cur.team).trim() : '';
        var creatorLabel = creatorName ? (creatorTeam ? (creatorName + ' ? ' + creatorTeam) : creatorName) : '';
        var payload = {
          title: titleInput.value.trim(),
          team: teamSelect.value,
          assignee_name: assigneeInput ? assigneeInput.value.trim() : '',
          showroomId: showroomSelect.value,
          eventType: typeSelect ? typeSelect.value : '',
          status: statusSelect ? statusSelect.value : 'planned',
          priority: prioritySelect ? prioritySelect.value : 'normal',
          startDate: startStr,
          endDate: endStr,
          startTime: startTime,
          endTime: endTime,
          allDay: isAllDay,
          location: locationInput ? locationInput.value.trim() : '',
          content: contentInput.value.trim(),
          createdByName: creatorName,
          createdByTeam: creatorTeam,
          createdBy: creatorLabel
        };
        if (console && console.log) {
          console.log('[TeamCalendar] save payload:', payload);
        }
        if (existingId) {
          var idx = events.findIndex(function (x) { return x.id === existingId; });
          if (idx !== -1) {
            events[idx] = Object.assign({}, events[idx], payload);
          }
        } else {
          payload.id = id();
          events.push(payload);
        }
        saveTeamEvents(events);
        if (typeof logActivity === 'function') {
          logActivity({
            actionType: existingId ? 'update' : 'create',
            targetType: 'calendar',
            targetId: payload.id,
            targetName: payload.title,
            description: existingId ? '??? ???' : '??? ???'
          });
        }
        ensureTeamCalendarMonth();
        var d = new Date(payload.startDate || payload.date);
        if (!isNaN(d.getTime())) {
          setTeamCalendarMonth(d.getFullYear(), d.getMonth());
        }
        renderTeamCalendar();
        if (modal) modal.classList.add('hidden');
      });
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        var idInput = document.getElementById('team-calendar-id');
        var eventId = idInput && idInput.value;
        if (!eventId) return;
        var eventsAll = getTeamEvents();
        var target = eventsAll.find(function (x) { return x.id === eventId; });
        var curTeam = getCurrentTeamCode();
        var isAdminRole = isAdmin() || isSuperAdmin();
        if (target && target.team && curTeam && target.team !== curTeam && !isAdminRole) {
          window.alert('다른 팀의 일정은 삭제할 수 없습니다.');
          return;
        }
        if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
        var events = eventsAll.filter(function (x) { return x.id !== eventId; });
        saveTeamEvents(events);
        // Supabase???????????? ????? ????? ????????
        try {
          var supabase = typeof window !== 'undefined' && window.seumSupabase;
          if (supabase) {
            supabase.from('team_events').delete().eq('local_id', eventId)
              .then(function (res) {
                if (res && res.error) console.error('Supabase team_events delete error:', res.error);
              })
              .catch(function (err) { console.error('Supabase team_events delete failed:', err); });
          }
        } catch (e) {
          console.error('Supabase team_events delete exception:', e);
        }
        if (typeof logActivity === 'function') {
          logActivity({ actionType: 'delete', targetType: 'calendar', targetId: eventId, targetName: target && target.title, description: '??? ????' });
        }
        renderTeamCalendar();
        if (modal) modal.classList.add('hidden');
      });
    }
    var yearSel = document.getElementById('team-calendar-filter-year');
    if (yearSel) {
      var now = new Date();
      var curYear = now.getFullYear();
      var options = '<option value="">전체</option>';
      for (var y = curYear - 1; y <= curYear + 1; y++) {
        options += '<option value="' + y + '"' + (y === curYear ? ' selected' : '') + '>' + y + '년</option>';
      }
      yearSel.innerHTML = options;
    }
    var monthSel = document.getElementById('team-calendar-filter-month');
    if (monthSel) {
      var curMonth = (new Date()).getMonth() + 1;
      if (!monthSel.value) monthSel.value = String(curMonth);
    }
    var filterControls = [
      'team-calendar-filter-year',
      'team-calendar-filter-month',
      'team-calendar-filter-showroom',
      'team-calendar-filter-team',
      'team-calendar-filter-assignee',
      'team-calendar-filter-status',
      'team-calendar-filter-type'
    ];
    filterControls.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var eventName = el.tagName === 'INPUT' ? 'input' : 'change';
      el.addEventListener(eventName, function () {
        renderTeamCalendar();
      });
    });
    var resetBtn = document.getElementById('team-calendar-filter-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        filterControls.forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          if (el.tagName === 'SELECT') {
            el.value = '';
          } else if (el.tagName === 'INPUT') {
            el.value = '';
          }
        });
        if (yearSel) {
          var now2 = new Date();
          var curYear2 = now2.getFullYear();
          yearSel.value = String(curYear2);
        }
        if (monthSel) {
          monthSel.value = String((new Date()).getMonth() + 1);
        }
        renderTeamCalendar();
      });
    }
    var todayBtn = document.getElementById('team-calendar-go-today');
    if (todayBtn) {
      todayBtn.addEventListener('click', function () {
        var now3 = new Date();
        setTeamCalendarMonth(now3.getFullYear(), now3.getMonth());
        renderTeamCalendar();
      });
    }
    var clearBtn = document.getElementById('team-calendar-clear-all');
    if (clearBtn) {
      // ??????(??????)?????????????? ???
      if (isSuperAdmin()) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      clearBtn.addEventListener('click', function () {
        // ??? ??????????? ??????????
        if (!isSuperAdmin()) {
          window.alert('??? ??? ????????????????????????.');
          return;
        }
        if (!window.confirm('??? ????? ?? ??????????????????\n??????? ?????????????.')) return;
        saveTeamEvents([]);
        try {
          var supabase = typeof window !== 'undefined' && window.seumSupabase;
          if (supabase) {
            supabase.from('team_events').delete().neq('local_id', null).then(function (res) {
              if (res && res.error) {
                console.error('Supabase team_events clear error:', res.error);
              }
            }).catch(function (err) {
              console.error('Supabase team_events clear failed:', err);
            });
          }
        } catch (e) {
          console.error('Supabase team_events clear exception:', e);
        }
        renderTeamCalendar();
      });
    }
    var legendButtons = document.querySelectorAll('.team-calendar-legend-item[data-team-filter]');
    legendButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var team = btn.getAttribute('data-team-filter');
        var teamSel = document.getElementById('team-calendar-filter-team');
        if (!teamSel) return;
        if (teamSel.value === team) {
          teamSel.value = '';
          legendButtons.forEach(function (b) { b.classList.remove('active'); });
        } else {
          teamSel.value = team;
          legendButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        }
        renderTeamCalendar();
      });
    });
    var viewTabs = document.querySelectorAll('.team-calendar-view-tab');
    viewTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var view = tab.getAttribute('data-view') || 'month';
        teamCalendarView = view;
        viewTabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        document.getElementById('team-calendar-view-month').classList.toggle('hidden', view !== 'month');
        document.getElementById('team-calendar-view-week').classList.toggle('hidden', view !== 'week');
        document.getElementById('team-calendar-view-list').classList.toggle('hidden', view !== 'list');
        renderTeamCalendar();
      });
    });
    var listTable = document.getElementById('team-calendar-table-list');
    if (listTable) {
      listTable.addEventListener('click', function (e) {
        var row = e.target.closest('tr[data-team-event-id]');
        if (!row) return;
        var id = row.getAttribute('data-team-event-id');
        if (id) openTeamEventModal(id);
      });
    }
    if (modal) {
      document.querySelectorAll('[data-close="modal-team-calendar"]').forEach(function (btn) {
        btn.addEventListener('click', function () { modal.classList.add('hidden'); });
      });
    }
  }

  function initKPI() {
    var btnSave = document.getElementById('btn-save-kpi-goal');
    if (btnSave) {
      btnSave.addEventListener('click', function () {
        var monthPrefix = thisMonth();
        var goals = getKpiGoals();
        goals[monthPrefix] = {
          goalContracts: Number(document.getElementById('kpi-goal-contracts').value) || 0,
          goalSales: Number(document.getElementById('kpi-goal-sales').value) || 0
        };
        saveKpiGoals(goals);
        renderKPI();
      });
    }
  }

  function initSettlementIncentive() {
    var btnApply = document.getElementById('btn-apply-incentive');
    if (btnApply) {
      btnApply.addEventListener('click', function () { renderSettlementIncentive(); });
    }
    var periodEl = document.getElementById('incentive-period');
    if (periodEl) {
      periodEl.addEventListener('change', function () { renderSettlementIncentive(); });
    }
    document.addEventListener('change', function (e) {
      if (e.target.classList && e.target.classList.contains('incentive-percent-input')) {
        var name = e.target.getAttribute('data-salesperson');
        if (!name) return;
        var val = e.target.value.trim();
        var percents = getIncentivePercents();
        percents[name] = val === '' ? '' : val;
        saveIncentivePercents(percents);
        renderSettlementIncentive();
      }
    });
  }

  function initFilter() {
    var yearEl = document.getElementById('filter-year');
    if (yearEl) {
      var currentYear = new Date().getFullYear();
      var start = Math.min(2022, currentYear - 2);
      var end = currentYear + 1;
      for (var y = end; y >= start; y--) {
        var opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = y + '년';
        yearEl.appendChild(opt);
      }
      yearEl.value = String(currentYear);
      yearEl.addEventListener('change', onFilterChange);
    }
    var monthEl = document.getElementById('filter-month');
    if (monthEl) {
      monthEl.value = String(new Date().getMonth() + 1);
      monthEl.addEventListener('change', onFilterChange);
    }
    function onFilterChange() {
      renderDashboard();
      renderMarketing();
      renderSales();
      renderDesign();
      renderConstruction();
      renderSettlement();
    }
    var el = document.getElementById('filter-showroom');
    if (el) {
      el.addEventListener('change', onFilterChange);
    }
    // 계약 목록 검색창 이벤트
    var searchInput = document.getElementById('contract-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderSales();
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          searchInput.value = '';
          renderSales();
        }
      });
    }
    var clearBtn = document.getElementById('contract-search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        renderSales();
        if (searchInput) searchInput.focus();
      });
    }
    // 설계팀 검색창 이벤트
    var designSearchInput = document.getElementById('design-search-input');
    if (designSearchInput) {
      designSearchInput.addEventListener('input', function () { renderDesign(); });
      designSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { designSearchInput.value = ''; renderDesign(); }
      });
    }
    var designClearBtn = document.getElementById('design-search-clear');
    if (designClearBtn) {
      designClearBtn.addEventListener('click', function () {
        if (designSearchInput) designSearchInput.value = '';
        renderDesign();
        if (designSearchInput) designSearchInput.focus();
      });
    }
    // 시공팀 검색창 이벤트
    var constructionSearchInput = document.getElementById('construction-search-input');
    if (constructionSearchInput) {
      constructionSearchInput.addEventListener('input', function () { renderConstruction(); });
      constructionSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { constructionSearchInput.value = ''; renderConstruction(); }
      });
    }
    var constructionClearBtn = document.getElementById('construction-search-clear');
    if (constructionClearBtn) {
      constructionClearBtn.addEventListener('click', function () {
        if (constructionSearchInput) constructionSearchInput.value = '';
        renderConstruction();
        if (constructionSearchInput) constructionSearchInput.focus();
      });
    }
    var btnReset = document.getElementById('btn-reset-samples');
    if (btnReset) {
      // ??? ????????? ????? ??????? ???????????????
      btnReset.classList.add('hidden');
    }
  }

  function initVisitDetailModal() {
    var modal = document.getElementById('modal-visit-detail');
    if (!modal) return;
    document.querySelectorAll('[data-close="modal-visit-detail"]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.classList.add('hidden'); });
    });
  }

  function initContractChatModal() {
    var modal = document.getElementById('modal-contract-chat');
    if (modal) {
      document.querySelectorAll('[data-close="modal-contract-chat"]').forEach(function (btn) {
        btn.addEventListener('click', function () { modal.classList.add('hidden'); });
      });
    }
    var modalForm = document.getElementById('modal-contract-chat-form');
    var modalInput = document.getElementById('modal-contract-chat-input');
    if (modalForm && modalInput) {
      modalInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          modalForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
      modalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var contractId = document.getElementById('modal-contract-chat-contract-id') && document.getElementById('modal-contract-chat-contract-id').value;
        var text = (modalInput.value || '').trim();
        if (!contractId || !text) return;
        var me = typeof window.getCurrentChatUser === 'function' ? window.getCurrentChatUser() : null;
        if (!me) return;
        var msg = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          contract_id: contractId,
          sender_id: me.id,
          sender_name: me.name,
          message: text,
          created_at: new Date().toISOString()
        };
        if (typeof window.saveContractChatMessage === 'function') window.saveContractChatMessage(contractId, msg);
        modalInput.value = '';
        if (typeof window.renderContractChat === 'function') window.renderContractChat(contractId, 'modal-contract-chat-message-list');
      });
    }
    var designChatBtn = document.getElementById('design-detail-chat-btn');
    if (designChatBtn) {
      designChatBtn.addEventListener('click', function () {
        var idEl = document.getElementById('design-inline-contract-id');
        var id = idEl && idEl.value;
        if (id && typeof openContractChatModal === 'function') openContractChatModal(id);
      });
    }
    var constructionChatBtn = document.getElementById('construction-detail-chat-btn');
    if (constructionChatBtn) {
      constructionChatBtn.addEventListener('click', function () {
        var id = typeof expandedConstructionId !== 'undefined' ? expandedConstructionId : null;
        if (id && typeof openContractChatModal === 'function') openContractChatModal(id);
      });
    }
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-open-contract-chat') || e.target.closest('.btn-open-contract-chat')) {
        var btn = e.target.classList.contains('btn-open-contract-chat') ? e.target : e.target.closest('.btn-open-contract-chat');
        var id = btn && btn.getAttribute('data-contract-id');
        if (id && typeof openContractChatModal === 'function') openContractChatModal(id);
      }
    });
  }

  window.getContracts = getContracts;
  window.getShowroomName = getShowroomName;
  window.showSection = showSection;
  window.showDesignDetailPanel = showDesignDetailPanel;
  window.renderDesign = renderDesign;
  window.isAdmin = isAdmin;
  window.isMaster = isMaster;
  window.isManager = isManager;
  window.formatDate = formatDate;
  window.resolveShowroomId = resolveShowroomId;
  window.sanitizeNoticeFileName = sanitizeNoticeFileName;

  function init() {
    ensureSamples();
    ensureEmployeesAndKpi();
    // Supabase? ??? ??, ? ??, ?? ?? ???? ? ??? ??? ??.
    syncContractsFromSupabase();
    syncTeamEventsFromSupabase();
    syncAnnouncementsFromSupabase();
    syncActivityLogsFromSupabase();
    initMobileSidebar();
    initNav();
    initFilter();
    initVisitDetailModal();
    initVisitAssign();
    if (typeof window.initChatPanel === 'function') window.initChatPanel();
    initDesignPermitModal();
    initDesignDetailPanel();
    initContractDetailPanel();
    initContractChatModal();
    initConstructionStagesModal();
    initVisitForm();
    initCustomerForm();
    initContractForm();
    initContractDetailModal();
    initPaymentModal();
    initContractFieldModal();
    initHR();
    initKPI();
    initAdminApproval();
    initAdminEmployees();
    initAdminShowrooms();
    initAdminCustomers();
    initAdminPresence();
    initAdminActivityLogs();
    initSettlementIncentive();
    updateAdminNavVisibility();
    updateManageNavVisibility();
    updateCeoNavVisibility();
    updateDesignWorklogNavVisibility();
    updateConstructionRestrictedNavVisibility();
    updateSalesRestrictedNavVisibility();
    initCeoReports();
    syncCeoReportsFromSupabase();
    initExpenseReport();

    // 섹션 인쇄 버튼 (새 창 방식)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-section-print');
      if (!btn) return;
      var sectionId = btn.getAttribute('data-print-section');
      var section = sectionId && document.getElementById(sectionId);
      if (!section) return;
      // 입력값 동기화 후 클론
      var clone = section.cloneNode(true);
      var origInputs = section.querySelectorAll('input, textarea, select');
      var cloneInputs = clone.querySelectorAll('input, textarea, select');
      origInputs.forEach(function (orig, i) {
        var cl = cloneInputs[i];
        if (!cl) return;
        if (orig.type === 'checkbox' || orig.type === 'radio') {
          if (orig.checked) cl.setAttribute('checked', ''); else cl.removeAttribute('checked');
        } else {
          cl.setAttribute('value', orig.value);
          if (cl.tagName === 'TEXTAREA') cl.textContent = orig.value;
          if (cl.tagName === 'SELECT') {
            Array.from(cl.options).forEach(function (opt, oi) {
              if (orig.options[oi] && orig.options[oi].selected) opt.setAttribute('selected', ''); else opt.removeAttribute('selected');
            });
          }
        }
      });
      // 인쇄 불필요 요소 제거
      clone.querySelectorAll('.no-print, .btn-section-print').forEach(function (el) { el.remove(); });
      // 보고 목록 카드, 미리보기 박스, 상세 카드 제거
      ['#ceo-daily-preview-box','#ceo-weekly-preview-box','#ceo-monthly-preview-box',
       '#ceo-daily-detail','#ceo-weekly-detail','#ceo-monthly-detail'].forEach(function(sel) {
        var el = clone.querySelector(sel); if (el) el.remove();
      });
      ['#tbody-ceo-daily','#tbody-ceo-weekly','#tbody-ceo-monthly'].forEach(function(sel) {
        var el = clone.querySelector(sel);
        if (el) { var card = el.closest('.card'); if (card) card.remove(); }
      });
      var w = window.open('', '_blank', 'width=820,height=1100');
      if (!w) return;
      w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>인쇄</title><style>' +
        '@page{size:A4 portrait;margin:12mm}' +
        'body{font-family:"Noto Sans KR",sans-serif;color:#111;background:#fff;margin:0;padding:0;font-size:12px;line-height:1.4}' +
        'h2{font-size:1.3rem;margin:0 0 2mm}h3{font-size:1rem;margin:1mm 0}h4{font-size:0.95rem;margin:1mm 0}' +
        'p{margin:0 0 1mm;color:#555}' +
        'button,input[type=button],input[type=submit],.btn{display:none!important}' +
        '.hidden{display:none!important}' +
        '.card{border:1px solid #ccc;border-radius:4px;padding:3mm 4mm;margin-bottom:4mm;break-inside:avoid}' +
        '.main-header{margin-bottom:3mm}.section-desc{font-size:0.8rem;color:#555}' +
        '.form-row{display:flex;gap:3mm;margin-bottom:3mm;grid-column:span 2}' +
        '.form-actions{display:none!important}' +
        '#form-ceo-daily,#form-ceo-weekly,#form-ceo-monthly{display:grid;grid-template-columns:1fr 1fr;gap:2mm 4mm}' +
        '.ceo-block{border:1px solid #ddd;padding:2mm 3mm;margin-bottom:0;break-inside:avoid}' +
        '.ceo-block:has(textarea){grid-column:span 2}' +
        '.ceo-block-title{font-weight:700;margin-bottom:1mm;font-size:0.85rem}' +
        '.ceo-row{display:flex;gap:2mm;margin-bottom:0.5mm;align-items:center}' +
        '.ceo-label{min-width:6rem;font-size:0.78rem;color:#555;flex-shrink:0}' +
        '.ceo-sub-label{min-width:5rem;font-size:0.75rem;color:#555;flex-shrink:0}' +
        '.ceo-input{border:none;border-bottom:1px solid #ccc;flex:1;padding:0;font-size:0.82rem;background:transparent}' +
        'textarea.ceo-input,textarea{border:1px solid #ccc;width:100%;box-sizing:border-box;padding:1mm 2mm;font-size:0.82rem;background:transparent;resize:none;min-height:10mm;font-family:inherit}' +
        '.ceo-preview-box{display:none!important}' +
        '.ceo-db-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:5mm}' +
        '.ceo-db-kpi-card{border:1px solid #ccc;border-radius:3px;padding:3mm;text-align:center}' +
        '.ceo-db-kpi-label{font-size:0.75rem;color:#555;margin-bottom:1mm}' +
        '.ceo-db-kpi-value{font-size:1.5rem;font-weight:700;margin-bottom:1mm}' +
        '.ceo-db-kpi-sub{font-size:0.72rem;color:#777}' +
        '.ceo-db-section-title{font-weight:700;font-size:1rem;margin:4mm 0 2mm;border-left:3px solid #333;padding-left:2mm}' +
        '.ceo-db-progress-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:5mm}' +
        '.ceo-db-progress-card{border:1px solid #ccc;border-radius:3px;padding:3mm;text-align:center}' +
        '.ceo-db-prog-num{font-size:1.5rem;font-weight:700}.ceo-db-prog-label{font-size:0.75rem;color:#555}' +
        '.ceo-db-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:5mm}' +
        '.ceo-db-table-wrap,.table-wrap{overflow:visible!important}' +
        'table{width:100%;border-collapse:collapse;font-size:0.78rem}' +
        'th,td{border:1px solid #999;padding:2mm 3mm}th{background:#f5f5f5;font-weight:600}' +
        '.ceo-db-issue-label{font-weight:700;margin-bottom:1mm;font-size:0.85rem}' +
        '.ceo-db-issue-list{margin:0 0 3mm;padding-left:4mm;font-size:0.8rem}' +
        '.ceo-db-cw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:4mm}' +
        '.ceo-db-cw-card{border:1px solid #ccc;border-radius:3px;padding:3mm;text-align:center}' +
        '.ceo-db-cw-num{font-size:1.3rem;font-weight:700}.ceo-db-cw-label{font-size:0.75rem;color:#555}' +
        '.accent-blue{color:#2563eb!important}.accent-green{color:#16a34a!important}.accent-orange{color:#d97706!important}.accent-red{color:#dc2626!important}' +
        '.expense-approval-table{border-collapse:collapse;font-size:0.78rem}.expense-approval-table th,.expense-approval-table td{border:1px solid #999;padding:3px 8px;text-align:center}' +
        '.expense-info-table{width:100%;border-collapse:collapse;font-size:0.88rem;margin-bottom:4mm}.expense-info-table th,.expense-info-table td{border:1px solid #999;padding:2mm 3mm}.expense-info-table th{background:#f5f5f5;font-weight:700;white-space:nowrap}' +
        '.expense-info-input{background:transparent;border:none;width:100%;font-size:0.88rem;font-family:inherit}' +
        '.expense-items-table{width:100%;border-collapse:collapse;font-size:0.82rem}.expense-items-table th,.expense-items-table td{border:1px solid #999;padding:1.5mm 2mm;vertical-align:top}.expense-items-table th{background:#f5f5f5;font-weight:700;text-align:center}' +
        '.expense-cell-input{background:transparent;border:none;width:100%;font-family:inherit;font-size:0.82rem}' +
        '</style></head><body>' + clone.innerHTML + '</body></html>');
      w.document.close();
      w.focus();
      setTimeout(function () { w.print(); }, 400);
    });
    window.seumAuth = window.seumAuth || {};
    window.seumAuth.onReady = function () {
      updateAdminNavVisibility();
      updateManageNavVisibility();
      updateCeoNavVisibility();
      updateDesignWorklogNavVisibility();
      updateConstructionRestrictedNavVisibility();
      updateSalesRestrictedNavVisibility();
      if (typeof applyChatTabVisibility === 'function') applyChatTabVisibility();
      // ????? ????? ?? ???? ???????? ????????? ????????? ?????
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderSales === 'function') renderSales();
    };
    initHR();
    initTeamCalendar();
    initDelegation();
    renderTodayMessage();
    renderDashboard();
    renderAnnouncementsPage();
    renderSidebarAnnouncementBadge();
    renderMarketing();
    renderSales();
    // ?????init?? ??? ???????(???? currentEmployee ???) ??? ??? ???????? ?????????
    if (window.seumAuth && window.seumAuth.currentEmployee && typeof renderSales === 'function') {
      renderSales();
    }
    renderDesign();
    renderDesignWorklog();
    renderConstructionWorklog();
    initConstructionWorklogEvents();
    renderConstruction();
    renderProcurement();
    renderSettlement();
    initAnnouncementDetailModal();
    initAnnouncementFormModal();
    renderHR();
    renderTeamCalendar();
    renderKPI();
    console.log('???????? OS ??? ??');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
