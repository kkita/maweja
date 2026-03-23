export type ThemeMode = "light" | "dark" | "auto";
interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (t: ThemeMode) => void;
    resolvedTheme: "light" | "dark";
}
export declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useTheme(): ThemeContextType;
export {};
//# sourceMappingURL=theme.d.ts.map