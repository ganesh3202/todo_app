import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage then verify with server
  useEffect(() => {
    const token     = localStorage.getItem('taskflow_token');
    const savedUser = localStorage.getItem('taskflow_user');

    if (!token) {
      setLoading(false);
      return;
    }

    // Optimistically restore from storage so UI appears fast
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (_) {}
    }

    // Verify token with server
    authAPI.getMe()
      .then(res => {
        setUser(res.user);
        localStorage.setItem('taskflow_user', JSON.stringify(res.user));
      })
      .catch(() => {
        // Token invalid / server down — clear storage
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('taskflow_token', res.token);
    localStorage.setItem('taskflow_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    localStorage.setItem('taskflow_token', res.token);
    localStorage.setItem('taskflow_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
