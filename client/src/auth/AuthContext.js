import React, { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const TOKEN_KEY = "ms_token";

export const AuthContext = createContext({
  token: null,
  user: null,
  loading: true,
  login: async () => {},
  verifyTwoFactorLogin: async () => {},
  signup: async () => {},
  refreshUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCurrentUser(activeToken = token) {
    if (!activeToken) {
      setUser(null);
      return null;
    }
    const res = await axios.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });
    const nextUser = res.data?.user || null;
    setUser(nextUser);
    return nextUser;
  }

  function persistSession(nextToken, nextUser) {
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    setUser(nextUser || null);
  }

  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      setLoading(true);
      try {
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        const res = await axios.get("/auth/me");
        if (!cancelled) setUser(res.data?.user || null);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      loading,
      login: async ({ email, password }) => {
        const res = await axios.post("/auth/login", { email, password });
        if (res.data?.requiresTwoFactor) {
          return res.data;
        }
        const nextToken = res.data?.token;
        persistSession(nextToken, res.data?.user || null);
        return res.data;
      },
      verifyTwoFactorLogin: async ({ twoFactorToken, code }) => {
        const res = await axios.post("/auth/2fa/verify-login", { twoFactorToken, code });
        const nextToken = res.data?.token;
        persistSession(nextToken, res.data?.user || null);
        return res.data;
      },
      signup: async ({ name, email, password }) => {
        const res = await axios.post("/auth/signup", { name, email, password });
        const nextToken = res.data?.token;
        persistSession(nextToken, res.data?.user || null);
        return res.data;
      },
      refreshUser: async () => {
        return loadCurrentUser();
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
      },
    };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

