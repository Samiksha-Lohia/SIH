import { STORAGE_KEYS } from './constants.js';

export const storage = {
  getAccessToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  setAccessToken(token) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
    } catch (e) {
      console.warn('Unable to persist accessToken:', e);
    }
  },

  getRefreshToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  setRefreshToken(token) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch (e) {
      console.warn('Unable to persist refreshToken:', e);
    }
  },

  getCachedUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCachedUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('Unable to persist user:', e);
    }
  },

  setAuthSession(tokens = {}, user = null) {
    if (tokens.accessToken) this.setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) this.setRefreshToken(tokens.refreshToken);
    if (user) this.setCachedUser(user);
  },

  clearAuthSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.warn('Unable to clear auth session:', e);
    }
  },
};
