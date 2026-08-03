/**
 * assets/js/auth.js
 * Authentication helpers: login, logout, getUser, role guards.
 */

const Auth = {
  TOKEN_KEY: 'sos_token',
  USER_KEY:  'sos_user',

  /** Store auth data in localStorage */
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /** Remove auth data */
  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /** Get stored token */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /** Get stored user object */
  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Check if user is logged in */
  isLoggedIn() {
    return !!this.getToken();
  },

  /** Check if logged-in user has a specific role */
  hasRole(role) {
    const user = this.getUser();
    return user ? user.role === role : false;
  },

  /**
   * Login via API.
   * @returns {{ success, user, message }}
   */
  async login(username, password) {
    const res = await API.post('/auth/login', { username, password });
    if (res.success && res.data) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  },

  /** Logout and redirect to homepage */
  logout(redirectUrl = '/index.html') {
    this.clearSession();
    window.location.href = redirectUrl;
  },

  /**
   * Guard: redirect to login if not authenticated.
   * @param {string} role - required role
   * @param {string} loginUrl - redirect target if not logged in
   */
  requireAuth(role, loginUrl) {
    if (!this.isLoggedIn()) {
      window.location.href = loginUrl || '/index.html';
      return false;
    }
    if (role && !this.hasRole(role)) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
};

// Make globally available
window.Auth = Auth;
