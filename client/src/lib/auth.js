import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
function detectRoleFromPath() {
    const path = window.location.pathname;
    if (path.startsWith("/admin"))
        return "admin";
    if (path.startsWith("/driver"))
        return "driver";
    return "client";
}
function initRole() {
    const stored = sessionStorage.getItem("maweja_role");
    if (stored)
        return stored;
    const detected = detectRoleFromPath();
    sessionStorage.setItem("maweja_role", detected);
    return detected;
}
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const role = initRole();
        fetch("/api/auth/me", {
            credentials: "include",
            headers: { "X-User-Role": role },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((u) => setUser(u))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    const login = async (email, password, expectedRole) => {
        const role = expectedRole || "client";
        sessionStorage.setItem("maweja_role", role);
        const res = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password, expectedRole }),
        });
        const u = await res.json();
        setUser(u);
    };
    const register = async (data) => {
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
    return (_jsx(AuthContext.Provider, { value: { user, loading, login, register, logout, setUser }, children: children }));
}
export const useAuth = () => useContext(AuthContext);
//# sourceMappingURL=auth.js.map