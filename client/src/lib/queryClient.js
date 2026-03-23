import { QueryClient } from "@tanstack/react-query";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
export function resolveUrl(url) {
    if (!url || url.startsWith("http") || url.startsWith("//") || url.startsWith("data:"))
        return url;
    return `${API_BASE}${url}`;
}
export function resolveImg(url) {
    if (!url)
        return "";
    if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:"))
        return url;
    return `${API_BASE}${url}`;
}
function fixUploadsUrls(data) {
    if (!API_BASE)
        return data;
    if (typeof data === "string") {
        if (data.startsWith("/uploads/"))
            return `${API_BASE}${data}`;
        return data;
    }
    if (Array.isArray(data))
        return data.map(fixUploadsUrls);
    if (data && typeof data === "object") {
        const out = {};
        for (const k in data)
            out[k] = fixUploadsUrls(data[k]);
        return out;
    }
    return data;
}
async function parseErrorMessage(res) {
    const body = await res.text();
    try {
        const parsed = JSON.parse(body);
        return parsed.message || parsed.error || body;
    }
    catch {
        return body || res.statusText;
    }
}
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const message = await parseErrorMessage(res);
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }
}
const TOKEN_KEY = "maweja_auth_token";
const ROLE_KEY = "maweja_role";
export function getUserRole() {
    return localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY) || "client";
}
export function setUserRole(role) {
    localStorage.setItem(ROLE_KEY, role);
    sessionStorage.setItem(ROLE_KEY, role);
}
export function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function setAuthToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    else {
        localStorage.removeItem(TOKEN_KEY);
    }
}
function buildAuthHeaders(extra) {
    const headers = {
        "X-User-Role": getUserRole(),
        ...extra,
    };
    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}
export function authFetch(url, options) {
    const { headers: extraHeaders, ...rest } = options || {};
    return fetch(resolveUrl(url), {
        credentials: "include",
        ...rest,
        headers: buildAuthHeaders(extraHeaders || {}),
    });
}
export async function authFetchJson(url, options) {
    const res = await authFetch(url, options);
    if (!res.ok) {
        const message = await parseErrorMessage(res);
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }
    const json = await res.json();
    return fixUploadsUrls(json);
}
export async function apiRequest(url, options) {
    const existingHeaders = options?.headers || {};
    const res = await fetch(resolveUrl(url), {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(existingHeaders),
        },
        credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
}
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: async ({ queryKey }) => {
                const res = await fetch(resolveUrl(queryKey[0]), {
                    credentials: "include",
                    headers: buildAuthHeaders(),
                });
                await throwIfResNotOk(res);
                const json = await res.json();
                return fixUploadsUrls(json);
            },
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: 30000,
            retry: false,
        },
    },
});
//# sourceMappingURL=queryClient.js.map