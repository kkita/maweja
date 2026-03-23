import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest, setAuthToken, setUserRole, getAuthToken } from "./queryClient";
function detectRoleFromPath() {
    const path = window.location.pathname;
    if (path.startsWith("/admin"))
        return "admin";
    if (path.startsWith("/driver"))
        return "driver";
    return "client";
}
function initRole() {
    // Check localStorage first (persistent), then sessionStorage, then detect from path
    const storedLocal = localStorage.getItem("maweja_role");
    if (storedLocal)
        return storedLocal;
    const storedSession = sessionStorage.getItem("maweja_role");
    if (storedSession)
        return storedSession;
    const detected = detectRoleFromPath();
    setUserRole(detected);
    return detected;
}
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchMe = async () => {
        const role = initRole();
        const token = getAuthToken();
        try {
            const headers = { "X-User-Role": role };
            if (token)
                headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch((import.meta.env.VITE_API_BASE_URL || "") + "/api/auth/me", {
                credentials: "include",
                headers,
            });
            if (res.ok) {
                const u = await res.json();
                // Persist token if returned (from fresh login on another device)
                if (u.authToken)
                    setAuthToken(u.authToken);
                setUser(u);
            }
            else if (res.status !== 401 && res.status !== 403) {
                // Network/server error — keep existing user state
            }
            else {
                setUser(null);
                setAuthToken(null);
            }
        }
        catch {
            // Network error — keep existing user state (don't log out on network failure)
        }
    };
    useEffect(() => {
        fetchMe().finally(() => setLoading(false));
    }, []);
    const refreshUser = async () => {
        await fetchMe();
    };
    const login = async (email, password, expectedRole) => {
        const role = expectedRole || "client";
        setUserRole(role);
        const res = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password, expectedRole }),
        });
        const u = await res.json();
        // Store token persistently for mobile APK sessions
        if (u.authToken)
            setAuthToken(u.authToken);
        setUser(u);
    };
    const register = async (data) => {
        setUserRole("client");
        const res = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
        const u = await res.json();
        // Store token persistently for mobile APK sessions
        if (u.authToken)
            setAuthToken(u.authToken);
        setUser(u);
    };
    const logout = async () => {
        await apiRequest("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("maweja_role");
        sessionStorage.removeItem("maweja_role");
        setAuthToken(null);
        setUser(null);
    };
    return (_jsx(AuthContext.Provider, { value: { user, loading, login, register, logout, setUser, refreshUser }, children: children }));
}
export const useAuth = () => useContext(AuthContext);
//# sourceMappingURL=auth.js.map