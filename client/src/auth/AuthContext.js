import React, { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const TOKEN_KEY = "ms_token";

export const AuthContext = createContext({
  token: null,
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const nextToken = res.data?.token;
        setToken(nextToken);
        localStorage.setItem(TOKEN_KEY, nextToken);
        setUser(res.data?.user || null);
      },
      signup: async ({ name, email, password }) => {
        const res = await axios.post("/auth/signup", { name, email, password });
        const nextToken = res.data?.token;
        setToken(nextToken);
        localStorage.setItem(TOKEN_KEY, nextToken);
        setUser(res.data?.user || null);
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

