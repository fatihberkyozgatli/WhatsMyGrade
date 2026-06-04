import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

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

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    return expirationTime < Date.now();
  } catch {
    return true;
  }
};

// Read a non-expired token from storage, clearing it if expired. Called both for
// the synchronous initial state and on focus/storage events.
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
  // Initialize synchronously from storage so the first render of a protected
  // route already knows the user is authenticated (avoids a redirect bounce /
  // lost deep link on refresh).
  const [token, setToken] = useState<string | null>(readValidToken);

  useEffect(() => {
    const checkToken = () => setToken(readValidToken());

    // Re-check when the tab regains focus, and keep auth state in sync across tabs.
    window.addEventListener('focus', checkToken);
    window.addEventListener('storage', checkToken);
    return () => {
      window.removeEventListener('focus', checkToken);
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

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
