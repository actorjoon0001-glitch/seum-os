(function () {
  'use strict';

  var supabase = window.seumSupabase;
  /** 전역 직원 정보 (팀/권한별 메뉴 분기 등 재사용) */
  window.seumAuth = window.seumAuth || { currentEmployee: null };

  if (!supabase) {
    window.seumAuth.login = function () { return Promise.resolve({ success: false, error: 'Supabase가 설정되지 않았습니다. js/supabase.js의 URL·키를 확인해 주세요.' }); };
    window.seumAuth.signup = function () { return Promise.resolve({ success: false, error: 'Supabase가 설정되지 않았습니다.' }); };
    window.seumAuth.logout = function () { window.location.href = 'login.html'; };
    window.seumAuth.requireAuth = function () { window.location.replace('login.html'); return Promise.reject(); };
    return;
  }

  /**
   * auth_user_id로 public.employees 조회 (공통 사용, 예외 시 null 반환)
   * RPC는 존재 컬럼만 반환: id, name, team, role, showroom, status
   * @param {string} authUserId auth.users.id
   * @returns {Promise<{ id, name, team, role, showroom, status }|null>}
   */
  async function fetchEmployeeByAuthId(authUserId) {
    if (!authUserId) return null;
    try {
      var rpcResult = await supabase.rpc('get_employee_by_auth_id', { p_auth_user_id: authUserId });
      if (rpcResult.error) return null;
      var rows = rpcResult.data;
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * RPC 미적용 시 fallback: get_employee_status_by_auth_id로 name·status만 조회
   */
  async function fetchEmployeeByAuthIdFallback(authUserId) {
    if (!authUserId) return null;
    try {
      var r = await supabase.rpc('get_employee_status_by_auth_id', { p_auth_user_id: authUserId });
      if (r.error || !Array.isArray(r.data) || r.data.length === 0) return null;
      var row = r.data[0];
      return { name: row.name, status: row.status, team: null, role: null, showroom: null, permission: null };
    } catch (e) {
      return null;
    }
  }

  /**
   * 로그인 (이메일/비밀번호) → Auth 성공 후 employees 조회, 직원 정보·승인 확인 후 대시보드 진입
   * @param {string} email 이메일
   * @param {string} password 비밀번호
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async function login(email, password) {
    var emailTrim = (email || '').trim();
    if (!emailTrim || !password) {
      return { success: false, error: '이메일과 비밀번호를 입력해 주세요.' };
    }
    var signInResult = await supabase.auth.signInWithPassword({
      email: emailTrim,
      password: password
    });
    if (signInResult.error) {
      var rawMsg = signInResult.error.message || '';
      var msg = rawMsg;
      if (rawMsg === 'Invalid login credentials') {
        msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (!rawMsg) {
        msg = '로그인에 실패했습니다.';
      }
      return { success: false, error: msg };
    }
    var user = signInResult.data && signInResult.data.user;
    if (!user || !user.id) {
      await supabase.auth.signOut();
      return { success: false, error: '로그인 정보를 확인할 수 없습니다.' };
    }
    var employee = await fetchEmployeeByAuthId(user.id);
    if (!employee) {
      employee = await fetchEmployeeByAuthIdFallback(user.id);
    }
    if (!employee) {
      await supabase.auth.signOut();
      return { success: false, error: '직원 정보가 등록되지 않았습니다. 관리자에게 문의하세요.' };
    }
    if ((employee.status || '') !== 'approved') {
      await supabase.auth.signOut();
      return { success: false, error: '승인되지 않은 계정입니다. 관리자에게 문의하세요.' };
    }
    setCurrentEmployee(employee, user.email, user.id);
    await upsertUserPresence({
      user_id: employee.id,
      status: 'online',
      last_seen: isoNow(),
      last_login_at: isoNow()
    });
    startPresenceHeartbeat(employee.id);
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_name: (employee.name || '').trim() || null,
        department: (employee.team || '').trim() || null,
        showroom: (employee.showroom || '').trim() || null,
        action_type: 'login',
        target_type: 'auth',
        description: '로그인'
      });
    } catch (e) { /* ignore */ }
    window.location.href = 'dashboard.html';
    return { success: true };
  }

  /**
   * currentEmployee 전역 설정 (permission/email 없어도 안전하게 처리)
   * employee는 RPC 반환값으로 permission·email 컬럼이 없을 수 있음
   */
  function setCurrentEmployee(employee, authEmail, authUserId) {
    var emp = employee || {};
    window.seumAuth.currentEmployee = {
      id: emp.id != null ? emp.id : null,
      authUserId: (authUserId != null && String(authUserId).trim() !== '') ? String(authUserId).trim() : null,
      name: (emp.name != null && String(emp.name).trim() !== '') ? String(emp.name).trim() : (authEmail || '직원'),
      team: (emp.team != null && String(emp.team).trim() !== '') ? String(emp.team).trim() : null,
      role: (emp.role != null && String(emp.role).trim() !== '') ? String(emp.role).trim() : null,
      showroom: (emp.showroom != null && String(emp.showroom).trim() !== '') ? String(emp.showroom).trim() : null,
      status: (emp.status != null && String(emp.status).trim() !== '') ? String(emp.status).trim() : null,
      permission: (emp.permission != null && String(emp.permission).trim() !== '') ? String(emp.permission).trim() : 'staff',
      email: (authEmail != null && String(authEmail).trim() !== '') ? String(authEmail).trim() : null
    };
  }

  async function upsertUserPresence(payload) {
    if (!payload || !payload.user_id) return;
    try {
      await supabase.from('user_presence').upsert(payload, { onConflict: 'user_id' });
    } catch (e) {
      console.error('user_presence upsert 실패:', e);
    }
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function startPresenceHeartbeat(userId) {
    if (!userId) return;
    if (window.seumAuth._presenceInterval) {
      clearInterval(window.seumAuth._presenceInterval);
      window.seumAuth._presenceInterval = null;
    }
    upsertUserPresence({ user_id: userId, status: 'online', last_seen: isoNow() });
    window.seumAuth._presenceInterval = setInterval(function () {
      upsertUserPresence({ user_id: userId, status: 'online', last_seen: isoNow() });
    }, 60 * 1000);
  }

  /**
   * 직원 회원가입 (Supabase Auth + employees 테이블 저장)
   * @param {Object} data - { name, phone?, email, password, showroom?, team?, birth_date?, position_name? }
   * @returns {Promise<{ success: boolean, error?: string, message?: string }>}
   */
  async function signup(data) {
    var name = (data && data.name != null) ? String(data.name).trim() : '';
    var email = (data && data.email != null) ? String(data.email).trim() : '';
    var password = data && data.password ? data.password : '';
    if (!name || !email || !password) {
      return { success: false, error: '이름, 이메일, 비밀번호를 입력해 주세요.' };
    }
    var signUpResult = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: name } }
    });
    if (signUpResult.error) {
      return { success: false, error: signUpResult.error.message || '회원가입에 실패했습니다.' };
    }
    var user = signUpResult.data.user;
    if (!user || !user.id) {
      return { success: false, error: '계정 정보를 가져올 수 없습니다.' };
    }
    /* 회원가입 폼과 동일하게 저장 (컬럼 없으면 insert 시 에러 나므로 employees에 컬럼 추가 후 사용) */
    var insertPayload = {
      auth_user_id: user.id,
      name: (name || (user.user_metadata && user.user_metadata.full_name)) || null,
      email: (email || (user && user.email)) || null,
      role: 'staff',
      status: 'pending',
      team: (data.team && String(data.team).trim()) ? String(data.team).trim() : null,
      showroom: (data.showroom && String(data.showroom).trim()) ? String(data.showroom).trim() : null,
      phone: (data.phone && String(data.phone).trim()) ? String(data.phone).trim() : null,
      birth_date: (data.birth_date && String(data.birth_date).trim()) ? String(data.birth_date).trim() : null,
      position_name: (data.position_name != null && String(data.position_name).trim()) ? String(data.position_name).trim() : null,
      permission: 'staff'
    };
    var insertResult = await supabase.from('employees').insert(insertPayload).select('id').single();
    if (insertResult.error) {
      return { success: false, error: insertResult.error.message || '직원 정보 저장에 실패했습니다.' };
    }
    await supabase.auth.signOut();
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인해 주세요.'
    };
  }

  /**
   * 로그아웃 후 로그인 페이지로 이동
   */
  async function logout() {
    try {
      var cur = window.seumAuth && window.seumAuth.currentEmployee;
      var empId = cur && cur.id;
      var authUid = cur && cur.authUserId;
      if (authUid) {
        try {
          await supabase.from('activity_logs').insert({
            user_id: authUid,
            user_name: (cur.name || '').trim() || null,
            department: (cur.team || '').trim() || null,
            showroom: (cur.showroom || '').trim() || null,
            action_type: 'logout',
            target_type: 'auth',
            description: '로그아웃'
          });
        } catch (e2) { /* ignore */ }
      }
      if (empId) {
        await upsertUserPresence({
          user_id: empId,
          status: 'offline',
          last_seen: isoNow(),
          last_logout_at: isoNow()
        });
      }
      if (window.seumAuth._presenceInterval) {
        clearInterval(window.seumAuth._presenceInterval);
        window.seumAuth._presenceInterval = null;
      }
    } catch (e) {
      console.error('logout presence update 실패:', e);
    }
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  }

  /**
   * 대시보드 접근 시 세션 + employees 조회 및 승인 확인
   * 직원 정보 없음/미승인 시 login.html로 redirect (?error=no_employee | not_approved)
   * @returns {Promise<void>}
   */
  async function requireAuth() {
    var session = (await supabase.auth.getSession()).data.session;
    if (!session || !session.user || !session.user.id) {
      window.location.replace('login.html');
      return Promise.reject(new Error('no_session'));
    }
    var authUserId = session.user.id;
    var employee = await fetchEmployeeByAuthId(authUserId);
    if (!employee) {
      employee = await fetchEmployeeByAuthIdFallback(authUserId);
    }
    if (!employee) {
      window.location.replace('login.html?error=no_employee');
      return Promise.reject(new Error('no_employee'));
    }
    if ((employee.status || '') !== 'approved') {
      window.location.replace('login.html?error=not_approved');
      return Promise.reject(new Error('not_approved'));
    }
    setCurrentEmployee(employee, session.user && session.user.email ? session.user.email : null, authUserId);
    await upsertUserPresence({
      user_id: employee.id,
      status: 'online',
      last_seen: isoNow(),
      last_login_at: isoNow()
    });
    startPresenceHeartbeat(employee.id);
    if (typeof window.seumAuth.onReady === 'function') window.seumAuth.onReady();
    var cur = window.seumAuth.currentEmployee;
    var displayName = (cur && cur.name ? cur.name : '직원');
    var teamRaw = (cur && cur.team ? String(cur.team).trim() : '') || null;
    var displayTeam = teamRaw ? (teamRaw.indexOf('팀') !== -1 ? teamRaw : teamRaw + '팀') : null;
    var showroomLabel = null;
    var showroomId = (cur && cur.showroom ? String(cur.showroom).trim() : '') || '';
    if (showroomId === 'headquarters' || showroomId === '본사 전시장' || showroomId === '본점') showroomLabel = '본사 전시장';
    else if (showroomId === 'showroom1' || showroomId === '1전시장' || showroomId === '제1전시장') showroomLabel = '1전시장';
    else if (showroomId === 'showroom3' || showroomId === '3전시장' || showroomId === '제3전시장') showroomLabel = '3전시장';
    else if (showroomId === 'showroom4' || showroomId === '4전시장' || showroomId === '제4전시장') showroomLabel = '4전시장';
    else if (showroomId) showroomLabel = showroomId;

    var sidebarEl = document.getElementById('sidebar-current-user');
    if (sidebarEl) sidebarEl.textContent = displayName + '님';

    var parts = [];
    if (showroomLabel) parts.push(showroomLabel);
    if (displayTeam) parts.push(displayTeam);
    parts.push(displayName + '님');

    var mainHeaderEl = document.getElementById('main-current-user');
    if (mainHeaderEl) {
      mainHeaderEl.textContent = parts.join(' | ');
    }
    var btn = document.getElementById('btn-logout');
    if (btn) {
      btn.addEventListener('click', function () { logout(); });
    }
  }

  function isDashboardPage() {
    var path = window.location.pathname || '';
    return path.indexOf('dashboard') !== -1;
  }

  window.seumAuth.login = login;
  window.seumAuth.signup = signup;
  window.seumAuth.logout = logout;
  window.seumAuth.requireAuth = requireAuth;
  window.seumAuth.fetchEmployeeByAuthId = fetchEmployeeByAuthId;

  if (isDashboardPage()) {
    window.seumAuth.authReady = requireAuth();
  }
})();
