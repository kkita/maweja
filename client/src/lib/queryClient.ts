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
    if (data.startsWith("/uploads/")) return `${API_BASE}${data}`;
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

export function getUserRole(): string {
  return sessionStorage.getItem("maweja_role") || "client";
}

export function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const { headers: extraHeaders, ...rest } = options || {};
  return fetch(resolveUrl(url), {
    credentials: "include",
    ...rest,
    headers: { "X-User-Role": getUserRole(), ...(extraHeaders as Record<string, string> || {}) },
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
      queryFn: async ({ queryKey }: QueryFunctionContext) => {
        const res = await fetch(resolveUrl(queryKey[0] as string), {
          credentials: "include",
          headers: { "X-User-Role": getUserRole() },
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
