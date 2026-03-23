import { type ReactNode } from "react";
import type { User } from "@shared/schema";
interface AuthContextType {
    user: Omit<User, "password"> | null;
    loading: boolean;
    login: (email: string, password: string, expectedRole?: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        name: string;
        phone: string;
        role?: string;
        address?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: Omit<User, "password"> | null) => void;
    refreshUser: () => Promise<void>;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
//# sourceMappingURL=auth.d.ts.map