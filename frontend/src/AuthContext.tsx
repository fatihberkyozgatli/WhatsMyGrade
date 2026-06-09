import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const decodeExpiryMs = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const expiry = decodeExpiryMs(token);
  return expiry === null || expiry <= Date.now();
};

const readValidToken = (): string | null => {
  const savedToken = localStorage.getItem('token');
  if (!savedToken) return null;
  if (isTokenExpired(savedToken)) {
    localStorage.removeItem('token');
    return null;
  }
  return savedToken;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readValidToken);

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  useEffect(() => {
    const checkToken = () => setToken(readValidToken());
    window.addEventListener('focus', checkToken);
    window.addEventListener('storage', checkToken);
    return () => {
      window.removeEventListener('focus', checkToken);
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const expiry = decodeExpiryMs(token);
    if (expiry === null) return;
    const msUntilExpiry = expiry - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }
    const timer = window.setTimeout(logout, msUntilExpiry);
    return () => window.clearTimeout(timer);
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.get('/auth/profile').catch((err) => {
      if (!cancelled && err?.response?.status === 401) {
        logout();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = token !== null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
