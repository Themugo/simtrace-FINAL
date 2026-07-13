'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, saveToken, clearToken } from './api';

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  station?: string;
  operator?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (name: string, password: string, contact: { email?: string; phone?: string }) => Promise<User>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simtrace_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(setUser)
      .catch(clearToken)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const iv = setInterval(async () => {
      try {
        const { token } = await api.refreshToken();
        if (token) saveToken(token);
      } catch { /* token expired */ }
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user]);

  async function login(identifier: string, password: string): Promise<User> {
    const isEmail = identifier.includes('@');
    const data = await api.login(isEmail ? { email: identifier, password } : { phone: identifier, password });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name: string, password: string, contact: { email?: string; phone?: string }): Promise<User> {
    const data = await api.register({ name, password, ...contact });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout(): void {
    clearToken();
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx) as AuthContextType;
