import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

export function resolveUrl(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("//") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
}

export function resolveImg(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
}

function fixUploadsUrls(data: any): any {
  if (!API_BASE) return data;
  if (typeof data === "string") {
    if (data.startsWith("/uploads/") || data.startsWith("/cloud/")) return `${API_BASE}${data}`;
    return data;
  }
  if (Array.isArray(data)) return data.map(fixUploadsUrls);
  if (data && typeof data === "object") {
    const out: Record<string, any> = {};
    for (const k in data) out[k] = fixUploadsUrls(data[k]);
    return out;
  }
  return data;
}

async function parseErrorMessage(res: Response): Promise<string> {
  const body = await res.text();
  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.error || body;
  } catch {
    return body || res.statusText;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  }
}

const TOKEN_KEY = "maweja_auth_token";
const ROLE_KEY = "maweja_role";

export function getUserRole(): string {
  return localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY) || "client";
}

export function setUserRole(role: string) {
  localStorage.setItem(ROLE_KEY, role);
  sessionStorage.setItem(ROLE_KEY, role);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "X-User-Role": getUserRole(),
    ...extra,
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const { headers: extraHeaders, ...rest } = options || {};
  return fetch(resolveUrl(url), {
    credentials: "include",
    ...rest,
    headers: buildAuthHeaders(extraHeaders as Record<string, string> || {}),
  });
}

export async function authFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(url, options);
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  }
  const json = await res.json();
  return fixUploadsUrls(json) as T;
}

export async function apiRequest(url: string, options?: RequestInit) {
  const existingHeaders = options?.headers as Record<string, string> || {};
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

// ─── Stale time constants ─────────────────────────────────────────────────────
// Use these in individual useQuery calls to override the default for static data.
export const STALE = {
  /** Data that changes frequently (orders, notifications, wallet). Default. */
  dynamic: 60_000,
  /** Semi-static data: restaurants list, menus, zones, categories. */
  semi: 3 * 60_000,
  /** Truly static data: settings, service categories (rarely changes). */
  static: 10 * 60_000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }: QueryFunctionContext) => {
        const res = await fetch(resolveUrl(queryKey[0] as string), {
          credentials: "include",
          headers: buildAuthHeaders(),
        });
        await throwIfResNotOk(res);
        const json = await res.json();
        return fixUploadsUrls(json);
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // 1 min default — data stays "fresh" for 1 min after fetching.
      // Navigating back to a page within 1 min shows cached data instantly.
      staleTime: STALE.dynamic,
      // Keep unused data in memory for 10 min (helps fast back-navigation).
      gcTime: 10 * 60_000,
      retry: false,
    },
  },
});
