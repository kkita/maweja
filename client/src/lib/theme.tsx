import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "auto",
  setTheme: () => {},
  resolvedTheme: "light",
});

/**
 * Synchronise les system bars natives (Android + iOS) avec le thème actif.
 * Utilise @capacitor/status-bar uniquement sur les plateformes natives
 * (Capacitor.isNativePlatform() = true), sans impact sur le web desktop.
 *
 * Mode clair  → style Light  (icônes foncées sur fond blanc)
 * Mode sombre → style Dark   (icônes claires sur fond sombre)
 *
 * Exportée pour permettre aux sections toujours sombres (ex : Driver app)
 * de forcer le mode sombre des barres indépendamment du thème global.
 */
export async function syncNativeStatusBar(resolved: "light" | "dark") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import("@capacitor/status-bar");

    if (resolved === "dark") {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#111111" });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    }
  } catch {
    // Plugin non disponible (build web ou plugin non sync) — silencieux
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("maweja_theme") as ThemeMode) || "auto";
  });

  const getResolved = (t: ThemeMode): "light" | "dark" => {
    if (t === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getResolved(theme));

  useEffect(() => {
    const apply = (t: ThemeMode) => {
      const resolved = getResolved(t);
      setResolvedTheme(resolved);

      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      syncNativeStatusBar(resolved);
    };

    apply(theme);

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    localStorage.setItem("maweja_theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
