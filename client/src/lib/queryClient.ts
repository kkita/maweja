import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

export function resolveUrl(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("//")) return url;
  return `${API_BASE}${url}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
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
        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: false,
    },
  },
});
