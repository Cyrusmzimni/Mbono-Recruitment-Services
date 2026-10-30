import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, TOKEN_KEY, getToken, type User } from "./api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<{ pending?: boolean; message?: string; user?: User }>;
  logout: () => void;
  refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);
export const dashboardPath = (u: User | null) => (u ? `/dashboard/${u.role}` : "/signin");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const save = (token: string | null) => { try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
  const logout = useCallback(() => { save(null); setUser(null); }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); return; }
    try { setUser(await api<User>("/auth/me")); } catch { logout(); }
  }, [logout]);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);
  useEffect(() => {
    const h = () => logout();
    window.addEventListener("mbono:unauthorized", h);
    return () => window.removeEventListener("mbono:unauthorized", h);
  }, [logout]);

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/login", { method: "POST", json: { email, password } });
    save(r.token); setUser(r.user); return r.user;
  };
  const register = async (data: Record<string, string>) => {
    const r = await api<{ token?: string; user?: User; pending?: boolean; message?: string }>("/auth/register", { method: "POST", json: data });
    if (r.token && r.user) { save(r.token); setUser(r.user); }
    return r;
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

/** Route guard: requires sign-in and one of the given roles (RBAC on the client; the API enforces it too). */
export function RequireRole({ roles, children }: { roles: User["role"][]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-[60vh] place-items-center text-ink-500">Loading…</div>;
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to={dashboardPath(user)} replace />;
  return <>{children}</>;
}
