/**
 * Auth helper – login, register, logout, session guard.
 */

const auth = {
  async login(payload) {
    const data = await api.post('/auth/login', payload);
    writeSession({ user: data.user, tokens: data.tokens });
    return data;
  },

  async register(payload) {
    const data = await api.post('/auth/register', payload);
    writeSession({ user: data.user, tokens: data.tokens });
    return data;
  },

  async logout() {
    const session = readSession();
    try {
      if (session?.tokens?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: session.tokens.refreshToken });
      }
    } finally {
      writeSession(null);
      window.location.href = '/login.html';
    }
  },

  async getMe() {
    const data = await api.get('/auth/me');
    const session = readSession();
    if (session) {
      writeSession({ ...session, user: data.user });
    }
    return data;
  },

  getUser() {
    return readSession()?.user || null;
  },

  isAuthenticated() {
    const session = readSession();
    return Boolean(session?.user && session?.tokens?.accessToken);
  },

  /**
   * Redirect unauthenticated users to login.
   * If allowedRoles is provided, also check the role.
   */
  guard(allowedRoles) {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    if (allowedRoles && !allowedRoles.includes(this.getUser().role)) {
      window.location.href = getDefaultRouteForRole(this.getUser().role);
      return false;
    }
    return true;
  },
};

window.auth = auth;
