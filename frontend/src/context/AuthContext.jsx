import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kothabhada_token';
const USER_KEY = 'kothabhada_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;

    async function syncUser() {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data?.user || null);
      } catch {
        setToken('');
        setUser(null);
      }
    }

    syncUser();
  }, [token]);

  const login = (authToken, authUser) => {
    setToken(authToken || '');
    setUser(authUser || null);
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser || null);
  };

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateUser,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
