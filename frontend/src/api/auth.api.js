import { api } from './client.js';

export const authApi = {
  /**
   * Register a new account.
   * @param {{ name: string, email: string, password: string, role?: string, phone?: string }} payload
   */
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data; // { user, tokens: { accessToken, refreshToken } }
  },

  /**
   * Login with email and password.
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data; // { user, tokens: { accessToken, refreshToken } }
  },

  /**
   * Fetch current authenticated user.
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data?.user;
  },

  /**
   * Fetch current authenticated user's role profile (student, faculty, institution, industry).
   */
  async getMyProfile() {
    const res = await api.get('/profiles/me');
    return res.data; // { role, profile, exists }
  },

  /**
   * Logout session (acknowledges with backend and clears tokens).
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Stateless logout: tolerate errors on remote acknowledge
    }
  },
};
