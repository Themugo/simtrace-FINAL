"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, saveToken, clearToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("simtrace_token");
    if (!token) { setLoading(false); return; }
    api.me()
      .then(setUser)
      .catch(clearToken)
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh token every 6 hours — keeps session alive without re-login
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(async () => {
      try {
        const { token } = await api.refreshToken();
        if (token) saveToken(token);
      } catch { /* token expired — user will be logged out naturally on next request */ }
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user]);

  async function login(email, password) {
    const data = await api.login({ email, password });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password, phone) {
    const data = await api.register({ name, email, password, ...(phone ? { phone } : {}) });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
