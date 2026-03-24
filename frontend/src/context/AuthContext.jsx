import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kothabhada_token';
const USER_KEY = 'kothabhada_user';

function getSessionStorageSafe() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function clearLegacySharedAuth() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore storage cleanup issues
  }
}

export function AuthProvider({ children }) {
  const syncRequestRef = useRef(0);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize token from per-tab sessionStorage.
  const [token, setToken] = useState(() => {
    try {
      const storage = getSessionStorageSafe();
      const storedToken = storage?.getItem(TOKEN_KEY);
      return storedToken || '';
    } catch {
      return '';
    }
  });

  // Initialize user from per-tab sessionStorage only if token exists.
  const [user, setUser] = useState(() => {
    try {
      const storage = getSessionStorageSafe();
      const storedToken = storage?.getItem(TOKEN_KEY);
      if (!storedToken) return null;

      const raw = storage?.getItem(USER_KEY);
      if (!raw) return null;

      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Remove old shared credentials so separate tabs cannot overwrite each other.
    clearLegacySharedAuth();
  }, []);

  useEffect(() => {
    const storage = getSessionStorageSafe();
    if (!storage) return;

    if (token) {
      storage.setItem(TOKEN_KEY, token);
    } else {
      storage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    const storage = getSessionStorageSafe();
    if (!storage) return;

    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      storage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!token) {
      // If no token, ensure user is cleared immediately
      setUser(null);
      setAuthLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = ++syncRequestRef.current;
    setAuthLoading(true);

    async function syncUser() {
      try {
        const res = await api.get('/auth/me');
        if (!cancelled && requestId === syncRequestRef.current && res.data?.user) {
          setUser(res.data.user);
        }
      } catch (error) {
        if (!cancelled && requestId === syncRequestRef.current) {
          // Token is invalid, clear everything
          const storage = getSessionStorageSafe();
          setToken('');
          setUser(null);
          storage?.removeItem(TOKEN_KEY);
          storage?.removeItem(USER_KEY);
        }
      } finally {
        if (!cancelled && requestId === syncRequestRef.current) {
          setAuthLoading(false);
        }
      }
    }

    // Always sync user when token changes
    syncUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (authToken, authUser) => {
    const requestId = ++syncRequestRef.current;

    if (!authToken) {
      setToken('');
      setUser(null);
      setAuthLoading(false);
      return null;
    }

    setAuthLoading(true);

    // Force a clean switch before setting the next account.
    const storage = getSessionStorageSafe();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    setUser(null);

    // Set the new token immediately so dependent effects and API calls use it.
    storage?.setItem(TOKEN_KEY, authToken);
    setToken(authToken);

    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const nextUser = res.data?.user || authUser || null;
      if (requestId === syncRequestRef.current) {
        setUser(nextUser);
      }
      return nextUser;
    } catch {
      const fallbackUser = authUser || null;
      if (requestId === syncRequestRef.current) {
        setUser(fallbackUser);
      }
      return fallbackUser;
    } finally {
      if (requestId === syncRequestRef.current) {
        setAuthLoading(false);
      }
    }
  };

  const logout = () => {
    ++syncRequestRef.current;

    // Clear storage synchronously BEFORE state changes
    const storage = getSessionStorageSafe();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    clearLegacySharedAuth();
    
    // THEN update state to trigger immediate re-renders everywhere
    setUser(null);
    setToken('');
    setAuthLoading(false);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser || null);
  };

  const value = {
    token,
    user,
    authLoading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
