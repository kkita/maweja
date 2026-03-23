import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext({
    theme: "auto",
    setTheme: () => { },
    resolvedTheme: "light",
});
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem("maweja_theme") || "auto";
    });
    const getResolved = (t) => {
        if (t === "auto") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return t;
    };
    const [resolvedTheme, setResolvedTheme] = useState(() => getResolved(theme));
    useEffect(() => {
        const apply = (t) => {
            const resolved = getResolved(t);
            setResolvedTheme(resolved);
            if (resolved === "dark") {
                document.documentElement.classList.add("dark");
            }
            else {
                document.documentElement.classList.remove("dark");
            }
        };
        apply(theme);
        if (theme === "auto") {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => apply("auto");
            mq.addEventListener("change", handler);
            return () => mq.removeEventListener("change", handler);
        }
    }, [theme]);
    const setTheme = (t) => {
        localStorage.setItem("maweja_theme", t);
        setThemeState(t);
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, setTheme, resolvedTheme }, children: children }));
}
export function useTheme() {
    return useContext(ThemeContext);
}
//# sourceMappingURL=theme.js.map