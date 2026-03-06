import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
}

export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }: QueryFunctionContext) => {
        const res = await fetch(queryKey[0] as string, { credentials: "include" });
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
