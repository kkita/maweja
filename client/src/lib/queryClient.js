import { QueryClient } from "@tanstack/react-query";
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const body = await res.text();
        throw new Error(body || res.statusText);
    }
}
export function getUserRole() {
    return sessionStorage.getItem("maweja_role") || "client";
}
export function authFetch(url, options) {
    const { headers: extraHeaders, ...rest } = options || {};
    return fetch(url, {
        credentials: "include",
        ...rest,
        headers: { "X-User-Role": getUserRole(), ...(extraHeaders || {}) },
    });
}
export async function apiRequest(url, options) {
    const existingHeaders = options?.headers || {};
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-User-Role": getUserRole(),
            ...existingHeaders,
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
                const res = await fetch(queryKey[0], {
                    credentials: "include",
                    headers: { "X-User-Role": getUserRole() },
                });
                await throwIfResNotOk(res);
                return res.json();
            },
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: 30000,
            retry: false,
        },
    },
});
//# sourceMappingURL=queryClient.js.map