import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone: string; role?: string; address?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: Omit<User, "password"> | null) => void;
}

function detectRoleFromPath(): string {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/driver")) return "driver";
  return "client";
}

function initRole(): string {
  const stored = sessionStorage.getItem("maweja_role");
  if (stored) return stored;
  const detected = detectRoleFromPath();
  sessionStorage.setItem("maweja_role", detected);
  return detected;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = initRole();
    fetch("/api/auth/me", {
      credentials: "include",
      headers: { "X-User-Role": role },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, expectedRole?: string) => {
    const role = expectedRole || "client";
    sessionStorage.setItem("maweja_role", role);
    const res = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, expectedRole }),
    });
    const u = await res.json();
    setUser(u);
  };

  const register = async (data: { email: string; password: string; name: string; phone: string; role?: string; address?: string }) => {
    sessionStorage.setItem("maweja_role", "client");
    const res = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const u = await res.json();
    setUser(u);
  };

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem("maweja_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
