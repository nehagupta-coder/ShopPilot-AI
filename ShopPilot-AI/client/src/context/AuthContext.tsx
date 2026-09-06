import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../services/api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  mockAI: boolean;
  dbMode: string;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  demo: (kind: "customer" | "merchant") => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockAI, setMockAI] = useState(true);
  const [dbMode, setDbMode] = useState("memory");

  async function hydrate() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me.user);
      setMockAI(me.ai.mock);
      setDbMode(me.dbMode);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void hydrate();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      mockAI,
      dbMode,
      async login(email, password) {
        const res = await api.login({ email, password });
        setToken(res.token);
        setUser(res.user);
        return res.user;
      },
      async register(name, email, password) {
        const res = await api.register({ name, email, password });
        setToken(res.token);
        setUser(res.user);
        return res.user;
      },
      async demo(kind) {
        const res = await api.demo(kind);
        setToken(res.token);
        setUser(res.user);
        await hydrate();
        return res.user;
      },
      logout() {
        setToken(null);
        setUser(null);
      },
      refresh: hydrate,
    }),
    [user, loading, mockAI, dbMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
