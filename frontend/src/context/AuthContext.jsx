import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { storage } from '../lib/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => storage.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = user?.role || null;
  const isAuthenticated = Boolean(user && accessToken);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const token = storage.getAccessToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getMe();
        if (isMounted) {
          setUser(currentUser);
          setAccessToken(token);
          storage.setCachedUser(currentUser);
        }
      } catch (err) {
        console.warn('Initial session check failed:', err.message);
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
          storage.clearAuthSession();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for unauthorized/expired session events from the API client
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        setAccessToken(null);
        storage.clearAuthSession();
      }
    };

    window.addEventListener('sutra:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('sutra:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    try {
      const { user: authedUser, tokens } = await authApi.login({ email, password });
      storage.setAuthSession(tokens, authedUser);
      setUser(authedUser);
      setAccessToken(tokens.accessToken);
      return authedUser;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const { user: registeredUser, tokens } = await authApi.register(payload);
      storage.setAuthSession(tokens, registeredUser);
      setUser(registeredUser);
      setAccessToken(tokens.accessToken);
      return registeredUser;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      storage.clearAuthSession();
      setUser(null);
      setAccessToken(null);
      setError(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.getMe();
      setUser(fresh);
      storage.setCachedUser(fresh);
      return fresh;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      return null;
    }
  }, []);

  const value = {
    user,
    role,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
