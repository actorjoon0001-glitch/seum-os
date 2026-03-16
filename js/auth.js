/**
 * auth.js — Authentication Module
 * Seum OS | Seum Design Housing
 *
 * CURRENT: Uses localStorage with hardcoded demo credentials.
 * FUTURE:  Replace login() with Supabase Auth (supabase.auth.signInWithPassword)
 *          and replace session checks with Supabase session management.
 *
 * SECURITY NOTE: Do NOT store sensitive real passwords in plain JS.
 * This approach is acceptable only during development/demo phase.
 * Migrate to Supabase Auth before any production deployment.
 */

const Auth = (() => {
  const SESSION_KEY = 'seum_session';
  const USERS_KEY   = 'seum_users';

  // ── Demo Users (Replace with Supabase Auth in production) ──────────
  // Passwords are stored as plain text here for prototype only.
  // In production: use Supabase Auth which handles hashing server-side.
  const DEMO_USERS = [
    { id: 'u1', name: 'Admin User',   email: 'admin@seumhousing.com',   password: 'admin123',  role: 'admin',   department: 'Management' },
    { id: 'u2', name: 'Sales Manager', email: 'sales@seumhousing.com', password: 'sales123',  role: 'manager', department: 'Sales' },
    { id: 'u3', name: 'Staff Member',  email: 'staff@seumhousing.com', password: 'staff123',  role: 'staff',   department: 'Operations' },
  ];

  // Seed demo users into localStorage if not already present
  function _seedUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
    }
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Attempt to log in a user.
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, message?: string }}
   *
   * TODO: Replace body with:
   *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   */
  function login(email, password) {
    _seedUsers();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Incorrect email or password.' };
    }

    const session = {
      userId:    user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      department: user.department,
      loginAt:   new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  /**
   * Log out the current user and redirect to login page.
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('index.html');
  }

  /**
   * Check if a user is currently logged in.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return !!localStorage.getItem(SESSION_KEY);
  }

  /**
   * Get the current session object.
   * @returns {Object|null}
   */
  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Get the current user's role.
   * @returns {string|null} 'admin' | 'manager' | 'staff' | null
   */
  function getRole() {
    const session = getSession();
    return session ? session.role : null;
  }

  /**
   * Guard function — call at top of every protected page.
   * Redirects to login if not authenticated.
   */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.replace('index.html');
    }
  }

  /**
   * Guard function — check if current user has required role.
   * @param {string[]} roles - Allowed roles
   * @returns {boolean}
   */
  function hasRole(roles) {
    return roles.includes(getRole());
  }

  return { login, logout, isLoggedIn, getSession, getRole, requireAuth, hasRole };
})();
