import { QueryClient } from "@tanstack/react-query";
export declare function resolveUrl(url: string): string;
export declare function resolveImg(url: string | null | undefined): string;
export declare function getUserRole(): string;
export declare function setUserRole(role: string): void;
export declare function getAuthToken(): string | null;
export declare function setAuthToken(token: string | null): void;
export declare function authFetch(url: string, options?: RequestInit): Promise<Response>;
export declare function authFetchJson<T = any>(url: string, options?: RequestInit): Promise<T>;
export declare function apiRequest(url: string, options?: RequestInit): Promise<Response>;
export declare const queryClient: QueryClient;
//# sourceMappingURL=queryClient.d.ts.map